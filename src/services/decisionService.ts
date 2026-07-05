import type {
  ConfirmDecisionInput,
  CreateDecisionInput,
  DecisionOptionOutput,
  DecisionOutput,
  VoteInput,
} from "@/domain/decision";
import { getDecisionDisplayTitle, hasSimpleMajority } from "@/domain/decision";
import type { TripOutput } from "@/domain/trip";
import { generateId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";
import {
  getTrip,
  saveTrip,
  recordDecisionActivity,
  getDecisionActivityForTrip,
} from "@/lib/storage";
import {
  validateConfirmDecisionInput,
  validateCreateDecisionInput,
  validateVoteInput,
} from "@/validators/decisionValidators";
import { summarizeDecision } from "./aiCommandService";
import { refreshTripReadyStatus } from "./tripService";
import { fail, ok, type ServiceResult } from "./result";

// Spec 4.3.6 — calcular participación con participantes en estado accepted.
function acceptedParticipantIds(trip: TripOutput): string[] {
  return trip.participants.filter((p) => p.status === "accepted").map((p) => p.id);
}

function recomputeDecision(decision: DecisionOutput, trip: TripOutput): DecisionOutput {
  const accepted = acceptedParticipantIds(trip);

  const options: DecisionOptionOutput[] = decision.options.map((option) => ({
    ...option,
    voteCount: decision.votes.filter((v) => v.optionId === option.id).length,
  }));

  const maxVotes = Math.max(0, ...options.map((o) => o.voteCount));
  const topOptions = options.filter((o) => maxVotes > 0 && o.voteCount === maxVotes);
  options.forEach((option) => {
    option.isTopOption = topOptions.includes(option);
  });

  const votedParticipantIds = new Set(decision.votes.map((v) => v.participantId));
  const missingParticipantIds = accepted.filter((id) => !votedParticipantIds.has(id));

  const participation = {
    totalParticipants: accepted.length,
    votedParticipants: accepted.filter((id) => votedParticipantIds.has(id)).length,
    missingParticipantIds,
    participationRate: accepted.length === 0 ? 0 : votedParticipantIds.size / accepted.length,
  };

  // Spec 4.3.9-12 / 7.8 — mayoría simple: una opción cierra la decisión
  // cuando supera el 50% de los votos ya emitidos (no del total de
  // aceptados). minimumParticipation queda en el input por compatibilidad
  // pero la regla de status no lo usa.
  let status = decision.status;
  if (status !== "confirmed" && status !== "needs_review") {
    const hasTie = topOptions.length > 1;
    const topHasMajority = maxVotes > 0 && hasSimpleMajority(maxVotes, decision.votes.length);

    if (hasTie) {
      // Spec 5.2 — empate: marcar blocked, no elegir automáticamente.
      status = "blocked";
    } else if (topHasMajority) {
      status = "ready_to_confirm";
    } else {
      status = "open";
    }
  }

  const updated: DecisionOutput = {
    ...decision,
    options,
    participation,
    status,
    updatedAt: nowIso(),
  };

  updated.aiSummary = summarizeDecision(updated);
  return updated;
}

// Spec 5.4 / 4.3.12 — un participante abandona el viaje: se recalcula la
// participación de todas las decisiones y se marcan como needs_review las
// que tenían un voto de quien se fue. No se reabre nada automáticamente más
// allá de ese marcado (el grupo decide qué hacer desde ahí).
export function applyParticipantLeftToDecisions(
  trip: TripOutput,
  leftParticipantId: string
): string[] {
  const affectedDecisionIds: string[] = [];

  trip.decisions = trip.decisions.map((decision) => {
    const hadVoted = decision.votes.some((v) => v.participantId === leftParticipantId);
    let updated = recomputeDecision(decision, trip);

    if (hadVoted) {
      updated = {
        ...updated,
        status: "needs_review",
        updatedAt: nowIso(),
      };
      updated.aiSummary =
        "Alguien que votó acá salió del viaje. Revisá si esta decisión sigue siendo válida.";
      affectedDecisionIds.push(updated.id);
    }

    return updated;
  });

  return affectedDecisionIds;
}

const LOGISTICS_TYPES = ["accommodation", "transport"] as const;

// Spec 5.5 — LATE_PARTICIPANT_ADDED: si alguien se suma y acepta después de
// que alojamiento o transporte ya estaban confirmados, esas decisiones
// pueden necesitar revisión (capacidad, lugares, etc). No se reabren solas:
// sólo se marcan para que el grupo las revise.
export function flagLogisticsDecisionsForNewParticipant(trip: TripOutput): string[] {
  const affected: string[] = [];

  trip.decisions = trip.decisions.map((decision) => {
    if (
      LOGISTICS_TYPES.includes(decision.type as (typeof LOGISTICS_TYPES)[number]) &&
      decision.status === "confirmed"
    ) {
      affected.push(decision.id);
      return {
        ...decision,
        status: "needs_review" as const,
        aiSummary:
          "Se sumó alguien nuevo al viaje después de esta decisión. Revisá si sigue siendo válida.",
        updatedAt: nowIso(),
      };
    }
    return decision;
  });

  return affected;
}

// Spec 7.9 — createDecision(input: CreateDecisionInput): DecisionOutput
export function createDecision(input: CreateDecisionInput): ServiceResult<DecisionOutput> {
  const trip = getTrip(input.tripId);
  if (!trip) return fail("TRIP_NOT_FOUND", "No encontramos ese viaje.");

  const errors = validateCreateDecisionInput(input);
  if (errors.length > 0) {
    return fail("INVALID_DECISION_INPUT", errors.join(" "));
  }

  const timestamp = nowIso();

  const decision: DecisionOutput = {
    id: generateId("decision"),
    tripId: input.tripId,
    type: input.type,
    displayTitle: getDecisionDisplayTitle(input.type),
    ...(input.description ? { description: input.description } : {}),
    status: "open",
    options: input.options.map((option) => ({
      id: generateId("option"),
      label: option.label,
      ...(option.description ? { description: option.description } : {}),
      ...(option.metadata ? { metadata: option.metadata } : {}),
      voteCount: 0,
      isTopOption: false,
    })),
    votes: [],
    selectedOptionId: null,
    ...(input.minimumParticipation !== undefined
      ? { minimumParticipation: input.minimumParticipation }
      : {}),
    participation: {
      totalParticipants: acceptedParticipantIds(trip).length,
      votedParticipants: 0,
      missingParticipantIds: acceptedParticipantIds(trip),
      participationRate: 0,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  decision.aiSummary = summarizeDecision(decision);

  trip.decisions = [...trip.decisions, decision];
  trip.updatedAt = timestamp;
  saveTrip(trip);
  recordDecisionActivity({
    tripId: input.tripId,
    decisionId: decision.id,
    action: "create",
    actorId: input.createdByUserId,
  });

  return ok(decision);
}

// Spec 7.9 — voteDecision(input: VoteInput): DecisionOutput
export function voteDecision(input: VoteInput): ServiceResult<DecisionOutput> {
  const trip = getTrip(input.tripId);
  if (!trip) return fail("TRIP_NOT_FOUND", "No encontramos ese viaje.");

  const decision = trip.decisions.find((d) => d.id === input.decisionId);
  const errors = validateVoteInput(input, decision, trip.participants);
  if (errors.length > 0) {
    return fail("INVALID_VOTE", errors.join(" "));
  }

  // Spec 4.3.4 — reemplazar el voto anterior si el participante vuelve a
  // votar y la decisión sigue abierta.
  const votesWithoutParticipant = decision!.votes.filter(
    (v) => v.participantId !== input.participantId
  );
  decision!.votes = [...votesWithoutParticipant, { participantId: input.participantId, optionId: input.optionId }];

  const updatedDecision = recomputeDecision(decision!, trip);
  trip.decisions = trip.decisions.map((d) => (d.id === updatedDecision.id ? updatedDecision : d));
  trip.updatedAt = nowIso();
  saveTrip(trip);
  recordDecisionActivity({
    tripId: input.tripId,
    decisionId: input.decisionId,
    action: "vote",
    actorId: input.participantId,
  });

  return ok(updatedDecision);
}

// Spec 7.9 — confirmDecision(input: ConfirmDecisionInput): DecisionOutput
export function confirmDecision(input: ConfirmDecisionInput): ServiceResult<DecisionOutput> {
  const trip = getTrip(input.tripId);
  if (!trip) return fail("TRIP_NOT_FOUND", "No encontramos ese viaje.");

  const decision = trip.decisions.find((d) => d.id === input.decisionId);
  if (!decision) return fail("DECISION_NOT_FOUND", "No encontramos esa decisión.");

  const errors = validateConfirmDecisionInput(input);
  if (errors.length > 0) {
    return fail("INVALID_CONFIRMATION", errors.join(" "));
  }

  const optionExists = decision.options.some((o) => o.id === input.selectedOptionId);
  if (!optionExists) {
    return fail("OPTION_NOT_FOUND", "Esa opción no existe en esta decisión.");
  }

  decision.selectedOptionId = input.selectedOptionId;
  decision.status = "confirmed";
  decision.updatedAt = nowIso();
  decision.aiSummary = summarizeDecision(decision);

  trip.decisions = trip.decisions.map((d) => (d.id === decision.id ? decision : d));
  trip.updatedAt = nowIso();
  saveTrip(trip);
  recordDecisionActivity({
    tripId: input.tripId,
    decisionId: input.decisionId,
    action: "confirm",
    actorId: input.confirmedByUserId,
  });

  refreshTripReadyStatus(trip);

  return ok(decision);
}

// Spec 5.4/5.5 — "no reabrir o marcar como needs_review automáticamente sin
// acción humana": la detección es automática, pero volver a dejarla votable
// requiere que alguien del grupo lo decida explícitamente acá.
export function markDecisionReviewed(
  tripId: string,
  decisionId: string
): ServiceResult<DecisionOutput> {
  const trip = getTrip(tripId);
  if (!trip) return fail("TRIP_NOT_FOUND", "No encontramos ese viaje.");

  const decision = trip.decisions.find((d) => d.id === decisionId);
  if (!decision) return fail("DECISION_NOT_FOUND", "No encontramos esa decisión.");

  decision.status = "open";
  const updated = recomputeDecision(decision, trip);
  trip.decisions = trip.decisions.map((d) => (d.id === updated.id ? updated : d));
  trip.updatedAt = nowIso();
  saveTrip(trip);

  return ok(updated);
}

// Spec 5.10 — COORDINATION_CONCENTRATED. No bloquea el flujo: sólo mide y
// alerta. Umbral (70% de las acciones, con al menos 3 acciones y 2
// personas activas) es una heurística propia, no está definida por el spec.
export function checkCoordinationConcentration(tripId: string): {
  concentrated: boolean;
  topActorShare: number;
} {
  const activity = getDecisionActivityForTrip(tripId);
  if (activity.length < 3) return { concentrated: false, topActorShare: 0 };

  const counts = new Map<string, number>();
  activity.forEach((entry) => counts.set(entry.actorId, (counts.get(entry.actorId) ?? 0) + 1));

  if (counts.size < 2) return { concentrated: false, topActorShare: 0 };

  const topCount = Math.max(...counts.values());
  const topActorShare = topCount / activity.length;

  return { concentrated: topActorShare >= 0.7, topActorShare };
}
