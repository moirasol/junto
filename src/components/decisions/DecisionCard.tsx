"use client";

import { useState } from "react";
import type { DecisionOutput } from "@/domain/decision";
import type { TripOutput } from "@/domain/trip";
import { voteDecision, confirmDecision, markDecisionReviewed } from "@/services/decisionService";
import { getActingParticipantId, getActingUserId } from "@/lib/currentUser";
import { joinWithY } from "@/lib/text";
import { Button, Card } from "@/components/ui/Primitives";
import { DecisionOptionCard } from "./DecisionOptionCard";
import { DecisionStatusBadge } from "./DecisionStatusBadge";
import { ParticipationSummary } from "./ParticipationSummary";

export function DecisionCard({ trip, decision }: { trip: TripOutput; decision: DecisionOutput }) {
  const [error, setError] = useState<string | null>(null);
  const [selectedForConfirm, setSelectedForConfirm] = useState<string>(
    decision.options.find((o) => o.isTopOption)?.id ?? decision.options[0]?.id ?? ""
  );
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideChecked, setOverrideChecked] = useState(false);

  const actingParticipantId = getActingParticipantId(trip.id);
  const myVote = decision.votes.find((v) => v.participantId === actingParticipantId);

  function handleVote(optionId: string) {
    setError(null);
    if (!actingParticipantId) {
      setError("Elegí quién sos en Integrantes para poder votar.");
      return;
    }
    const result = voteDecision({
      tripId: trip.id,
      decisionId: decision.id,
      participantId: actingParticipantId,
      optionId,
    });
    if (!result.success) setError(result.message);
  }

  function handleConfirm(explicitlyChecked: boolean) {
    setError(null);
    if (!explicitlyChecked) {
      setError("Confirmá explícitamente para cerrar esta decisión.");
      return;
    }
    const result = confirmDecision({
      tripId: trip.id,
      decisionId: decision.id,
      confirmedByUserId: getActingUserId(trip.id),
      selectedOptionId: selectedForConfirm,
      explicitConfirmation: true,
    });
    if (!result.success) setError(result.message);
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-neutral-900">{decision.displayTitle}</h3>
        <DecisionStatusBadge status={decision.status} />
      </div>

      {decision.description && <p className="text-sm text-neutral-600">{decision.description}</p>}
      {decision.aiSummary && decision.status !== "confirmed" && (
        <p className="text-sm italic text-neutral-500">{decision.aiSummary}</p>
      )}

      <div className="space-y-2">
        {decision.options.map((option) => (
          <DecisionOptionCard
            key={option.id}
            option={option}
            isMyVote={myVote?.optionId === option.id}
            votingDisabled={decision.status === "confirmed" || decision.status === "needs_review"}
            onVote={() => handleVote(option.id)}
          />
        ))}
      </div>

      <ParticipationSummary decision={decision} participants={trip.participants} />

      {decision.status === "blocked" && (
        // Spec 5.2 — VOTE_TIE: no se elige una opción automáticamente. El
        // empate se destraba si alguien cambia su voto.
        <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
          Hay empate entre{" "}
          {joinWithY(
            decision.options.filter((o) => o.isTopOption && o.voteCount > 0).map((o) => o.label)
          )}
          . El grupo tiene que destrabar la decisión: alguien puede cambiar su voto para desempatar.
        </div>
      )}

      {decision.status === "needs_review" && (
        // Spec 5.4 / 5.5 — needs_review: no se reabre solo, alguien del
        // grupo tiene que revisarla explícitamente.
        <div className="space-y-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          <p>{decision.aiSummary ?? "Esta decisión necesita revisión."}</p>
          <Button
            variant="secondary"
            onClick={() => {
              const result = markDecisionReviewed(trip.id, decision.id);
              if (!result.success) setError(result.message);
            }}
          >
            Ya la revisamos, volver a abrir
          </Button>
        </div>
      )}

      {decision.status === "confirmed" ? (
        <p className="text-sm font-medium text-emerald-700">
          El grupo confirmó: {decision.options.find((o) => o.id === decision.selectedOptionId)?.label}
        </p>
      ) : decision.status === "ready_to_confirm" ? (
        <div className="space-y-2 rounded-xl bg-brand-50 p-3">
          <p className="text-sm text-neutral-700">
            Ya hay suficientes votos para &ldquo;
            {decision.options.find((o) => o.id === selectedForConfirm)?.label}
            &rdquo;.
          </p>
          <Button onClick={() => handleConfirm(true)}>Confirmar decisión</Button>
        </div>
      ) : decision.status === "open" && decision.participation.votedParticipants > 0 ? (
        // Spec 5.3 — CONSENSUS_NOT_REACHED: no confirmar salvo override
        // humano explícito.
        <div className="space-y-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          <p>
            Todavía no hay suficiente participación para cerrar esta decisión. Faltan{" "}
            {decision.participation.totalParticipants - decision.participation.votedParticipants} voto
            {decision.participation.totalParticipants - decision.participation.votedParticipants === 1
              ? ""
              : "s"}
            .
          </p>
          {!overrideOpen ? (
            <Button variant="ghost" onClick={() => setOverrideOpen(true)}>
              El grupo prefiere avanzar igual
            </Button>
          ) : (
            <div className="space-y-2">
              <select
                aria-label="Opción a confirmar de todos modos"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                value={selectedForConfirm}
                onChange={(e) => setSelectedForConfirm(e.target.value)}
              >
                {decision.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={overrideChecked}
                  onChange={(e) => setOverrideChecked(e.target.checked)}
                />
                Confirmo que el grupo decide avanzar sin esperar a que voten todos
              </label>
              <Button onClick={() => handleConfirm(overrideChecked)}>Confirmar de todos modos</Button>
            </div>
          )}
        </div>
      ) : null}

      {error && (
        <p className="text-sm font-medium text-rose-700" role="alert">
          {error}
        </p>
      )}
    </Card>
  );
}
