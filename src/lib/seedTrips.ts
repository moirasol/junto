import type { DecisionOutput, DecisionType } from "@/domain/decision";
import type { TripOutput } from "@/domain/trip";
import { generateId } from "./ids";
import { nowIso } from "./dates";

const DECISION_TITLE: Record<DecisionType, string> = {
  dates: "Elegir fechas",
  accommodation: "Elegir alojamiento",
  transport: "Elegir transporte",
};

// Decisión ya resuelta: todos votaron la primera opción y el grupo la
// confirmó — para armar viajes de demo que ya tienen el "pre-viaje"
// decidido (fechas/alojamiento/transporte) y así saltar directo a
// mostrar gastos o el estado de un viaje finalizado.
function buildConfirmedDecision(
  type: DecisionType,
  optionLabels: [string, string],
  acceptedParticipantIds: string[],
  timestamp: string
): DecisionOutput {
  const options = optionLabels.map((label, index) => ({
    id: generateId("option"),
    label,
    voteCount: index === 0 ? acceptedParticipantIds.length : 0,
    isTopOption: index === 0,
  }));

  return {
    id: generateId("decision"),
    tripId: "", // se completa al armar cada viaje
    type,
    displayTitle: DECISION_TITLE[type],
    status: "confirmed",
    options,
    votes: acceptedParticipantIds.map((participantId) => ({
      participantId,
      optionId: options[0]!.id,
    })),
    selectedOptionId: options[0]!.id,
    participation: {
      totalParticipants: acceptedParticipantIds.length,
      votedParticipants: acceptedParticipantIds.length,
      missingParticipantIds: [],
      participationRate: 1,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
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
  const tandilAccepted = tandilParticipants.filter((p) => p.status === "accepted").map((p) => p.id);

  const rosarioId = generateId("trip");
  const rosarioParticipants = [
    { id: generateId("participant"), name: "Lu", status: "accepted" as const, joinedAt: timestamp },
    { id: generateId("participant"), name: "Fede", status: "accepted" as const, joinedAt: timestamp },
    { id: generateId("participant"), name: "Ana", status: "accepted" as const, joinedAt: timestamp },
    { id: generateId("participant"), name: "Tomi", status: "invited" as const },
  ];
  const rosarioAccepted = rosarioParticipants.filter((p) => p.status === "accepted").map((p) => p.id);

  return [
    {
      id: tandilId,
      name: "Finde en Tandil",
      destination: "Tandil",
      // Sigue "planning" (Organizando) a propósito: ya se resolvió el
      // pre-viaje (fechas/alojamiento/transporte) pero faltan gastos y
      // liquidación, que es lo que se muestra en vivo en este viaje.
      status: "planning",
      createdByUserId: "user_seed_1",
      participants: tandilParticipants,
      decisions: [
        {
          ...buildConfirmedDecision(
            "dates",
            ["27 al 30 de septiembre", "4 al 7 de octubre"],
            tandilAccepted,
            timestamp
          ),
          tripId: tandilId,
        },
        {
          ...buildConfirmedDecision(
            "accommodation",
            ["Cabañas del Lago", "Hostel El Mirador"],
            tandilAccepted,
            timestamp
          ),
          tripId: tandilId,
        },
        {
          ...buildConfirmedDecision(
            "transport",
            ["Auto de Male (4 lugares)", "Combi alquilada"],
            tandilAccepted,
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
          ...buildConfirmedDecision(
            "dates",
            ["27 al 30 de septiembre", "4 al 7 de octubre"],
            rosarioAccepted,
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
