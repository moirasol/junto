"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { TripOutput } from "@/domain/trip";
import type { AIAction, AIActionOutput, AIActionType } from "@/services/aiCommandService";
import { createExpense } from "@/services/expenseService";
import { generateSettlement } from "@/services/settlementService";
import { voteDecision } from "@/services/decisionService";
import { getActingParticipantId, getActingUserId } from "@/lib/currentUser";
import { normalizeText } from "@/lib/text";
import { formatMoney } from "@/lib/money";
import { Badge, Card } from "@/components/ui/Primitives";

const ACTION_LABEL: Record<AIAction["type"], string> = {
  suggest_reminder: "Sugerencia de recordatorio",
  summarize_decision: "Resumen de decisión",
  detect_blocked_decision: "Decisión trabada",
  suggest_next_step: "Decisión pendiente detectada",
  parse_expense: "Gasto detectado",
  parse_transport_option: "Opción de transporte detectada",
  parse_date_option: "Posible fecha detectada",
  vote_decision: "Voto detectado",
  generate_settlement: "Liquidación",
};

// Sólo estos tipos escriben algo (gasto, voto, liquidación): necesitan
// confirmación explícita con check/cancel. El resto son avisos informativos
// que no cambian nada en el viaje, así que no piden ninguna acción.
const ACTIONABLE_TYPES: AIActionType[] = ["parse_expense", "vote_decision", "generate_settlement"];

function findParticipantByName(trip: TripOutput, name: string) {
  const normalized = normalizeText(name);
  return trip.participants.find((p) => normalizeText(p.name) === normalized);
}

export function AIReviewPanel({
  trip,
  result,
  onApplied,
}: {
  trip: TripOutput;
  result: AIActionOutput;
  onApplied: (message: string) => void;
}) {
  const [appliedIndexes, setAppliedIndexes] = useState<Set<number>>(new Set());
  const [dismissedIndexes, setDismissedIndexes] = useState<Set<number>>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);

  function markApplied(index: number) {
    setAppliedIndexes((prev) => new Set(prev).add(index));
  }

  function markDismissed(index: number) {
    setActionError(null);
    setDismissedIndexes((prev) => new Set(prev).add(index));
  }

  function applyExpense(action: AIAction, index: number) {
    setActionError(null);
    const payload = action.payload as {
      payerName: string;
      amount: number;
      currency: string;
      description: string;
      excludedParticipantNames: string[];
    };

    const payer = findParticipantByName(trip, payload.payerName);
    if (!payer) {
      setActionError(`No encontramos a ${payload.payerName} entre los integrantes del viaje.`);
      return;
    }

    const excludedIds = new Set(
      payload.excludedParticipantNames
        .map((name) => findParticipantByName(trip, name)?.id)
        .filter((id): id is string => Boolean(id))
    );

    const participantIds = trip.participants
      .filter((p) => p.status === "accepted" && !excludedIds.has(p.id))
      .map((p) => p.id);

    const result = createExpense({
      tripId: trip.id,
      createdByUserId: getActingUserId(trip.id),
      payerParticipantId: payer.id,
      amount: payload.amount,
      currency: payload.currency,
      description: payload.description,
      participantIds,
      status: "confirmed",
    });

    if (!result.success) {
      setActionError(result.message);
      return;
    }

    markApplied(index);
    onApplied("Gasto cargado a partir del texto.");
  }

  function applyVote(action: AIAction, index: number) {
    setActionError(null);
    const payload = action.payload as { decisionId: string; optionId: string };
    const participantId = getActingParticipantId(trip.id);

    if (!participantId) {
      setActionError("Elegí quién sos en Integrantes para poder votar.");
      return;
    }

    const result = voteDecision({
      tripId: trip.id,
      decisionId: payload.decisionId,
      participantId,
      optionId: payload.optionId,
    });

    if (!result.success) {
      setActionError(result.message);
      return;
    }

    markApplied(index);
    onApplied("Voto registrado a partir del texto.");
  }

  function applySettlement(index: number) {
    setActionError(null);
    const result = generateSettlement({ tripId: trip.id, requestedByUserId: getActingUserId(trip.id) });
    if (!result.success) {
      setActionError(result.message);
      return;
    }
    markApplied(index);
    onApplied("Liquidación generada.");
  }

  function applyAction(action: AIAction, index: number) {
    if (action.type === "parse_expense") applyExpense(action, index);
    else if (action.type === "generate_settlement") applySettlement(index);
    else if (action.type === "vote_decision") applyVote(action, index);
  }

  return (
    <Card className="space-y-3">
      <p className="text-sm text-neutral-700">{result.message}</p>

      {actionError && (
        <p className="text-sm font-medium text-rose-700" role="alert">
          {actionError}
        </p>
      )}

      <ul className="space-y-2">
        {result.actions.map((action, index) => {
          const applied = appliedIndexes.has(index);
          const dismissed = dismissedIndexes.has(index);
          const isActionable = ACTIONABLE_TYPES.includes(action.type);
          const needsReview = action.confidence < 0.8;

          return (
            <li key={index} className="rounded-xl border border-neutral-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-neutral-900">
                  {ACTION_LABEL[action.type]}
                </span>
                {isActionable && !applied && !dismissed && (
                  <div className="flex items-center gap-2">
                    {needsReview && <Badge tone="warning">Revisar</Badge>}
                    <button
                      type="button"
                      aria-label="Aplicar"
                      onClick={() => applyAction(action, index)}
                      className="rounded-full bg-emerald-100 p-1.5 text-emerald-700 hover:bg-emerald-200"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Descartar"
                      onClick={() => markDismissed(index)}
                      className="rounded-full bg-neutral-100 p-1.5 text-neutral-500 hover:bg-neutral-200"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <ActionPayloadPreview action={action} />

              {applied && <p className="mt-2 text-sm font-medium text-emerald-700">Aplicado.</p>}
              {dismissed && <p className="mt-2 text-sm text-neutral-400">Descartado.</p>}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function ActionPayloadPreview({ action }: { action: AIAction }) {
  if (action.type === "parse_expense") {
    const payload = action.payload as {
      payerName: string;
      amount: number;
      currency: string;
      description: string;
      excludedParticipantNames: string[];
    };
    return (
      <p className="mt-1 text-sm text-neutral-600">
        {payload.payerName} pagó {formatMoney(payload.amount, payload.currency)} de {payload.description}
        {payload.excludedParticipantNames.length > 0
          ? `, sin contar a ${payload.excludedParticipantNames.join(", ")}`
          : ""}
        .
      </p>
    );
  }

  if (action.type === "parse_transport_option") {
    const payload = action.payload as { ownerName: string; seats: number };
    return (
      <p className="mt-1 text-sm text-neutral-600">
        {payload.ownerName} ofrece auto con {payload.seats} lugares.
      </p>
    );
  }

  if (action.type === "parse_date_option") {
    const payload = action.payload as { rawText: string };
    return <p className="mt-1 text-sm text-neutral-600">&ldquo;{payload.rawText}&rdquo;</p>;
  }

  if (action.type === "vote_decision") {
    const payload = action.payload as { label: string };
    return (
      <p className="mt-1 text-sm text-neutral-600">Votar por &ldquo;{payload.label}&rdquo;.</p>
    );
  }

  if (action.type === "suggest_next_step") {
    const payload = action.payload as { decisionType: string };
    const label: Record<string, string> = {
      dates: "fechas",
      accommodation: "alojamiento",
      transport: "transporte",
    };
    return (
      <p className="mt-1 text-sm text-neutral-600">
        Todavía falta elegir {label[payload.decisionType] ?? payload.decisionType}.
      </p>
    );
  }

  return null;
}
