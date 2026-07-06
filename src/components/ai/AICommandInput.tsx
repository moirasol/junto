"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { TripOutput } from "@/domain/trip";
import { parseNaturalLanguageCommand, type AIActionOutput } from "@/services/aiCommandService";
import { getActingUserId } from "@/lib/currentUser";
import { Button, Card, FieldLabel, TextArea } from "@/components/ui/Primitives";
import { AIReviewPanel } from "./AIReviewPanel";

export function AICommandInput({ trip }: { trip: TripOutput }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AIActionOutput | null>(null);
  const [resultKey, setResultKey] = useState(0);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setConfirmationMessage(null);
    const output = parseNaturalLanguageCommand({
      tripId: trip.id,
      userId: getActingUserId(trip.id),
      text,
      locale: "es-AR",
    });
    setResult(output);
    setResultKey((k) => k + 1);
  }

  return (
    <Card className="space-y-3">
      <div>
        <h2 className="flex items-center gap-2 font-semibold text-neutral-900">
          <Sparkles size={18} className="text-brand-600" /> Contale a Junto lo que pasó
        </h2>
        <p className="text-sm text-neutral-500">
          Por ejemplo: &ldquo;Juan pagó 45000 de supermercado para todos menos para Ana&rdquo;. Junto lo va a
          interpretar, pero nada se carga sin que lo confirmes vos.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2">
        <FieldLabel htmlFor="ai-command">Mensaje</FieldLabel>
        <TextArea
          id="ai-command"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Escribí lo que quieras contarle al grupo..."
        />
        <Button type="submit">Interpretar</Button>
      </form>

      {confirmationMessage && (
        <p className="text-sm font-medium text-emerald-700">{confirmationMessage}</p>
      )}

      {result && (
        <AIReviewPanel
          key={resultKey}
          trip={trip}
          result={result}
          onApplied={(message) => setConfirmationMessage(message)}
        />
      )}
    </Card>
  );
}
