import type { TripOutput } from "@/domain/trip";
import type { ExpenseAuditEntry } from "@/domain/expense";
import { buildSeedTrips } from "./seedTrips";

// TODO (spec §8): persistencia sin definir (local storage, DB mockeada,
// Supabase, PostgreSQL). Se usa localStorage como mock mínimo para el
// prototipo: no es una decisión de producto final.

const TRIPS_KEY = "junto:trips";
const AUDIT_KEY = "junto:expense-audit";
const DECISION_ACTIVITY_KEY = "junto:decision-activity";
const SEEDED_KEY = "junto:seeded";

// Carga los viajes de demo una única vez, sólo si nunca se cargaron antes
// y no hay nada guardado todavía (para no resucitar viajes que el usuario
// borró a propósito).
function ensureSeeded(): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SEEDED_KEY)) return;
  window.localStorage.setItem(SEEDED_KEY, "1");
  if (!window.localStorage.getItem(TRIPS_KEY)) {
    window.localStorage.setItem(TRIPS_KEY, JSON.stringify(buildSeedTrips()));
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readTrips(): TripOutput[] {
  if (typeof window === "undefined") return [];
  ensureSeeded();
  const raw = window.localStorage.getItem(TRIPS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as TripOutput[];
  } catch {
    return [];
  }
}

function writeTrips(trips: TripOutput[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
  notify();
}

export function listTrips(): TripOutput[] {
  return readTrips();
}

export function getTrip(tripId: string): TripOutput | undefined {
  return readTrips().find((trip) => trip.id === tripId);
}

export function saveTrip(trip: TripOutput): void {
  const trips = readTrips();
  const index = trips.findIndex((t) => t.id === trip.id);
  if (index === -1) {
    trips.push(trip);
  } else {
    trips[index] = trip;
  }
  writeTrips(trips);
}

export function readAuditLog(): ExpenseAuditEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(AUDIT_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ExpenseAuditEntry[];
  } catch {
    return [];
  }
}

export function appendAuditEntries(entries: ExpenseAuditEntry[]): void {
  if (typeof window === "undefined" || entries.length === 0) return;
  const log = readAuditLog();
  window.localStorage.setItem(AUDIT_KEY, JSON.stringify([...log, ...entries]));
  notify();
}

export function deleteTrip(tripId: string): void {
  const trips = readTrips().filter((trip) => trip.id !== tripId);
  writeTrips(trips);
}

// Spec 5.10 — COORDINATION_CONCENTRATED. DecisionOutput (spec 3.3) no
// guarda quién creó/confirmó cada decisión, así que este registro vive
// aparte, igual que la auditoría de gastos, sólo para medir concentración.
export type DecisionActivityEntry = {
  tripId: string;
  decisionId: string;
  action: "create" | "vote" | "confirm";
  actorId: string;
};

function readDecisionActivity(): DecisionActivityEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(DECISION_ACTIVITY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DecisionActivityEntry[];
  } catch {
    return [];
  }
}

export function recordDecisionActivity(entry: DecisionActivityEntry): void {
  if (typeof window === "undefined") return;
  const log = readDecisionActivity();
  window.localStorage.setItem(DECISION_ACTIVITY_KEY, JSON.stringify([...log, entry]));
}

export function getDecisionActivityForTrip(tripId: string): DecisionActivityEntry[] {
  return readDecisionActivity().filter((entry) => entry.tripId === tripId);
}
