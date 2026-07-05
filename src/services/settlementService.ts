import type {
  AdjustSettlementInput,
  GenerateSettlementInput,
  SettlementOutput,
  SuggestedTransfer,
} from "@/domain/settlement";
import { generateSuggestedTransfers } from "@/domain/settlement";
import { generateId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";
import { getTrip, saveTrip } from "@/lib/storage";
import {
  validateAcceptSettlement,
  validateAdjustSettlementInput,
  validateGenerateSettlement,
} from "@/validators/settlementValidators";
import { calculateBalances } from "./expenseService";
import { fail, ok, type ServiceResult } from "./result";

const SETTLEMENT_NOTE =
  "Esta liquidación es una sugerencia. El grupo puede ajustarla antes de cerrar el viaje.";

// Spec 7.9 — generateSettlement(input: GenerateSettlementInput): SettlementOutput
export function generateSettlement(input: GenerateSettlementInput): ServiceResult<SettlementOutput> {
  const trip = getTrip(input.tripId);
  if (!trip) return fail("TRIP_NOT_FOUND", "No encontramos ese viaje.");

  const errors = validateGenerateSettlement(trip.expenses);
  if (errors.length > 0) {
    return fail("NO_EXPENSES_TO_SETTLE", errors.join(" "));
  }

  const balances = calculateBalances(input.tripId);

  // Se agrupa por moneda: el algoritmo del spec (7.10) opera sobre una sola
  // moneda a la vez (spec §8: manejo de múltiples monedas sin definir).
  const currencies = Array.from(new Set(balances.map((b) => b.currency)));
  const suggestedTransfers: SuggestedTransfer[] = currencies.flatMap((currency) =>
    generateSuggestedTransfers(
      balances
        .filter((b) => b.currency === currency)
        .map((b) => ({ participantId: b.participantId, netBalance: b.netBalance, currency }))
    )
  );

  const timestamp = nowIso();
  const settlement: SettlementOutput = {
    id: generateId("settlement"),
    tripId: input.tripId,
    status: "suggested",
    balances,
    suggestedTransfers,
    transferCount: suggestedTransfers.length,
    note: SETTLEMENT_NOTE,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  trip.settlement = settlement;
  trip.updatedAt = timestamp;
  saveTrip(trip);

  return ok(settlement);
}

// Spec 7.9 — adjustSettlement(input: AdjustSettlementInput): SettlementOutput
export function adjustSettlement(input: AdjustSettlementInput): ServiceResult<SettlementOutput> {
  const trip = getTrip(input.tripId);
  if (!trip) return fail("TRIP_NOT_FOUND", "No encontramos ese viaje.");
  if (!trip.settlement || trip.settlement.id !== input.settlementId) {
    return fail("SETTLEMENT_NOT_FOUND", "No encontramos esa liquidación.");
  }

  const errors = validateAdjustSettlementInput(input);
  if (errors.length > 0) {
    return fail("INVALID_SETTLEMENT_ADJUSTMENT", errors.join(" "));
  }

  const timestamp = nowIso();
  const settlement = trip.settlement;
  settlement.suggestedTransfers = input.transfers;
  settlement.transferCount = input.transfers.length;
  settlement.status = input.explicitGroupAcceptance ? "accepted" : "adjusted";
  settlement.updatedAt = timestamp;

  trip.updatedAt = timestamp;
  saveTrip(trip);

  return ok(settlement);
}

// Spec 4.6.10 — cerrar liquidación sólo con aceptación humana explícita.
// Requiere que el grupo ya haya aceptado los montos (adjustSettlement con
// explicitGroupAcceptance: true) antes de poder cerrar el viaje.
export function closeSettlement(
  tripId: string,
  explicitGroupAcceptance: boolean
): ServiceResult<SettlementOutput> {
  const trip = getTrip(tripId);
  if (!trip || !trip.settlement) return fail("SETTLEMENT_NOT_FOUND", "No encontramos esa liquidación.");

  if (trip.settlement.status !== "accepted") {
    return fail("SETTLEMENT_NOT_ACCEPTED", "El grupo todavía tiene que aceptar la liquidación.");
  }

  const errors = validateAcceptSettlement(explicitGroupAcceptance);
  if (errors.length > 0) {
    return fail("MISSING_EXPLICIT_ACCEPTANCE", errors.join(" "));
  }

  const timestamp = nowIso();
  trip.settlement.status = "closed";
  trip.settlement.updatedAt = timestamp;
  // Spec 4.1.8 — marcar el viaje como closed cuando la liquidación queda aceptada.
  trip.status = "closed";
  trip.updatedAt = timestamp;
  saveTrip(trip);

  return ok(trip.settlement);
}
