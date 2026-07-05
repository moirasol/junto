import Link from "next/link";
import type { TripOutput } from "@/domain/trip";
import { Badge, Card } from "@/components/ui/Primitives";

const STATUS_LABEL: Record<TripOutput["status"], string> = {
  draft: "Borrador",
  planning: "Organizando",
  ready: "Listo",
  in_progress: "En viaje",
  finished: "Terminado",
  closed: "Cerrado",
  deleted: "Borrado",
};

const STATUS_TONE: Record<TripOutput["status"], "neutral" | "brand" | "success"> = {
  draft: "neutral",
  planning: "brand",
  ready: "success",
  in_progress: "success",
  finished: "neutral",
  closed: "neutral",
  deleted: "neutral",
};

export function TripSummaryCard({ trip }: { trip: TripOutput }) {
  const accepted = trip.participants.filter((p) => p.status === "accepted").length;

  return (
    <Link href={`/trips/${trip.id}`}>
      <Card className="transition hover:border-brand-300 hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-neutral-900">{trip.name}</h3>
            <p className="text-sm text-neutral-500">{trip.destination}</p>
          </div>
          <Badge tone={STATUS_TONE[trip.status]}>{STATUS_LABEL[trip.status]}</Badge>
        </div>
        <p className="mt-3 text-sm text-neutral-600">
          {accepted} de {trip.participants.length} integrantes confirmaron que van.
        </p>
      </Card>
    </Link>
  );
}
