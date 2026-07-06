import Link from "next/link";
import { MapPin } from "lucide-react";
import type { TripOutput } from "@/domain/trip";
import { AvatarStack, Badge, Card } from "@/components/ui/Primitives";

const STATUS_LABEL: Record<TripOutput["status"], string> = {
  draft: "Borrador",
  planning: "Organizando",
  ready: "Listo",
  in_progress: "En viaje",
  finished: "Terminado",
  closed: "Finalizado",
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
  const accepted = trip.participants.filter((p) => p.status === "accepted");

  return (
    <Link href={`/trips/${trip.id}`}>
      <Card className="transition hover:border-brand-300 hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-neutral-900">{trip.name}</h3>
            <p className="flex items-center gap-1 text-sm text-neutral-500">
              <MapPin size={14} /> {trip.destination}
            </p>
          </div>
          <Badge tone={STATUS_TONE[trip.status]}>{STATUS_LABEL[trip.status]}</Badge>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-neutral-600">
            {accepted.length} de {trip.participants.length} confirmaron
          </p>
          {accepted.length > 0 && <AvatarStack names={accepted.map((p) => p.name)} max={3} />}
        </div>
      </Card>
    </Link>
  );
}
