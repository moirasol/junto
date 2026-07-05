"use client";

import { useState } from "react";
import type { ExpenseOutput } from "@/domain/expense";
import type { TripOutput } from "@/domain/trip";
import { editConfirmedExpense } from "@/services/expenseService";
import { getActingUserId } from "@/lib/currentUser";
import { formatMoney } from "@/lib/money";
import { Badge, Button, TextInput } from "@/components/ui/Primitives";
import { ExpenseWarningBanner } from "./ExpenseWarningBanner";

function participantName(trip: TripOutput, id: string): string {
  return trip.participants.find((p) => p.id === id)?.name ?? "—";
}

export function ExpenseTable({ trip }: { trip: TripOutput }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedId, setBlockedId] = useState<string | null>(null);

  // Spec 5.7 — CONFIRMED_EXPENSE_REQUIRES_EXPLICIT_ACTION: cualquiera puede
  // intentar editar un gasto confirmado, pero si no es quien lo cargó, se
  // bloquea con el mensaje exacto en vez de abrir el formulario.
  function handleEditClick(expense: ExpenseOutput) {
    setError(null);
    if (getActingUserId(trip.id) !== expense.createdByUserId) {
      setBlockedId(expense.id);
      return;
    }
    startEdit(expense);
  }

  function startEdit(expense: ExpenseOutput) {
    setBlockedId(null);
    setEditingId(expense.id);
    setEditAmount(String(expense.amount));
    setEditDescription(expense.description);
    setConfirmChecked(false);
    setError(null);
  }

  function saveEdit(expense: ExpenseOutput) {
    const actingUserId = getActingUserId(trip.id);
    const result = editConfirmedExpense({
      tripId: trip.id,
      expenseId: expense.id,
      requestedByUserId: actingUserId,
      originalCreatedByUserId: expense.createdByUserId,
      changes: {
        amount: Number(editAmount),
        description: editDescription.trim(),
      },
      explicitConfirmationFromOriginalCreator: confirmChecked,
    });

    if (!result.success) {
      setError(result.message);
      return;
    }

    setEditingId(null);
  }

  if (trip.expenses.length === 0) return null;

  return (
    <div className="space-y-3">
      {trip.expenses.map((expense) => {
        const isEditing = editingId === expense.id;
        const isBlocked = blockedId === expense.id;

        return (
          <div key={expense.id} className="rounded-xl border border-neutral-200 p-3">
            {isBlocked && (
              <p className="mb-2 text-sm font-medium text-rose-700" role="alert">
                Este gasto ya está confirmado. Sólo puede cambiarlo quien lo cargó con una
                confirmación explícita.
              </p>
            )}
            {isEditing ? (
              <div className="space-y-2">
                <TextInput value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                <TextInput
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                />
                <label className="flex items-center gap-2 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    checked={confirmChecked}
                    onChange={(e) => setConfirmChecked(e.target.checked)}
                  />
                  Confirmo este cambio (lo cargué yo)
                </label>
                {error && (
                  <p className="text-sm font-medium text-rose-700" role="alert">
                    {error}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button onClick={() => saveEdit(expense)}>Guardar cambio</Button>
                  <Button variant="secondary" onClick={() => setEditingId(null)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-neutral-900">{expense.description}</p>
                  <p className="text-sm text-neutral-500">
                    Pagó {participantName(trip, expense.payerParticipantId)} ·{" "}
                    {formatMoney(expense.amount, expense.currency)} · se divide entre{" "}
                    {expense.participantIds.map((id) => participantName(trip, id)).join(", ")}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {formatMoney(expense.perParticipantAmount, expense.currency)} por persona
                  </p>
                  <ExpenseWarningBanner warnings={expense.warnings} />
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={expense.status === "confirmed" ? "success" : "neutral"}>
                    {expense.status === "confirmed" ? "Confirmado" : "Borrador"}
                  </Badge>
                  {expense.status === "confirmed" && (
                    <Button variant="ghost" onClick={() => handleEditClick(expense)}>
                      Editar
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
