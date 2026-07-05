"use client";

import { useState } from "react";
import type { TripOutput } from "@/domain/trip";
import type { SuggestedTransfer } from "@/domain/settlement";
import { generateSettlement, adjustSettlement, closeSettlement } from "@/services/settlementService";
import { getActingUserId } from "@/lib/currentUser";
import { Badge, Button, Card, EmptyState } from "@/components/ui/Primitives";
import { SettlementTransferRow } from "./SettlementTransferRow";

const STATUS_LABEL: Record<string, string> = {
  suggested: "Sugerida",
  adjusted: "Ajustada por el grupo",
  accepted: "Aceptada por el grupo",
  closed: "Cerrada",
};

function participantName(trip: TripOutput, id: string): string {
  return trip.participants.find((p) => p.id === id)?.name ?? "—";
}

export function SettlementProposal({ trip }: { trip: TripOutput }) {
  const [editing, setEditing] = useState(false);
  const [draftTransfers, setDraftTransfers] = useState<SuggestedTransfer[]>(
    trip.settlement?.suggestedTransfers ?? []
  );
  const [acceptChecked, setAcceptChecked] = useState(false);
  const [closeChecked, setCloseChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectNotice, setRejectNotice] = useState<string | null>(null);

  const confirmedExpenses = trip.expenses.filter((e) => e.status === "confirmed");

  if (confirmedExpenses.length === 0) {
    return (
      <EmptyState
        title="No hay gastos para liquidar"
        description="Cuando se confirmen gastos del viaje, vas a poder generar la liquidación acá."
      />
    );
  }

  function handleGenerate() {
    setError(null);
    const result = generateSettlement({ tripId: trip.id, requestedByUserId: getActingUserId(trip.id) });
    if (!result.success) {
      setError(result.message);
      return;
    }
    setDraftTransfers(result.data.suggestedTransfers);
  }

  function handleSaveAdjustments(explicitGroupAcceptance: boolean) {
    setError(null);
    if (!trip.settlement) return;
    const result = adjustSettlement({
      tripId: trip.id,
      settlementId: trip.settlement.id,
      adjustedByUserId: getActingUserId(trip.id),
      transfers: draftTransfers,
      explicitGroupAcceptance,
    });
    if (!result.success) {
      setError(result.message);
      return;
    }
    setEditing(false);
    setAcceptChecked(false);
  }

  // Spec 5.8 — SETTLEMENT_REJECTED: la liquidación se mantiene abierta para
  // ajustes, no se cierra sin aceptación explícita.
  function handleReject() {
    setError(null);
    if (!trip.settlement) return;
    const result = adjustSettlement({
      tripId: trip.id,
      settlementId: trip.settlement.id,
      adjustedByUserId: getActingUserId(trip.id),
      transfers: trip.settlement.suggestedTransfers,
      explicitGroupAcceptance: false,
    });
    if (!result.success) {
      setError(result.message);
      return;
    }
    setRejectNotice("La liquidación quedó abierta para ajustes.");
  }

  function handleClose() {
    setError(null);
    const result = closeSettlement(trip.id, closeChecked);
    if (!result.success) {
      setError(result.message);
    }
  }

  if (!trip.settlement) {
    return (
      <Card className="space-y-3">
        <p className="text-sm text-neutral-600">
          Ya hay gastos confirmados. Cuando quieran, generen la liquidación sugerida.
        </p>
        <Button onClick={handleGenerate}>Generar liquidación</Button>
        {error && (
          <p className="text-sm font-medium text-rose-700" role="alert">
            {error}
          </p>
        )}
      </Card>
    );
  }

  const settlement = trip.settlement;
  const transfersToShow = editing ? draftTransfers : settlement.suggestedTransfers;

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-neutral-900">Liquidación</h2>
        <Badge tone="brand">{STATUS_LABEL[settlement.status]}</Badge>
      </div>

      <p className="text-sm text-neutral-600">{settlement.note}</p>

      {transfersToShow.length === 0 ? (
        <p className="text-sm text-neutral-500">No hacen falta transferencias: quedaron todos a mano.</p>
      ) : (
        <div className="space-y-2">
          {transfersToShow.map((transfer, index) => (
            <SettlementTransferRow
              key={index}
              transfer={transfer}
              fromName={participantName(trip, transfer.fromParticipantId)}
              toName={participantName(trip, transfer.toParticipantId)}
              editable={editing}
              onAmountChange={(amount) =>
                setDraftTransfers((rows) => rows.map((r, i) => (i === index ? { ...r, amount } : r)))
              }
              onRemove={() => setDraftTransfers((rows) => rows.filter((_, i) => i !== index))}
            />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm font-medium text-rose-700" role="alert">
          {error}
        </p>
      )}
      {rejectNotice && <p className="text-sm font-medium text-amber-700">{rejectNotice}</p>}

      {settlement.status === "suggested" || settlement.status === "adjusted" ? (
        <div className="space-y-3 border-t border-neutral-100 pt-3">
          {settlement.status === "suggested" && !editing && (
            <Button variant="secondary" onClick={handleReject}>
              El grupo no está de acuerdo
            </Button>
          )}
          {editing ? (
            <div className="flex gap-2">
              <Button onClick={() => handleSaveAdjustments(false)}>Guardar ajustes</Button>
              <Button variant="secondary" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              onClick={() => {
                setDraftTransfers(settlement.suggestedTransfers);
                setEditing(true);
              }}
            >
              Ajustar transferencias
            </Button>
          )}

          <div className="space-y-2 rounded-xl bg-brand-50 p-3">
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={acceptChecked}
                onChange={(e) => setAcceptChecked(e.target.checked)}
              />
              El grupo acepta esta liquidación
            </label>
            <Button
              disabled={!acceptChecked}
              onClick={() => handleSaveAdjustments(true)}
            >
              Aceptar liquidación
            </Button>
          </div>
        </div>
      ) : settlement.status === "accepted" ? (
        <div className="space-y-2 rounded-xl bg-brand-50 p-3">
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={closeChecked}
              onChange={(e) => setCloseChecked(e.target.checked)}
            />
            Confirmo el cierre del viaje
          </label>
          <Button disabled={!closeChecked} onClick={handleClose}>
            Cerrar viaje
          </Button>
        </div>
      ) : (
        <p className="text-sm font-medium text-emerald-700">El viaje quedó cerrado.</p>
      )}
    </Card>
  );
}
