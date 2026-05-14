import type { Cotacao } from "./parseRelatorio";
import { mockCotacoes } from "./mockData";

const KEY = "cotacoes-data";

export function saveCotacoes(c: Cotacao[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(c));
}

export function loadCotacoes(): Cotacao[] {
  if (typeof window === "undefined") return mockCotacoes;
  const raw = localStorage.getItem(KEY);
  if (!raw) return mockCotacoes;
  try {
    return JSON.parse(raw) as Cotacao[];
  } catch {
    return mockCotacoes;
  }
}

export function clearCotacoes(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
