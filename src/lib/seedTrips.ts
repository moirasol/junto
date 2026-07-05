import type { TripOutput } from "@/domain/trip";
import { generateId } from "./ids";
import { nowIso } from "./dates";

// Datos de demo para que la lista de viajes no arranque vacía en una
// presentación. Se cargan una sola vez (ver SEEDED_KEY en storage.ts); si
// se borran los viajes después, no vuelven a aparecer solos.
export function buildSeedTrips(): TripOutput[] {
  const timestamp = nowIso();

  return [
    {
      id: generateId("trip"),
      name: "Finde en Tandil",
      destination: "Tandil",
      status: "planning",
      createdByUserId: "user_seed_1",
      participants: [
        { id: generateId("participant"), name: "Male", status: "accepted", joinedAt: timestamp },
        { id: generateId("participant"), name: "Nico", status: "accepted", joinedAt: timestamp },
        { id: generateId("participant"), name: "Caro", status: "invited" },
      ],
      decisions: [],
      expenses: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: generateId("trip"),
      name: "Escapada a Rosario",
      destination: "Rosario",
      status: "planning",
      createdByUserId: "user_seed_2",
      participants: [
        { id: generateId("participant"), name: "Lu", status: "accepted", joinedAt: timestamp },
        { id: generateId("participant"), name: "Fede", status: "accepted", joinedAt: timestamp },
        { id: generateId("participant"), name: "Ana", status: "accepted", joinedAt: timestamp },
        { id: generateId("participant"), name: "Tomi", status: "invited" },
      ],
      decisions: [],
      expenses: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
}
