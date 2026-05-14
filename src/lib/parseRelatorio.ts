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

  for (let i = 0; i < rows.length; i++) {
    if (asString(getCell(rows[i], 0)) !== "Cotação") continue;
    const anchor = i;

    const numero = asString(getCell(rows[anchor], 3)) || asString(getCell(rows[anchor], 4));
    const comprador = asString(getCell(rows[anchor], 6)) || asString(getCell(rows[anchor], 7));
    const obra = asString(getCell(rows[anchor + 2], 3)) || asString(getCell(rows[anchor + 2], 4));

    const nomesFantasia = fornecedoresCols.map((c) => asString(getCell(rows[anchor + 3], c)));

    let totalCotacaoRow: number | null = null;
    const limit = Math.min(rows.length, anchor + 200);
    for (let j = anchor + 7; j < limit; j++) {
      if (asString(getCell(rows[j], 0)) === "Total da cotação") {
        totalCotacaoRow = j;
        break;
      }
      if (j > anchor + 7 && asString(getCell(rows[j], 0)) === "Cotação") break;
    }

    if (totalCotacaoRow === null) continue;

    const totais = fornecedoresCols.map((c) => asNumber(getCell(rows[totalCotacaoRow!], c)));
    const fornecedores: FornecedorCotacao[] = nomesFantasia
      .map((nome, idx) => ({ nome, total: totais[idx] }))
      .filter((f) => f.total !== null && f.nome)
      .map((f) => ({ nome: f.nome, total: f.total as number }));

    const qtd = fornecedores.length;
    const valorTotal = fornecedores.reduce((s, f) => s + f.total, 0);

    cotacoes.push({
      numero: numero || `#${anchor}`,
      comprador: comprador || "—",
      obra: obra || "—",
      fornecedores,
      qtdFornecedores: qtd,
      tem3MaisFornecedores: qtd >= 3,
      valorTotal,
      status: qtd >= 3 ? "Conforme" : "Pendente",
    });
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
