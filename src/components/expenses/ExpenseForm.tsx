"use client";

import { useState } from "react";
import type { TripOutput } from "@/domain/trip";
import { createExpense } from "@/services/expenseService";
import { getActingUserId } from "@/lib/currentUser";
import { Button, Card, FieldLabel, TextInput } from "@/components/ui/Primitives";

const CURRENCIES = ["ARS", "USD", "EUR"];

export function ExpenseForm({ trip }: { trip: TripOutput }) {
  const acceptedParticipants = trip.participants.filter((p) => p.status === "accepted");

  const [payerParticipantId, setPayerParticipantId] = useState(acceptedParticipants[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("ARS");
  const [description, setDescription] = useState("");
  const [participantIds, setParticipantIds] = useState<string[]>(
    acceptedParticipants.map((p) => p.id)
  );
  const [error, setError] = useState<string | null>(null);

  function toggleParticipant(id: string) {
    setParticipantIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }

  function submit() {
    setError(null);
    const result = createExpense({
      tripId: trip.id,
      createdByUserId: getActingUserId(trip.id),
      payerParticipantId,
      amount: Number(amount),
      currency,
      description: description.trim(),
      participantIds,
      status: "confirmed",
    });

    if (!result.success) {
      setError(result.message);
      return;
    }

    setAmount("");
    setDescription("");
  }

  return (
    <Card className="space-y-4">
      <h2 className="font-semibold text-neutral-900">Registrar gasto</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="expense-payer">¿Quién pagó?</FieldLabel>
          <select
            id="expense-payer"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            value={payerParticipantId}
            onChange={(e) => setPayerParticipantId(e.target.value)}
          >
            {acceptedParticipants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="expense-description">Descripción</FieldLabel>
          <TextInput
            id="expense-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Supermercado"
          />
        </div>
        <div>
          <FieldLabel htmlFor="expense-amount">Monto</FieldLabel>
          <TextInput
            id="expense-amount"
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="45000"
          />
        </div>
        <div>
          <FieldLabel htmlFor="expense-currency">Moneda</FieldLabel>
          <select
            id="expense-currency"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <FieldLabel>¿Entre quiénes se divide?</FieldLabel>
        <div className="flex flex-wrap gap-3">
          {acceptedParticipants.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={participantIds.includes(p.id)}
                onChange={() => toggleParticipant(p.id)}
              />
              {p.name}
            </label>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm font-medium text-rose-700" role="alert">
          {error}
        </p>
      )}

      <Button onClick={submit}>Confirmar gasto</Button>
    </Card>
  );
}
