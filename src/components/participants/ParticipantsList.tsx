"use client";

import { useState } from "react";
import type { TripOutput } from "@/domain/trip";
import { acceptInvitation, inviteParticipants, markParticipantLeft } from "@/services/tripService";
import { getActingParticipantId, setActingParticipantId } from "@/lib/currentUser";
import { formatDateTime } from "@/lib/dates";
import { Badge, Button, Card, FieldLabel, TextInput } from "@/components/ui/Primitives";

const STATUS_LABEL: Record<string, string> = {
  invited: "Invitado",
  accepted: "Confirmado",
  rejected: "No va",
  left: "Se bajó",
};

const STATUS_TONE: Record<string, "neutral" | "brand" | "success" | "danger"> = {
  invited: "neutral",
  accepted: "success",
  rejected: "danger",
  left: "neutral",
};

export function ParticipantsList({ trip }: { trip: TripOutput }) {
  const [addingOpen, setAddingOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [leaveNotice, setLeaveNotice] = useState<string | null>(null);
  const [, forceRerender] = useState(0);

  const actingParticipantId = getActingParticipantId(trip.id);

  function handleAccept(participantId: string, participantName: string, response: "accepted" | "rejected") {
    const result = acceptInvitation({ tripId: trip.id, participantId, response });
    // Spec 5.5 — LATE_PARTICIPANT_ADDED
    if (result.success && result.data.affectedDecisionIds?.length) {
      setLeaveNotice(
        `${participantName} se sumó al viaje. Hay decisiones que pueden necesitar revisión.`
      );
    }
  }

  // Spec 5.4 — PARTICIPANT_LEFT
  function handleLeave(participantId: string, participantName: string) {
    const result = markParticipantLeft(trip.id, participantId);
    if (!result.success) {
      setError(result.message);
      return;
    }

    // Spec 5.9 — ORGANIZER_INACTIVE_OR_LEFT. El spec no define cómo se
    // vincula el organizador (createdByUserId) con un participante (TODO
    // §8: ownership si el organizador abandona). Como convención mínima se
    // asume que el primer integrante cargado es quien organizó el viaje.
    if (trip.participants[0]?.id === participantId) {
      setLeaveNotice(
        "El viaje puede seguir. El grupo todavía puede tomar decisiones y registrar gastos."
      );
      return;
    }

    const { affectedDecisionIds, affectedExpenseIds } = result.data;
    if (affectedDecisionIds.length > 0 || affectedExpenseIds.length > 0) {
      setLeaveNotice(
        `${participantName} salió del viaje. Revisá las decisiones y gastos afectados.`
      );
    } else {
      setLeaveNotice(`${participantName} salió del viaje.`);
    }
  }

  function handleChooseActing(participantId: string) {
    setActingParticipantId(trip.id, participantId);
    forceRerender((n) => n + 1);
  }

  function handleAddParticipant(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const result = inviteParticipants({
      tripId: trip.id,
      invitedByUserId: trip.createdByUserId,
      participants: [{ name: newName.trim() }],
    });
    if (!result.success) {
      setError(result.message);
      return;
    }
    setNewName("");
    setAddingOpen(false);
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-neutral-900">Integrantes</h2>
        <Button type="button" variant="ghost" onClick={() => setAddingOpen((v) => !v)}>
          + Invitar
        </Button>
      </div>

      {addingOpen && (
        <form onSubmit={handleAddParticipant} className="flex items-end gap-2">
          <div className="flex-1">
            <FieldLabel htmlFor="new-participant-name">Nombre</FieldLabel>
            <TextInput
              id="new-participant-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre del nuevo integrante"
            />
          </div>
          <Button type="submit">Invitar</Button>
        </form>
      )}
      {error && (
        <p className="text-sm font-medium text-rose-700" role="alert">
          {error}
        </p>
      )}
      {leaveNotice && <p className="text-sm font-medium text-amber-700">{leaveNotice}</p>}

      <ul className="divide-y divide-neutral-100">
        {trip.participants.map((participant, index) => (
          <li key={participant.id} className="flex items-center justify-between gap-3 py-2">
            <div>
              <p className="font-medium text-neutral-900">
                {participant.name}
                {actingParticipantId === participant.id && (
                  <span className="ml-2 text-xs font-normal text-brand-700">(vos)</span>
                )}
                {index === 0 && (
                  <span className="ml-2 text-xs font-normal text-neutral-400">(organiza)</span>
                )}
              </p>
              {participant.joinedAt && (
                <p className="text-xs text-neutral-400">
                  Confirmó el {formatDateTime(participant.joinedAt)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={STATUS_TONE[participant.status]}>{STATUS_LABEL[participant.status]}</Badge>
              {participant.status === "invited" && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => handleAccept(participant.id, participant.name, "accepted")}
                  >
                    Aceptar
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleAccept(participant.id, participant.name, "rejected")}
                  >
                    Rechazar
                  </Button>
                </>
              )}
              {participant.status === "accepted" && actingParticipantId !== participant.id && (
                <Button variant="ghost" onClick={() => handleChooseActing(participant.id)}>
                  Actuar como
                </Button>
              )}
              {participant.status === "accepted" && (
                <Button
                  variant="ghost"
                  onClick={() => handleLeave(participant.id, participant.name)}
                >
                  Se baja del viaje
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
