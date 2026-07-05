import type {
  BalanceOutput,
  CreateExpenseInput,
  EditConfirmedExpenseInput,
  ExpenseAuditEntry,
  ExpenseOutput,
} from "@/domain/expense";
import type { TripOutput } from "@/domain/trip";
import { generateId } from "@/lib/ids";
import { nowIso, hoursBetween } from "@/lib/dates";
import { dividePerParticipant } from "@/lib/money";
import { isSimilarDescription } from "@/lib/text";
import { getTrip, saveTrip, appendAuditEntries } from "@/lib/storage";
import {
  validateEditConfirmedExpenseInput,
  validateExpenseInput,
} from "@/validators/expenseValidators";
import { fail, ok, type ServiceResult } from "./result";

// Spec 4.5.9 / 5.6 — POSSIBLE_DUPLICATE_EXPENSE. Heurística no definida por
// el spec: mismo pagador, mismo monto, descripción similar y fecha cercana
// (se asume una ventana de 48hs). Sólo advierte, nunca bloquea la carga.
const DUPLICATE_WINDOW_HOURS = 48;

function findPossibleDuplicate(
  trip: TripOutput,
  input: CreateExpenseInput,
  nowTimestamp: string
): ExpenseOutput | undefined {
  return trip.expenses.find(
    (existing) =>
      existing.payerParticipantId === input.payerParticipantId &&
      existing.amount === input.amount &&
      isSimilarDescription(existing.description, input.description) &&
      hoursBetween(existing.createdAt, nowTimestamp) <= DUPLICATE_WINDOW_HOURS
  );
}

// Spec 7.9 — createExpense(input: CreateExpenseInput): ExpenseOutput
export function createExpense(input: CreateExpenseInput): ServiceResult<ExpenseOutput> {
  const trip = getTrip(input.tripId);
  if (!trip) return fail("TRIP_NOT_FOUND", "No encontramos ese viaje.");

  const errors = validateExpenseInput(input);
  if (errors.length > 0) {
    return fail("INVALID_EXPENSE_INPUT", errors.join(" "));
  }

  const timestamp = nowIso();
  const duplicate = findPossibleDuplicate(trip, input, timestamp);

  const expense: ExpenseOutput = {
    id: generateId("expense"),
    tripId: input.tripId,
    createdByUserId: input.createdByUserId,
    payerParticipantId: input.payerParticipantId,
    amount: input.amount,
    currency: input.currency,
    description: input.description,
    participantIds: input.participantIds,
    perParticipantAmount: dividePerParticipant(input.amount, input.participantIds.length),
    status: input.status,
    warnings: duplicate
      ? [
          {
            code: "POSSIBLE_DUPLICATE_EXPENSE",
            message: "Este gasto se parece a otro ya cargado. Revisalo antes de confirmarlo.",
          },
        ]
      : [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  trip.expenses = [...trip.expenses, expense];
  trip.updatedAt = timestamp;
  saveTrip(trip);

  return ok(expense);
}

// Spec 7.9 — editConfirmedExpense(input: EditConfirmedExpenseInput): ExpenseOutput
export function editConfirmedExpense(
  input: EditConfirmedExpenseInput
): ServiceResult<ExpenseOutput> {
  const trip = getTrip(input.tripId);
  if (!trip) return fail("TRIP_NOT_FOUND", "No encontramos ese viaje.");

  const expense = trip.expenses.find((e) => e.id === input.expenseId);
  if (!expense) return fail("EXPENSE_NOT_FOUND", "No encontramos ese gasto.");

  if (expense.status === "confirmed") {
    const errors = validateEditConfirmedExpenseInput(input);
    if (errors.length > 0) {
      return fail("CONFIRMED_EXPENSE_REQUIRES_EXPLICIT_ACTION", errors.join(" "));
    }
  }

  const auditEntries: ExpenseAuditEntry[] = [];
  const timestamp = nowIso();

  (Object.keys(input.changes) as Array<keyof typeof input.changes>).forEach((field) => {
    const previousValue = expense[field];
    const newValue = input.changes[field];
    if (newValue === undefined) return;

    auditEntries.push({
      expenseId: expense.id,
      changedByUserId: input.requestedByUserId,
      changedAt: timestamp,
      field,
      previousValue,
      newValue,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (expense as any)[field] = newValue;
  });

  expense.perParticipantAmount = dividePerParticipant(expense.amount, expense.participantIds.length);
  expense.updatedAt = timestamp;

  trip.expenses = trip.expenses.map((e) => (e.id === expense.id ? expense : e));
  trip.updatedAt = timestamp;
  saveTrip(trip);
  appendAuditEntries(auditEntries);

  return ok(expense);
}

// Spec 7.9 — calculateBalances(tripId: string): BalanceOutput[]
// Spec 4.6.3 — sólo se consideran gastos confirmados.
// Los balances se agrupan por moneda (spec §8: multi-moneda sin definir).
export function calculateBalances(tripId: string): BalanceOutput[] {
  const trip = getTrip(tripId);
  if (!trip) return [];

  const confirmedExpenses = trip.expenses.filter((e) => e.status === "confirmed");
  const balancesByParticipantAndCurrency = new Map<string, BalanceOutput>();

  function key(participantId: string, currency: string): string {
    return `${participantId}::${currency}`;
  }

  function ensure(participantId: string, currency: string): BalanceOutput {
    const k = key(participantId, currency);
    let balance = balancesByParticipantAndCurrency.get(k);
    if (!balance) {
      balance = { tripId, participantId, paidAmount: 0, owedShare: 0, netBalance: 0, currency };
      balancesByParticipantAndCurrency.set(k, balance);
    }
    return balance;
  }

  confirmedExpenses.forEach((expense) => {
    const payerBalance = ensure(expense.payerParticipantId, expense.currency);
    payerBalance.paidAmount += expense.amount;

    expense.participantIds.forEach((participantId) => {
      const balance = ensure(participantId, expense.currency);
      balance.owedShare += expense.perParticipantAmount;
    });
  });

  const balances = Array.from(balancesByParticipantAndCurrency.values());
  balances.forEach((balance) => {
    balance.netBalance = balance.paidAmount - balance.owedShare;
  });

  return balances;
}
