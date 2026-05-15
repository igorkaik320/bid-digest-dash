export interface FornecedorCotacao {
  nome: string;
  total: number;
}

export interface Cotacao {
  numero: string | number;
  comprador: string;
  obra: string;
  fornecedores: FornecedorCotacao[];
  qtdFornecedores: number;
  tem3MaisFornecedores: boolean;
  valorTotal: number;
  status: "Conforme" | "Pendente";
}

type Row = unknown[];

function getCell(row: Row | undefined, col: number): unknown {
  if (!row) return null;
  const v = row[col];
  return v === undefined ? null : v;
}

function asString(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function asNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/\./g, "").replace(",", "."));
  if (!isFinite(n) || isNaN(n) || n <= 0) return null;
  return n;
}

export function parseRelatorio(rows: Row[]): Cotacao[] {
  const cotacoes: Cotacao[] = [];
  const fornecedoresCols = [8, 10, 12, 14];

  function buildBlock(
    obraRow: number,
    fornecedoresRow: number,
    numero: string,
    comprador: string,
  ): { cotacao: Cotacao; totalRow: number } | null {
    const obra =
      asString(getCell(rows[obraRow], 3)) || asString(getCell(rows[obraRow], 4));
    const nomesFantasia = fornecedoresCols.map((c, idx) => {
      const nomeFantasia = asString(getCell(rows[fornecedoresRow], c));
      const razaoSocial = asString(getCell(rows[fornecedoresRow + 1], c));
      return nomeFantasia || razaoSocial || `Fornecedor ${idx + 1}`;
    });

    let totalCotacaoRow: number | null = null;
    const limit = Math.min(rows.length, fornecedoresRow + 200);
    for (let j = fornecedoresRow + 1; j < limit; j++) {
      const c0 = asString(getCell(rows[j], 0));
      if (c0 === "Total da cotação") {
        totalCotacaoRow = j;
        break;
      }
      if (c0 === "Cotação" || c0 === "Obra") break;
    }
    if (totalCotacaoRow === null) return null;

    // Source of truth for supplier existence: numeric value > 0 in "Total da cotação"
    const totais = fornecedoresCols.map((c) =>
      asNumber(getCell(rows[totalCotacaoRow!], c)),
    );
    const fornecedores: FornecedorCotacao[] = totais
      .map((total, idx) => ({ nome: nomesFantasia[idx], total }))
      .filter((f) => f.total !== null)
      .map((f) => ({ nome: f.nome, total: f.total as number }));

    const qtd = fornecedores.length;
    const valorTotal = fornecedores.reduce((s, f) => s + f.total, 0);

    return {
      totalRow: totalCotacaoRow,
      cotacao: {
        numero: numero || `#${obraRow}`,
        comprador: comprador || "—",
        obra: obra || "—",
        fornecedores,
        qtdFornecedores: qtd,
        tem3MaisFornecedores: qtd >= 3,
        valorTotal,
        status: qtd >= 3 ? "Conforme" : "Pendente",
      },
    };
  }

  for (let i = 0; i < rows.length; i++) {
    if (asString(getCell(rows[i], 0)) !== "Cotação") continue;
    const anchor = i;

    const numero =
      asString(getCell(rows[anchor], 3)) || asString(getCell(rows[anchor], 4));
    const comprador =
      asString(getCell(rows[anchor], 6)) || asString(getCell(rows[anchor], 7));

    // First block: Cotação row -> Obra at +2 -> fornecedores at +3
    const first = buildBlock(anchor + 2, anchor + 3, numero, comprador);
    if (!first) continue;
    cotacoes.push(first.cotacao);

    // Look for continuation blocks: 'Obra' rows after the total but before next 'Cotação'
    let cursor = first.totalRow + 1;
    while (cursor < rows.length) {
      const c0 = asString(getCell(rows[cursor], 0));
      if (c0 === "Cotação") break;
      if (c0 === "Obra") {
        const cont = buildBlock(cursor, cursor + 1, numero, comprador);
        if (!cont) break;
        cotacoes.push(cont.cotacao);
        cursor = cont.totalRow + 1;
        continue;
      }
      cursor++;
    }
    i = cursor - 1;
  }

  return cotacoes;
}

export async function parseXlsxFile(file: File): Promise<Cotacao[]> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName =
    wb.SheetNames.find((n) => n.toLowerCase().includes("relat")) ?? wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null, raw: true });
  return parseRelatorio(rows);
}

export async function exportToXlsx(cotacoes: Cotacao[]): Promise<void> {
  const XLSX = await import("xlsx");
  const data = cotacoes.map((c) => ({
    Cotação: c.numero,
    Comprador: c.comprador,
    Obra: c.obra,
    "Qtd Fornecedores": c.qtdFornecedores,
    Status: c.status,
    "Valor Total (R$)": c.valorTotal,
    Fornecedores: c.fornecedores.map((f) => `${f.nome}: ${f.total.toFixed(2)}`).join(" | "),
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Análise");
  XLSX.writeFile(wb, "analise-cotacoes.xlsx");
}
