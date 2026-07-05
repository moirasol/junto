import type { CreateExpenseInput, EditConfirmedExpenseInput } from "@/domain/expense";

// Spec 6.4 — verbatim
export function validateExpenseInput(input: CreateExpenseInput): string[] {
  const errors: string[] = [];

  if (!input.tripId) errors.push("El viaje es obligatorio.");
  if (!input.createdByUserId) errors.push("El usuario creador es obligatorio.");
  if (!input.payerParticipantId) errors.push("El pagador es obligatorio.");
  if (!input.amount || input.amount <= 0) errors.push("El monto tiene que ser mayor a cero.");
  if (!input.currency) errors.push("La moneda es obligatoria.");
  if (!input.description?.trim()) errors.push("La descripción es obligatoria.");
  if (!input.participantIds || input.participantIds.length === 0) {
    errors.push("Seleccioná al menos una persona para dividir el gasto.");
  }

  return errors;
}

// Spec 6.5 / 5.7 — CONFIRMED_EXPENSE_REQUIRES_EXPLICIT_ACTION
// `actualCreatedByUserId` viene del gasto guardado (no de lo que declara el
// llamador) para que la autorización no dependa únicamente de campos que el
// propio llamador puede completar como quiera.
export function validateEditConfirmedExpenseInput(
  input: EditConfirmedExpenseInput,
  actualCreatedByUserId: string
): string[] {
  if (!input.explicitConfirmationFromOriginalCreator) {
    return [
      "Este gasto ya está confirmado. Sólo puede cambiarlo quien lo cargó con una confirmación explícita.",
    ];
  }

  if (input.requestedByUserId !== actualCreatedByUserId) {
    return ["Sólo quien cargó el gasto puede autorizar este cambio."];
  }

  return [];
}
