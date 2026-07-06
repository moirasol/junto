"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { useTrip } from "@/lib/hooks";
import { inviteParticipants } from "@/services/tripService";
import { setActingParticipantId } from "@/lib/currentUser";
import { AvatarStack, Button, Card, FieldLabel, TextInput } from "@/components/ui/Primitives";

// TODO (spec §8): esto simula un link de invitación real. Como Junto todavía
// no tiene backend (los viajes viven en el localStorage de cada navegador),
// este link sólo funciona si se abre en el mismo navegador que ya tiene el
// viaje cargado. Una invitación entre dispositivos distintos requeriría el
// backend real (Supabase) que quedó fuera de alcance de este prototipo.
export default function JoinTripPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const trip = useTrip(tripId);
  const router = useRouter();

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (trip === undefined) return null;

  if (!trip) {
    return (
      <Card className="mx-auto mt-10 max-w-md text-center">
        <p className="text-neutral-600">Este link de invitación no es válido en este navegador.</p>
      </Card>
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const invited = inviteParticipants({
      tripId: trip!.id,
      invitedByUserId: trip!.createdByUserId,
      participants: [{ name: name.trim() }],
    });
    if (!invited.success) {
      setError(invited.message);
      return;
    }

    // Usar el link te identifica dentro del viaje, pero no implica todavía
    // que confirmaste que vas: quedás "invitado" y confirmás vos mismo con
    // "Aceptar" al entrar (mismo flujo que una invitación manual).
    const newParticipant = invited.data[0]!;
    setActingParticipantId(trip!.id, newParticipant.id);
    router.push(`/trips/${trip!.id}`);
  }

  return (
    <Card className="mx-auto mt-10 max-w-md space-y-4">
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
          {trip.destination}
        </p>
        <h1 className="text-xl font-bold text-neutral-900">{trip.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">Te invitaron a este viaje.</p>
      </div>

      {trip.participants.length > 0 && (
        <div className="flex justify-center">
          <AvatarStack names={trip.participants.map((p) => p.name)} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <FieldLabel htmlFor="join-name">Tu nombre</FieldLabel>
          <TextInput
            id="join-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="¿Cómo te llamás?"
            autoFocus
          />
        </div>
        {error && (
          <p className="text-sm font-medium text-rose-700" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full">
          <Users size={16} /> Unirme al viaje
        </Button>
      </form>
    </Card>
  );
}
