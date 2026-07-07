import type { TripOutput } from "@/domain/trip";
import { getDecisionDisplayTitle } from "@/domain/decision";
import { checkCoordinationConcentration } from "@/services/decisionService";
import { REQUIRED_DECISION_TYPES } from "@/services/tripService";
import { Badge, Card } from "@/components/ui/Primitives";
import { DecisionStatusBadge } from "@/components/decisions/DecisionStatusBadge";

export function NextActionPanel({ trip }: { trip: TripOutput }) {
  const pending = trip.decisions.filter((d) => d.status !== "confirmed");
  const resolved = trip.decisions.filter((d) => d.status === "confirmed");

  // Además de las decisiones ya creadas, se avisa si falta directamente
  // crear alguno de los 3 tipos obligatorios (spec 4.1.5) — si no, "Próximos
  // pasos" podía decir "no queda nada pendiente" con alojamiento/transporte
  // ni siquiera propuestos.
  const existingTypes = new Set(trip.decisions.map((d) => d.type));
  const missingTypes = REQUIRED_DECISION_TYPES.filter((type) => !existingTypes.has(type));

  const participantsWithMissingVotes = new Set(
    pending.flatMap((d) => d.participation.missingParticipantIds)
  );

  // Spec 5.10 — COORDINATION_CONCENTRATED: no bloquea el avance, sólo alerta.
  const { concentrated } = checkCoordinationConcentration(trip.id);

  return (
    <Card className="space-y-4">
      <h2 className="font-semibold text-neutral-900">Próximos pasos</h2>

      <div>
        <Badge tone="warning" className="mb-2">
          Pendientes
        </Badge>
        {pending.length === 0 && missingTypes.length === 0 ? (
          <p className="text-sm text-neutral-500">No queda nada pendiente. Buen momento para pasar a gastos.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {pending.map((decision) => (
              <li key={decision.id} className="flex items-center justify-between gap-2 text-sm">
                <span>{decision.displayTitle}</span>
                <DecisionStatusBadge status={decision.status} />
              </li>
            ))}
            {missingTypes.map((type) => (
              <li key={type} className="flex items-center justify-between gap-2 text-sm">
                <span>{getDecisionDisplayTitle(type)}</span>
                <Badge tone="neutral">Sin crear</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <Badge tone="success" className="mb-2">
          Resueltas
        </Badge>
        {resolved.length === 0 ? (
          <p className="text-sm text-neutral-500">Todavía no se confirmó ninguna decisión.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-neutral-600">
            {resolved.map((decision) => {
              const selected = decision.options.find((o) => o.id === decision.selectedOptionId);
              return (
                <li key={decision.id}>
                  {decision.displayTitle}: {selected?.label ?? "—"}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {participantsWithMissingVotes.size > 0 && (
        <Badge tone="warning">
          Faltan {participantsWithMissingVotes.size} respuesta{participantsWithMissingVotes.size > 1 ? "s" : ""} en decisiones abiertas
        </Badge>
      )}

      {concentrated && (
        <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          <p>La organización está quedando concentrada en una sola persona. Falta participación del grupo.</p>
          <p className="mt-1 text-xs text-amber-700">
            Sugerencia: pedir votos o comentarios a quienes todavía no participaron.
          </p>
        </div>
      )}
    </Card>
  );
}
