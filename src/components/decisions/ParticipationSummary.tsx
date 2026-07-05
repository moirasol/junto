"use client";

import { useState } from "react";
import type { DecisionOutput } from "@/domain/decision";
import type { ParticipantOutput } from "@/domain/participant";
import { joinWithY } from "@/lib/text";
import { Button } from "@/components/ui/Primitives";

// Spec 5.1 — PARTICIPANT_NOT_RESPONDING: participantes aceptados sin voto en
// una decisión abierta. No cierra la decisión automáticamente; sólo informa
// y sugiere un recordatorio.
// TODO (spec §8): no está definido si los recordatorios son automáticos o
// requieren confirmación humana, ni el canal de invitación/recordatorio. Acá
// "Enviar recordatorio" es un mock: no manda ninguna notificación real.
export function ParticipationSummary({
  decision,
  participants,
}: {
  decision: DecisionOutput;
  participants: ParticipantOutput[];
}) {
  const { votedParticipants, totalParticipants, missingParticipantIds } = decision.participation;
  const [reminderSentTo, setReminderSentTo] = useState<string | null>(null);

  const missingNames = missingParticipantIds
    .map((id) => participants.find((p) => p.id === id)?.name)
    .filter((name): name is string => Boolean(name));

  const showReminder = missingNames.length > 0 && decision.status !== "confirmed";

  return (
    <div className="text-sm text-neutral-600">
      <p>
        Votaron {votedParticipants} de {totalParticipants}.
      </p>
      {showReminder && (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-amber-700">Faltan responder {joinWithY(missingNames)}.</p>
          <Button variant="ghost" onClick={() => setReminderSentTo(joinWithY(missingNames))}>
            Enviar recordatorio
          </Button>
        </div>
      )}
      {reminderSentTo && (
        <p className="mt-1 text-xs text-neutral-500">
          Se armó un recordatorio para {reminderSentTo}. (Todavía no hay un canal real de envío.)
        </p>
      )}
    </div>
  );
}
