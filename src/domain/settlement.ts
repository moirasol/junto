import type { BalanceOutput } from "./expense";

// Spec 7.6
export type SettlementStatus = "suggested" | "adjusted" | "accepted" | "closed";

// Spec 2.9
export type GenerateSettlementInput = {
  tripId: string;
  requestedByUserId: string;
};

// Spec 2.10
export type AdjustSettlementInput = {
  tripId: string;
  settlementId: string;
  adjustedByUserId: string;
  transfers: Array<{
    fromParticipantId: string;
    toParticipantId: string;
    amount: number;
    currency: string;
  }>;
  explicitGroupAcceptance: boolean;
};

export type SuggestedTransfer = {
  fromParticipantId: string;
  toParticipantId: string;
  amount: number;
  currency: string;
};

// Spec 3.6
export type SettlementOutput = {
  id: string;
  tripId: string;
  status: SettlementStatus;
  balances: BalanceOutput[];
  suggestedTransfers: SuggestedTransfer[];
  transferCount: number;
  note: string;
  createdAt: string;
  updatedAt: string;
};

// Spec 7.10 — tipos del algoritmo mínimo de liquidación
export type ParticipantBalance = {
  participantId: string;
  netBalance: number;
  currency: string;
};

/**
 * Algoritmo greedy de liquidación (spec 7.10), reproducido tal cual.
 * No ejecuta pagos: sólo devuelve la lista sugerida de transferencias.
 */
export function generateSuggestedTransfers(
  balances: ParticipantBalance[]
): SuggestedTransfer[] {
  const debtors = balances
    .filter((b) => b.netBalance < 0)
    .map((b) => ({ ...b, remaining: Math.abs(b.netBalance) }))
    .sort((a, b) => b.remaining - a.remaining);

  const creditors = balances
    .filter((b) => b.netBalance > 0)
    .map((b) => ({ ...b, remaining: b.netBalance }))
    .sort((a, b) => b.remaining - a.remaining);

  const transfers: SuggestedTransfer[] = [];

  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex]!;
    const creditor = creditors[creditorIndex]!;

    const amount = Math.min(debtor.remaining, creditor.remaining);

    if (amount > 0) {
      transfers.push({
        fromParticipantId: debtor.participantId,
        toParticipantId: creditor.participantId,
        amount,
        currency: debtor.currency,
      });

      debtor.remaining -= amount;
      creditor.remaining -= amount;
    }

    if (debtor.remaining === 0) debtorIndex += 1;
    if (creditor.remaining === 0) creditorIndex += 1;
  }

  return transfers;
}
