import type { CreateTripInput } from "@/domain/trip";
import type { ParticipantOutput } from "@/domain/participant";
import { normalizeText } from "@/lib/text";

// Spec 6.1 — verbatim
export function validateCreateTripInput(input: CreateTripInput): string[] {
  const errors: string[] = [];

  if (!input.name?.trim()) errors.push("El nombre del viaje es obligatorio.");
  if (!input.destination?.trim()) errors.push("El destino es obligatorio.");
  if (!input.createdByUserId?.trim()) errors.push("El creador del viaje es obligatorio.");
  if (!input.participants || input.participants.length === 0) {
    errors.push("Agregá al menos un integrante.");
  }

  return errors;
}

// Spec 6.2
export function validateNewParticipants(
  participants: Array<{ name: string; email?: string; phone?: string }>
): string[] {
  const errors: string[] = [];
  participants.forEach((participant) => {
    if (!participant.name?.trim()) {
      errors.push("Cada integrante necesita un nombre.");
    }
  });
  return errors;
}

// Spec 6.2 — "no crear participantes duplicados con el mismo nombre
// normalizado dentro del mismo viaje sin advertencia; permitir homónimos
// sólo si el usuario confirma".
export function findDuplicateParticipantNames(
  existingParticipants: ParticipantOutput[],
  newNames: string[]
): string[] {
  const existingNormalized = existingParticipants.map((p) => normalizeText(p.name));
  return newNames.filter((name) => existingNormalized.includes(normalizeText(name)));
}
