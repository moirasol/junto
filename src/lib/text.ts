export function joinWithY(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0]!;
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}

export function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Heurística simple de similitud (no definida por el spec) para detectar
// posibles gastos duplicados (4.5.9 / 5.6): igualdad exacta tras normalizar,
// o una cadena contenida dentro de la otra.
export function isSimilarDescription(a: string, b: string): boolean {
  const normA = normalizeText(a);
  const normB = normalizeText(b);
  if (!normA || !normB) return false;
  if (normA === normB) return true;
  return normA.includes(normB) || normB.includes(normA);
}
