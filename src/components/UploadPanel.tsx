import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Upload, FileSpreadsheet, Loader2, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { parseXlsxFile } from "@/lib/parseRelatorio";
import { saveCotacoes } from "@/lib/cotacoesStore";
import { mockCotacoes } from "@/lib/mockData";
import { toast } from "sonner";

export function UploadPanel() {
  const navigate = useNavigate();
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setLoading(true);
      try {
        const cotacoes = await parseXlsxFile(file);
        if (cotacoes.length === 0) {
          toast.error("Nenhuma cotação encontrada no arquivo.");
          return;
        }
        saveCotacoes(cotacoes);
        toast.success(`${cotacoes.length} cotações importadas.`);
        navigate({ to: "/dashboard" });
      } catch (e) {
        console.error(e);
        toast.error("Erro ao processar o arquivo.");
      } finally {
        setLoading(false);
      }
    },
    [navigate],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const useMock = () => {
    saveCotacoes(mockCotacoes);
    toast.success("Dados de exemplo carregados.");
    navigate({ to: "/dashboard" });
  };

  return (
    <Card className="mx-auto max-w-2xl p-8">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30"
        }`}
      >
        {loading ? (
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        ) : (
          <FileSpreadsheet className="h-12 w-12 text-primary" />
        )}
        <h3 className="mt-4 text-lg font-semibold">
          Importe o Relatório de Cotações exportado do sistema
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Arraste o arquivo .xlsx aqui ou selecione manualmente
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <label>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <Button asChild disabled={loading}>
              <span>
                <Upload className="mr-2 h-4 w-4" /> Selecionar arquivo
              </span>
            </Button>
          </label>
          <Button variant="outline" onClick={useMock} disabled={loading}>
            <Database className="mr-2 h-4 w-4" /> Usar dados de exemplo
          </Button>
        </div>
      </div>
    </Card>
  );
}
