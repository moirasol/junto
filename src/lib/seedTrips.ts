import type { DecisionOutput } from "@/domain/decision";
import type { TripOutput } from "@/domain/trip";
import { generateId } from "./ids";
import { nowIso } from "./dates";

// Decisión de fechas ya creada (sin votos) para que la demo arranque
// directo en "votar", en vez de perder tiempo creando la decisión en vivo.
function buildDatesDecision(acceptedParticipantIds: string[], timestamp: string): DecisionOutput {
  return {
    id: generateId("decision"),
    tripId: "", // se completa al armar cada viaje
    type: "dates",
    displayTitle: "Elegir fechas",
    status: "open",
    options: [
      { id: generateId("option"), label: "27 al 30 de septiembre", voteCount: 0, isTopOption: false },
      { id: generateId("option"), label: "4 al 7 de octubre", voteCount: 0, isTopOption: false },
    ],
    votes: [],
    participation: {
      totalParticipants: acceptedParticipantIds.length,
      votedParticipants: 0,
      missingParticipantIds: acceptedParticipantIds,
      participationRate: 0,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

// Misma decisión, pero ya resuelta: todos votaron la primera opción y el
// grupo la confirmó — para que un viaje "finalizado" no muestre una
// decisión pendiente adentro.
function buildConfirmedDatesDecision(acceptedParticipantIds: string[], timestamp: string): DecisionOutput {
  const decision = buildDatesDecision(acceptedParticipantIds, timestamp);
  const winningOption = decision.options[0]!;
  winningOption.voteCount = acceptedParticipantIds.length;
  winningOption.isTopOption = true;
  decision.votes = acceptedParticipantIds.map((participantId) => ({
    participantId,
    optionId: winningOption.id,
  }));
  decision.status = "confirmed";
  decision.selectedOptionId = winningOption.id;
  decision.participation = {
    totalParticipants: acceptedParticipantIds.length,
    votedParticipants: acceptedParticipantIds.length,
    missingParticipantIds: [],
    participationRate: 1,
  };
  return decision;
}

// Datos de demo para que la lista de viajes no arranque vacía en una
// presentación. Se cargan una sola vez (ver SEEDED_KEY en storage.ts); si
// se borran los viajes después, no vuelven a aparecer solos.
export function buildSeedTrips(): TripOutput[] {
  const timestamp = nowIso();

  const tandilId = generateId("trip");
  const tandilParticipants = [
    { id: generateId("participant"), name: "Male", status: "accepted" as const, joinedAt: timestamp },
    { id: generateId("participant"), name: "Nico", status: "accepted" as const, joinedAt: timestamp },
    { id: generateId("participant"), name: "Caro", status: "invited" as const },
  ];

  const rosarioId = generateId("trip");
  const rosarioParticipants = [
    { id: generateId("participant"), name: "Lu", status: "accepted" as const, joinedAt: timestamp },
    { id: generateId("participant"), name: "Fede", status: "accepted" as const, joinedAt: timestamp },
    { id: generateId("participant"), name: "Ana", status: "accepted" as const, joinedAt: timestamp },
    { id: generateId("participant"), name: "Tomi", status: "invited" as const },
  ];

  return [
    {
      id: tandilId,
      name: "Finde en Tandil",
      destination: "Tandil",
      status: "planning",
      createdByUserId: "user_seed_1",
      participants: tandilParticipants,
      decisions: [
        {
          ...buildDatesDecision(
            tandilParticipants.filter((p) => p.status === "accepted").map((p) => p.id),
            timestamp
          ),
          tripId: tandilId,
        },
      ],
      expenses: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: rosarioId,
      name: "Escapada a Rosario",
      destination: "Rosario",
      status: "closed",
      createdByUserId: "user_seed_2",
      participants: rosarioParticipants,
      decisions: [
        {
          ...buildConfirmedDatesDecision(
            rosarioParticipants.filter((p) => p.status === "accepted").map((p) => p.id),
            timestamp
          ),
          tripId: rosarioId,
        },
      ],
      expenses: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
}
