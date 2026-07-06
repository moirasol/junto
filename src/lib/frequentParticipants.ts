import { listTrips } from "./storage";
import { normalizeText } from "./text";

// Sugiere nombres de gente con la que ya viajaste, contando cuántas veces
// aparece como integrante en tus viajes anteriores (en este navegador: no
// hay cuentas reales, así que esto no es gente "logueada", es sólo texto
// que ya escribiste antes). Sirve para no re-tipear siempre los mismos
// nombres al crear un viaje nuevo.
export function getFrequentParticipantNames(excludeNames: string[] = [], limit = 6): string[] {
  const excluded = new Set(excludeNames.map((n) => normalizeText(n)).filter(Boolean));
  const counts = new Map<string, { label: string; count: number }>();

  for (const trip of listTrips()) {
    for (const participant of trip.participants) {
      const key = normalizeText(participant.name);
      if (!key || excluded.has(key)) continue;
      const entry = counts.get(key);
      if (entry) {
        entry.count += 1;
      } else {
        counts.set(key, { label: participant.name, count: 1 });
      }
    }
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((entry) => entry.label);
}
