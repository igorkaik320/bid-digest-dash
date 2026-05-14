import { createFileRoute, Link } from "@tanstack/react-router";
import { UploadPanel } from "@/components/UploadPanel";
import { Toaster } from "@/components/ui/sonner";
import { BarChart3 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Análise de Cotações — Construtora" },
      {
        name: "description",
        content:
          "Importe o relatório mensal de cotações e analise conformidade de fornecedores em tempo real.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary p-2 text-primary-foreground">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold">Análise de Cotações</h1>
              <p className="text-xs text-muted-foreground">Construtora · Suprimentos</p>
            </div>
          </div>
          <Link
            to="/dashboard"
            className="text-sm font-medium text-primary hover:underline"
          >
            Ir ao dashboard →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Importe o relatório mensal e veja a análise instantânea
          </h2>
          <p className="mt-3 text-muted-foreground">
            O sistema lê o arquivo .xlsx exportado, identifica cotações com 3 ou mais fornecedores
            e destaca as pendentes.
          </p>
        </div>
        <UploadPanel />
      </main>
    </div>
  );
}
