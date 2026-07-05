import type { CreateTripInput, TripOutput } from "@/domain/trip";
import type {
  AcceptInvitationInput,
  InviteParticipantsInput,
  ParticipantOutput,
} from "@/domain/participant";
import { generateId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";
import { getTrip as readTrip, listTrips as readTrips, saveTrip, deleteTrip } from "@/lib/storage";
import { validateCreateTripInput, validateNewParticipants } from "@/validators/tripValidators";
import {
  applyParticipantLeftToDecisions,
  flagLogisticsDecisionsForNewParticipant,
} from "./decisionService";
import { fail, ok, type ServiceResult } from "./result";

export function listTrips(): TripOutput[] {
  return readTrips();
}

export function getTrip(tripId: string): TripOutput | undefined {
  return readTrip(tripId);
}

// Spec 7.9 — createTrip(input: CreateTripInput): TripOutput
export function createTrip(input: CreateTripInput): ServiceResult<TripOutput> {
  const errors = validateCreateTripInput(input);
  if (errors.length > 0) {
    return fail("INVALID_TRIP_INPUT", errors.join(" "));
  }

  const timestamp = nowIso();

  // Spec 4.2.1 — crear participantes en estado invited.
  const participants: ParticipantOutput[] = input.participants.map((participant) => ({
    id: generateId("participant"),
    name: participant.name,
    ...(participant.email ? { email: participant.email } : {}),
    ...(participant.phone ? { phone: participant.phone } : {}),
    status: "invited",
  }));

  const trip: TripOutput = {
    id: generateId("trip"),
    name: input.name,
    destination: input.destination,
    // Spec 4.1.2 — iniciar un viaje en estado planning.
    status: "planning",
    createdByUserId: input.createdByUserId,
    participants,
    decisions: [],
    expenses: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  saveTrip(trip);
  return ok(trip);
}

// Spec 7.9 — inviteParticipants(input: InviteParticipantsInput): ParticipantOutput[]
export function inviteParticipants(
  input: InviteParticipantsInput
): ServiceResult<ParticipantOutput[]> {
  const trip = readTrip(input.tripId);
  if (!trip) return fail("TRIP_NOT_FOUND", "No encontramos ese viaje.");

  const errors = validateNewParticipants(input.participants);
  if (errors.length > 0) {
    return fail("INVALID_PARTICIPANTS_INPUT", errors.join(" "));
  }

  const newParticipants: ParticipantOutput[] = input.participants.map((participant) => ({
    id: generateId("participant"),
    name: participant.name,
    ...(participant.email ? { email: participant.email } : {}),
    ...(participant.phone ? { phone: participant.phone } : {}),
    status: "invited",
  }));

  trip.participants = [...trip.participants, ...newParticipants];
  trip.updatedAt = nowIso();
  saveTrip(trip);

  return ok(newParticipants);
}

// Spec 7.9 — acceptInvitation(input: AcceptInvitationInput): ParticipantOutput
export function acceptInvitation(
  input: AcceptInvitationInput
): ServiceResult<ParticipantOutput & { affectedDecisionIds?: string[] }> {
  const trip = readTrip(input.tripId);
  if (!trip) return fail("TRIP_NOT_FOUND", "No encontramos ese viaje.");

  const participant = trip.participants.find((p) => p.id === input.participantId);
  if (!participant) return fail("PARTICIPANT_NOT_FOUND", "No encontramos a ese integrante.");

  const timestamp = nowIso();
  let affectedDecisionIds: string[] = [];

  // Spec 4.2.2 / 4.2.3
  if (input.response === "accepted") {
    participant.status = "accepted";
    participant.joinedAt = timestamp;
    // Spec 5.5 — LATE_PARTICIPANT_ADDED
    affectedDecisionIds = flagLogisticsDecisionsForNewParticipant(trip);
  } else {
    participant.status = "rejected";
  }

  trip.updatedAt = timestamp;
  saveTrip(trip);

  return ok({ ...participant, ...(affectedDecisionIds.length > 0 ? { affectedDecisionIds } : {}) });
}

// Spec 5.4 — PARTICIPANT_LEFT: se preserva el historial de votos y gastos,
// se recalcula la participación activa y se marcan needs_review las
// decisiones que dependían de su voto.
export function markParticipantLeft(
  tripId: string,
  participantId: string
): ServiceResult<{ affectedDecisionIds: string[]; affectedExpenseIds: string[] }> {
  const trip = readTrip(tripId);
  if (!trip) return fail("TRIP_NOT_FOUND", "No encontramos ese viaje.");

  const participant = trip.participants.find((p) => p.id === participantId);
  if (!participant) return fail("PARTICIPANT_NOT_FOUND", "No encontramos a ese integrante.");

  const timestamp = nowIso();
  participant.status = "left";
  participant.leftAt = timestamp;

  const affectedDecisionIds = applyParticipantLeftToDecisions(trip, participantId);

  // Spec 4.2.6 — no eliminar balances históricos: sólo se informan los
  // gastos en los que participaba, no se tocan.
  const affectedExpenseIds = trip.expenses
    .filter(
      (expense) =>
        expense.payerParticipantId === participantId ||
        expense.participantIds.includes(participantId)
    )
    .map((expense) => expense.id);

  trip.updatedAt = timestamp;
  saveTrip(trip);

  return ok({ affectedDecisionIds, affectedExpenseIds });
}

const REQUIRED_DECISION_TYPES = ["dates", "accommodation", "transport"] as const;

// Spec 4.1.5 — marcar el viaje como ready sólo cuando fecha, alojamiento y
// transporte estén confirmados.
export function refreshTripReadyStatus(trip: TripOutput): TripOutput {
  const allConfirmed = REQUIRED_DECISION_TYPES.every((type) =>
    trip.decisions.some((d) => d.type === type && d.status === "confirmed")
  );

  if (allConfirmed && trip.status === "planning") {
    trip.status = "ready";
    trip.updatedAt = nowIso();
    saveTrip(trip);
  }

  return trip;
}

// Spec 4.1.9 — permitir exportar datos sólo cuando el viaje está closed.
export function exportTripData(tripId: string): ServiceResult<string> {
  const trip = readTrip(tripId);
  if (!trip) return fail("TRIP_NOT_FOUND", "No encontramos ese viaje.");
  if (trip.status !== "closed") {
    return fail(
      "TRIP_NOT_CLOSED",
      "Sólo se puede exportar la información cuando el viaje está cerrado."
    );
  }
  return ok(JSON.stringify(trip, null, 2));
}

// Spec 4.1.10 — permitir borrar datos sólo con confirmación explícita del organizador.
export function deleteTripData(
  tripId: string,
  requestedByUserId: string,
  explicitConfirmation: boolean
): ServiceResult<null> {
  const trip = readTrip(tripId);
  if (!trip) return fail("TRIP_NOT_FOUND", "No encontramos ese viaje.");
  if (trip.createdByUserId !== requestedByUserId) {
    return fail("NOT_ORGANIZER", "Sólo quien organizó el viaje puede borrar los datos.");
  }
  if (!explicitConfirmation) {
    return fail("MISSING_EXPLICIT_CONFIRMATION", "Confirmá explícitamente para borrar el viaje.");
  }
  deleteTrip(tripId);
  return ok(null);
}

// Spec 4.1.8 — marcar el viaje como closed "cuando el grupo decide cerrarlo
// sin gastos" (camino alternativo a la liquidación).
export function closeTripWithoutExpenses(tripId: string): ServiceResult<TripOutput> {
  const trip = readTrip(tripId);
  if (!trip) return fail("TRIP_NOT_FOUND", "No encontramos ese viaje.");
  if (trip.expenses.length > 0) {
    return fail("TRIP_HAS_EXPENSES", "Este viaje tiene gastos: cerralo generando la liquidación.");
  }
  trip.status = "closed";
  trip.updatedAt = nowIso();
  saveTrip(trip);
  return ok(trip);
}
