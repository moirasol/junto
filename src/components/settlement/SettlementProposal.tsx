"use client";

import { useState } from "react";
import type { TripOutput } from "@/domain/trip";
import type { SuggestedTransfer } from "@/domain/settlement";
import { generateSettlement, adjustSettlement, closeSettlement } from "@/services/settlementService";
import { getActingUserId } from "@/lib/currentUser";
import { HandCoins } from "lucide-react";
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
  const [closeChecked, setCloseChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmedExpenses = trip.expenses.filter((e) => e.status === "confirmed");

  if (confirmedExpenses.length === 0) {
    return (
      <EmptyState
        icon={HandCoins}
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

      {settlement.status === "suggested" || settlement.status === "adjusted" ? (
        <div className="space-y-3 border-t border-neutral-100 pt-3">
          {/* Acción primaria: aceptar la liquidación es lo que se espera hacer
              la mayoría de las veces, así que va primero y con más peso visual. */}
          <div className="rounded-xl bg-brand-50 p-3">
            <Button onClick={() => handleSaveAdjustments(true)}>Aceptar liquidación</Button>
          </div>

          {/* Acción alternativa: menos peso visual, para no competir con la primaria. */}
          {editing ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => handleSaveAdjustments(false)}>
                Guardar ajustes
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={() => {
                setDraftTransfers(settlement.suggestedTransfers);
                setEditing(true);
              }}
            >
              Ajustar transferencias
            </Button>
          )}
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
