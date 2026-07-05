import type { AdjustSettlementInput } from "@/domain/settlement";
import type { ExpenseOutput } from "@/domain/expense";

// Spec 6.6
export function validateGenerateSettlement(expenses: ExpenseOutput[]): string[] {
  const errors: string[] = [];
  const confirmed = expenses.filter((e) => e.status === "confirmed");
  if (confirmed.length === 0) {
    errors.push("No hay gastos para liquidar.");
  }
  return errors;
}

// Spec 6.6
export function validateAdjustSettlementInput(input: AdjustSettlementInput): string[] {
  const errors: string[] = [];

  input.transfers.forEach((transfer) => {
    if (!transfer.amount || transfer.amount <= 0) {
      errors.push("Cada transferencia tiene que tener un monto mayor a cero.");
    }
    if (transfer.fromParticipantId === transfer.toParticipantId) {
      errors.push("Una transferencia no puede ser de una persona a sí misma.");
    }
  });

  return errors;
}

export function validateAcceptSettlement(explicitGroupAcceptance: boolean): string[] {
  if (!explicitGroupAcceptance) {
    return ["Falta la aceptación explícita del grupo para cerrar la liquidación."];
  }
  return [];
}
