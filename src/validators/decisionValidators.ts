import type {
  CreateDecisionInput,
  ConfirmDecisionInput,
  DecisionOutput,
  VoteInput,
} from "@/domain/decision";
import type { ParticipantOutput } from "@/domain/participant";

const VALID_TYPES = ["dates", "accommodation", "transport"];

// Spec 6.3
export function validateCreateDecisionInput(input: CreateDecisionInput): string[] {
  const errors: string[] = [];

  if (!VALID_TYPES.includes(input.type)) errors.push("El tipo de decisión no es válido.");
  if (!input.options || input.options.length < 2) {
    errors.push("Agregá al menos dos opciones.");
  }
  input.options?.forEach((option) => {
    if (!option.label?.trim()) errors.push("Todas las opciones necesitan un texto.");
  });

  return errors;
}

// Spec 6.3
export function validateVoteInput(
  input: VoteInput,
  decision: DecisionOutput | undefined,
  participants: ParticipantOutput[]
): string[] {
  const errors: string[] = [];

  if (!decision) {
    errors.push("La decisión no existe.");
    return errors;
  }
  if (!input.participantId?.trim()) errors.push("Falta indicar quién vota.");

  const votingParticipant = participants.find((p) => p.id === input.participantId);
  if (!votingParticipant) errors.push("Ese participante no pertenece a este viaje.");
  else if (votingParticipant.status !== "accepted") {
    errors.push("Sólo pueden votar los integrantes que confirmaron que van.");
  }

  const optionExists = decision.options.some((o) => o.id === input.optionId);
  if (!optionExists) errors.push("Esa opción no existe en esta decisión.");

  if (decision.status === "confirmed") {
    errors.push("Esta decisión ya está confirmada. No se puede volver a votar.");
  }

  if (decision.status === "needs_review") {
    errors.push("Esta decisión necesita revisión del grupo antes de volver a votarse.");
  }

  return errors;
}

// Spec 6.3
export function validateConfirmDecisionInput(input: ConfirmDecisionInput): string[] {
  const errors: string[] = [];
  if (input.explicitConfirmation !== true) {
    errors.push("Falta la confirmación explícita del grupo.");
  }
  return errors;
}
