"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTrip } from "@/lib/hooks";
import { ParticipantsList } from "@/components/participants/ParticipantsList";
import { NextActionPanel } from "@/components/trips/NextActionPanel";
import { AICommandInput } from "@/components/ai/AICommandInput";
import { Badge, Card } from "@/components/ui/Primitives";

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  planning: "Organizando",
  ready: "Listo para viajar",
  in_progress: "En viaje",
  finished: "Terminado",
  closed: "Cerrado",
  deleted: "Borrado",
};

export default function TripPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const trip = useTrip(tripId);

  if (!trip) {
    return (
      <main className="space-y-4">
        <Link href="/trips" className="text-sm text-brand-700 hover:underline">
          ← Volver a tus viajes
        </Link>
        <p className="text-neutral-600">No encontramos ese viaje.</p>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <Link href="/trips" className="text-sm text-brand-700 hover:underline">
        ← Volver a tus viajes
      </Link>

      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{trip.name}</h1>
          <p className="text-sm text-neutral-500">{trip.destination}</p>
        </div>
        <Badge tone="brand">{STATUS_LABEL[trip.status]}</Badge>
      </header>

      <Card className="flex flex-wrap gap-4 text-sm">
        <Link href={`/trips/${trip.id}/decisions`} className="font-medium text-brand-700 hover:underline">
          Decisiones
        </Link>
        <Link href={`/trips/${trip.id}/expenses`} className="font-medium text-brand-700 hover:underline">
          Gastos
        </Link>
        <Link href={`/trips/${trip.id}/settlement`} className="font-medium text-brand-700 hover:underline">
          Liquidación
        </Link>
      </Card>

      <ParticipantsList trip={trip} />
      <NextActionPanel trip={trip} />
      <AICommandInput trip={trip} />
    </main>
  );
}
