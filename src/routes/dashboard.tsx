import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { Dashboard } from "@/components/Dashboard";
import { Toaster } from "@/components/ui/sonner";
import { loadCotacoes, clearCotacoes } from "@/lib/cotacoesStore";
import type { Cotacao } from "@/lib/parseRelatorio";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Análise de Cotações" },
      { name: "description", content: "Dashboard de análise de cotações e fornecedores." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const [cotacoes, setCotacoes] = useState<Cotacao[] | null>(null);

  useEffect(() => {
    setCotacoes(loadCotacoes());
  }, []);

  if (!cotacoes) return null;

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="rounded-md bg-primary p-2 text-primary-foreground">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold">Análise de Cotações</h1>
              <p className="text-xs text-muted-foreground">Construtora · Suprimentos</p>
            </div>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Dashboard
          cotacoes={cotacoes}
          onReset={() => {
            clearCotacoes();
            navigate({ to: "/" });
          }}
        />
      </main>
    </div>
  );
}
