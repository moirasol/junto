export function nowIso(): string {
  return new Date().toISOString();
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Usado por la detección de gasto duplicado (spec 4.5.9 / 5.6): "fecha cercana".
// El spec no define la ventana exacta; se asume 48hs como heurística razonable.
export function hoursBetween(isoA: string, isoB: string): number {
  const diffMs = Math.abs(new Date(isoA).getTime() - new Date(isoB).getTime());
  return diffMs / (1000 * 60 * 60);
}
