// Spec 7.5
export type ExpenseStatus = "draft" | "confirmed";

// Spec 2.7
export type CreateExpenseInput = {
  tripId: string;
  createdByUserId: string;
  payerParticipantId: string;
  amount: number;
  currency: "ARS" | "USD" | "EUR" | string;
  description: string;
  participantIds: string[];
  status: ExpenseStatus;
};

// Spec 2.8
export type EditConfirmedExpenseInput = {
  tripId: string;
  expenseId: string;
  requestedByUserId: string;
  originalCreatedByUserId: string;
  changes: Partial<{
    amount: number;
    description: string;
    participantIds: string[];
    payerParticipantId: string;
  }>;
  explicitConfirmationFromOriginalCreator: boolean;
};

// Spec 3.4
export type ExpenseOutput = {
  id: string;
  tripId: string;
  createdByUserId: string;
  payerParticipantId: string;
  amount: number;
  currency: string;
  description: string;
  participantIds: string[];
  perParticipantAmount: number;
  status: ExpenseStatus;
  warnings?: Array<{
    code: string;
    message: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

// Spec 4.5.12 — historial de cambios de gastos confirmados
export type ExpenseAuditEntry = {
  expenseId: string;
  changedByUserId: string;
  changedAt: string;
  field: string;
  previousValue: unknown;
  newValue: unknown;
};

// Spec 3.5
export type BalanceOutput = {
  tripId: string;
  participantId: string;
  paidAmount: number;
  owedShare: number;
  netBalance: number;
  currency: string;
};
