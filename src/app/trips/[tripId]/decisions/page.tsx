"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ListChecks } from "lucide-react";
import { useTrip } from "@/lib/hooks";
import { createDecision } from "@/services/decisionService";
import { getActingUserId } from "@/lib/currentUser";
import type { DecisionType } from "@/domain/decision";
import { DecisionCard } from "@/components/decisions/DecisionCard";
import { Button, Card, EmptyState, FieldLabel, TextInput } from "@/components/ui/Primitives";

const TYPE_OPTIONS: Array<{ value: DecisionType; label: string }> = [
  { value: "dates", label: "Fechas" },
  { value: "accommodation", label: "Alojamiento" },
  { value: "transport", label: "Transporte" },
];

export default function DecisionsPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const trip = useTrip(tripId);

  const [type, setType] = useState<DecisionType>("dates");
  const [optionLabels, setOptionLabels] = useState(["", ""]);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  if (!trip) return null;

  function updateOption(index: number, value: string) {
    setOptionLabels((labels) => labels.map((label, i) => (i === index ? value : label)));
  }

  function addOptionField() {
    setOptionLabels((labels) => [...labels, ""]);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const options = optionLabels
      .map((label) => label.trim())
      .filter(Boolean)
      .map((label) => ({ label }));

    const result = createDecision({
      tripId,
      createdByUserId: getActingUserId(tripId),
      type,
      options,
    });

    if (!result.success) {
      setError(result.message);
      return;
    }

    setOptionLabels(["", ""]);
    setFormOpen(false);
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-neutral-900">
          <ListChecks className="text-brand-600" /> Decisiones
        </h1>
        <Button onClick={() => setFormOpen((v) => !v)}>{formOpen ? "Cancelar" : "+ Nueva decisión"}</Button>
      </header>

      {formOpen && (
        <Card className="space-y-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <FieldLabel htmlFor="decision-type">Tipo</FieldLabel>
              <select
                id="decision-type"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value as DecisionType)}
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <FieldLabel>Opciones</FieldLabel>
              {optionLabels.map((label, index) => (
                <TextInput
                  key={index}
                  value={label}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Opción ${index + 1}`}
                />
              ))}
              <Button type="button" variant="ghost" onClick={addOptionField}>
                + Agregar opción
              </Button>
            </div>
            {error && (
              <p className="text-sm font-medium text-rose-700" role="alert">
                {error}
              </p>
            )}
            <Button type="submit">Crear decisión</Button>
          </form>
        </Card>
      )}

      {trip.decisions.length === 0 ? (
        <EmptyState
          title="Todavía no hay decisiones"
          description="Creá la primera para empezar a definir fechas, alojamiento o transporte."
        />
      ) : (
        <div className="space-y-4">
          {trip.decisions.map((decision) => (
            <DecisionCard key={decision.id} trip={trip} decision={decision} />
          ))}
        </div>
      )}
    </div>
  );
}
