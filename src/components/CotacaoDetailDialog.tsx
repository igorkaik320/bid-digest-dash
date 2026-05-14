import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import type { Cotacao } from "@/lib/parseRelatorio";

interface Props {
  cotacao: Cotacao | null;
  onClose: () => void;
}

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function CotacaoDetailDialog({ cotacao, onClose }: Props) {
  if (!cotacao) return null;
  const menor = Math.min(...cotacao.fornecedores.map((f) => f.total));

  return (
    <Dialog open={!!cotacao} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Cotação #{cotacao.numero}
            <Badge
              className={
                cotacao.status === "Conforme"
                  ? "bg-success text-success-foreground"
                  : "bg-warning text-warning-foreground"
              }
            >
              {cotacao.status === "Conforme" ? "✔ Conforme" : "⚠ Pendente"}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Comprador:</span>{" "}
              <span className="font-medium">{cotacao.comprador}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-muted-foreground">Obra:</span>{" "}
              <span className="font-medium">{cotacao.obra}</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Fornecedor</th>
                  <th className="px-3 py-2 text-right font-semibold">Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {cotacao.fornecedores.map((f, i) => {
                  const isMin = f.total === menor;
                  return (
                    <tr key={i} className="border-t even:bg-muted/30">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {isMin && <Trophy className="h-4 w-4 text-success" />}
                          <span className={isMin ? "font-semibold" : ""}>{f.nome}</span>
                        </div>
                      </td>
                      <td
                        className={`px-3 py-2 text-right tabular-nums ${
                          isMin ? "font-semibold text-success" : ""
                        }`}
                      >
                        {fmt(f.total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted">
                  <td className="px-3 py-2 font-semibold">Total</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    {fmt(cotacao.valorTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
