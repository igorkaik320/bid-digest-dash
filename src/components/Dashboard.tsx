import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Search,
  Download,
  RefreshCw,
  DollarSign,
  ListChecks,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Cotacao } from "@/lib/parseRelatorio";
import { exportToXlsx } from "@/lib/parseRelatorio";
import { CotacaoDetailDialog } from "./CotacaoDetailDialog";

interface Props {
  cotacoes: Cotacao[];
  onReset: () => void;
}

type SortKey = "numero" | "comprador" | "obra" | "qtdFornecedores" | "status" | "valorTotal";

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function Dashboard({ cotacoes, onReset }: Props) {
  const [search, setSearch] = useState("");
  const [compradorFilter, setCompradorFilter] = useState("__all__");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("numero");
  const [sortAsc, setSortAsc] = useState(false);
  const [selected, setSelected] = useState<Cotacao | null>(null);

  const compradores = useMemo(
    () => Array.from(new Set(cotacoes.map((c) => c.comprador))).sort(),
    [cotacoes],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return cotacoes
      .filter((c) => {
        if (compradorFilter !== "__all__" && c.comprador !== compradorFilter) return false;
        if (statusFilter !== "all" && c.status !== statusFilter) return false;
        if (q && !String(c.numero).toLowerCase().includes(q) && !c.obra.toLowerCase().includes(q))
          return false;
        return true;
      })
      .sort((a, b) => {
        const va = a[sortKey];
        const vb = b[sortKey];
        let cmp = 0;
        if (typeof va === "number" && typeof vb === "number") cmp = va - vb;
        else cmp = String(va).localeCompare(String(vb), "pt-BR", { numeric: true });
        return sortAsc ? cmp : -cmp;
      });
  }, [cotacoes, search, compradorFilter, statusFilter, sortKey, sortAsc]);

  const stats = useMemo(() => {
    const total = cotacoes.length;
    const conformes = cotacoes.filter((c) => c.status === "Conforme").length;
    const pendentes = total - conformes;
    const valor = cotacoes.reduce((s, c) => s + c.valorTotal, 0);
    return { total, conformes, pendentes, valor };
  }, [cotacoes]);

  const chartData = useMemo(() => {
    const map = new Map<string, { comprador: string; Conforme: number; Pendente: number }>();
    for (const c of cotacoes) {
      const e = map.get(c.comprador) ?? { comprador: c.comprador, Conforme: 0, Pendente: 0 };
      e[c.status]++;
      map.set(c.comprador, e);
    }
    return Array.from(map.values()).sort((a, b) =>
      b.Conforme + b.Pendente - (a.Conforme + a.Pendente),
    );
  }, [cotacoes]);

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortAsc(!sortAsc);
    else {
      setSortKey(k);
      setSortAsc(true);
    }
  };

  const SortHead = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <th
      className="cursor-pointer select-none px-3 py-2 text-left font-semibold hover:bg-accent"
      onClick={() => toggleSort(k)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      </div>
    </th>
  );

  const pct = (n: number) => (stats.total ? Math.round((n / stats.total) * 100) : 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Análise de Cotações</h1>
          <p className="text-sm text-muted-foreground">
            {stats.total} cotações importadas do relatório
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => exportToXlsx(cotacoes)}>
            <Download className="mr-2 h-4 w-4" /> Exportar Excel
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Exportar PDF
          </Button>
          <Button variant="ghost" onClick={onReset}>
            <RefreshCw className="mr-2 h-4 w-4" /> Novo upload
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total de cotações"
          value={String(stats.total)}
          icon={<ListChecks className="h-5 w-5 text-primary" />}
        />
        <KpiCard
          title="Conformes (3+ fornec.)"
          value={`${stats.conformes}`}
          sub={`${pct(stats.conformes)}% do total`}
          icon={<CheckCircle2 className="h-5 w-5 text-success" />}
          accent="success"
        />
        <KpiCard
          title="Pendentes"
          value={`${stats.pendentes}`}
          sub={`${pct(stats.pendentes)}% do total`}
          icon={<AlertTriangle className="h-5 w-5 text-warning" />}
          accent="warning"
        />
        <KpiCard
          title="Valor total"
          value={fmt(stats.valor)}
          icon={<DollarSign className="h-5 w-5 text-primary" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cotações por comprador</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="comprador" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Legend />
                <Bar dataKey="Conforme" stackId="a" fill="var(--success)" />
                <Bar dataKey="Pendente" stackId="a" fill="var(--warning)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-base">Cotações</CardTitle>
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número ou obra..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={compradorFilter} onValueChange={setCompradorFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Comprador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos compradores</SelectItem>
                {compradores.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="Conforme">Conforme</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <SortHead k="numero">Cotação</SortHead>
                  <SortHead k="comprador">Comprador</SortHead>
                  <SortHead k="obra">Obra</SortHead>
                  <SortHead k="qtdFornecedores">Fornec.</SortHead>
                  <SortHead k="status">Status</SortHead>
                  <th
                    className="cursor-pointer select-none px-3 py-2 text-right font-semibold hover:bg-accent"
                    onClick={() => toggleSort("valorTotal")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Valor Total <ArrowUpDown className="h-3 w-3 opacity-50" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const conforme = c.status === "Conforme";
                  return (
                    <tr
                      key={`${c.numero}-${i}`}
                      onClick={() => setSelected(c)}
                      className={`cursor-pointer border-t transition-colors hover:bg-accent ${
                        conforme
                          ? "bg-[color-mix(in_oklch,var(--success)_8%,transparent)]"
                          : "bg-[color-mix(in_oklch,var(--warning)_10%,transparent)]"
                      }`}
                    >
                      <td className="px-3 py-2 font-medium">{c.numero}</td>
                      <td className="px-3 py-2">{c.comprador}</td>
                      <td className="px-3 py-2 max-w-[420px] truncate" title={c.obra}>
                        {c.obra}
                      </td>
                      <td className="px-3 py-2 text-center tabular-nums">{c.qtdFornecedores}</td>
                      <td className="px-3 py-2">
                        <Badge
                          className={
                            conforme
                              ? "bg-success text-success-foreground hover:bg-success/90"
                              : "bg-warning text-warning-foreground hover:bg-warning/90"
                          }
                        >
                          {conforme ? "✔ Conforme" : "⚠ Pendente"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmt(c.valorTotal)}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                      Nenhuma cotação encontrada com os filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <CotacaoDetailDialog cotacao={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function KpiCard({
  title,
  value,
  sub,
  icon,
  accent,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: "success" | "warning";
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
            <p
              className={`mt-2 text-2xl font-bold tabular-nums ${
                accent === "success"
                  ? "text-success"
                  : accent === "warning"
                    ? "text-warning"
                    : "text-foreground"
              }`}
            >
              {value}
            </p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className="rounded-md bg-muted p-2">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
