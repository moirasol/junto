"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTrip } from "@/services/tripService";
import { getCurrentUserId } from "@/lib/currentUser";
import { ARGENTINA_DESTINATIONS } from "@/lib/argentinaDestinations";
import { Button, Card, FieldLabel, TextInput } from "@/components/ui/Primitives";

type ParticipantRow = { name: string; email: string; phone: string };

function emptyRow(): ParticipantRow {
  return { name: "", email: "", phone: "" };
}

export default function NewTripPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [participants, setParticipants] = useState<ParticipantRow[]>([emptyRow(), emptyRow()]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function updateParticipant(index: number, field: keyof ParticipantRow, value: string) {
    setParticipants((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  function addParticipantRow() {
    setParticipants((rows) => [...rows, emptyRow()]);
  }

  function removeParticipantRow(index: number) {
    setParticipants((rows) => rows.filter((_, i) => i !== index));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrorMessage(null);

    const cleanedParticipants = participants
      .filter((row) => row.name.trim())
      .map((row) => ({
        name: row.name.trim(),
        ...(row.email.trim() ? { email: row.email.trim() } : {}),
        ...(row.phone.trim() ? { phone: row.phone.trim() } : {}),
      }));

    const result = createTrip({
      name: name.trim(),
      destination: destination.trim(),
      createdByUserId: getCurrentUserId(),
      participants: cleanedParticipants,
    });

    if (!result.success) {
      setErrorMessage(result.message);
      return;
    }

    router.push(`/trips/${result.data.id}`);
  }

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-neutral-900">Crear viaje</h1>
        <p className="text-sm text-neutral-500">Arrancá el espacio compartido para organizar todo entre todos.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="space-y-4">
          <div>
            <FieldLabel htmlFor="trip-name">Nombre del viaje</FieldLabel>
            <TextInput
              id="trip-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Escapada a Córdoba"
            />
          </div>
          <div>
            <FieldLabel htmlFor="trip-destination">Destino</FieldLabel>
            <TextInput
              id="trip-destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Córdoba"
              list="argentina-destinations"
              autoComplete="off"
            />
            <datalist id="argentina-destinations">
              {ARGENTINA_DESTINATIONS.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900">Integrantes</h2>
            <Button type="button" variant="ghost" onClick={addParticipantRow}>
              + Agregar otro
            </Button>
          </div>

          <div className="space-y-3">
            {participants.map((row, index) => (
              <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_2fr_auto]">
                <div>
                  <FieldLabel htmlFor={`participant-name-${index}`}>Nombre</FieldLabel>
                  <TextInput
                    id={`participant-name-${index}`}
                    value={row.name}
                    onChange={(e) => updateParticipant(index, "name", e.target.value)}
                    placeholder="Nombre"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor={`participant-email-${index}`}>Email (opcional)</FieldLabel>
                  <TextInput
                    id={`participant-email-${index}`}
                    value={row.email}
                    onChange={(e) => updateParticipant(index, "email", e.target.value)}
                    placeholder="email@ejemplo.com"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => removeParticipantRow(index)}
                    disabled={participants.length <= 1}
                  >
                    Quitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {errorMessage && (
          <p className="text-sm font-medium text-rose-700" role="alert">
            {errorMessage}
          </p>
        )}

        <Button type="submit">Crear viaje</Button>
      </form>
    </main>
  );
}
