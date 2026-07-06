"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createTrip } from "@/services/tripService";
import { getCurrentUserId } from "@/lib/currentUser";
import { getFrequentParticipantNames } from "@/lib/frequentParticipants";
import { Button, Card, FieldLabel, TextInput } from "@/components/ui/Primitives";

export default function NewTripPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [yourName, setYourName] = useState("");
  const [selectedFrequent, setSelectedFrequent] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [frequentNames, setFrequentNames] = useState<string[]>([]);

  // Se calcula en un efecto (no en el render) porque lee localStorage: en el
  // server no existe, y calcularlo directo en el render rompe la hidratación.
  useEffect(() => {
    setFrequentNames(getFrequentParticipantNames([yourName]));
  }, [yourName]);

  function toggleFrequent(frequentName: string) {
    setSelectedFrequent((selected) => {
      const next = new Set(selected);
      if (next.has(frequentName)) {
        next.delete(frequentName);
      } else {
        next.add(frequentName);
      }
      return next;
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrorMessage(null);

    if (!yourName.trim()) {
      setErrorMessage("Ingresá tu nombre para poder identificarte como quien creó el viaje.");
      return;
    }

    const result = createTrip({
      name: name.trim(),
      destination: destination.trim(),
      createdByUserId: getCurrentUserId(),
      // Vos (quien crea el viaje) siempre vas primero en la lista, para que
      // quede claro quién lo creó (ver etiqueta "creador" en Integrantes). El
      // resto de la gente se suma después desde Integrantes (a mano o por
      // link) — acá sólo se pre-cargan compañeros frecuentes, si los elegís.
      participants: [
        { name: yourName.trim() },
        ...[...selectedFrequent].map((frequentName) => ({ name: frequentName })),
      ],
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
            />
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <FieldLabel htmlFor="your-name">Tu nombre</FieldLabel>
            <TextInput
              id="your-name"
              value={yourName}
              onChange={(e) => setYourName(e.target.value)}
              placeholder="¿Cómo te llamás?"
            />
            <p className="mt-1 text-xs text-neutral-500">
              Vas a quedar identificado como quien creó este viaje.
            </p>
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold text-neutral-900">Compañeros frecuentes</h2>
          {frequentNames.length > 0 ? (
            <>
              <p className="text-xs font-medium text-neutral-500">Ya viajaste con ellos, ¿los sumás?</p>
              <div className="flex flex-wrap gap-2">
                {frequentNames.map((frequentName) => {
                  const selected = selectedFrequent.has(frequentName);
                  return (
                    <button
                      key={frequentName}
                      type="button"
                      onClick={() => toggleFrequent(frequentName)}
                      className={
                        selected
                          ? "rounded-full bg-brand-600 px-3 py-1 text-sm font-medium text-white"
                          : "rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 hover:bg-brand-100"
                      }
                    >
                      {selected ? "✓ " : "+ "}
                      {frequentName}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-sm text-neutral-500">
              Todavía no tenés compañeros frecuentes. Después de crear el viaje, invitá al resto del grupo
              desde Integrantes (por nombre o compartiendo el link).
            </p>
          )}
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
