"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useTripsList } from "@/lib/hooks";
import { TripSummaryCard } from "@/components/trips/TripSummaryCard";
import { Button, EmptyState } from "@/components/ui/Primitives";

export default function TripsPage() {
  const trips = useTripsList();

  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-600">Junto</h1>
          <p className="text-sm text-neutral-500">Tus viajes en grupo, sin que todo caiga en uno solo.</p>
        </div>
        <Link href="/trips/new">
          <Button>
            <Plus size={16} /> Crear viaje
          </Button>
        </Link>
      </header>

      {trips.length === 0 ? (
        <EmptyState
          title="Todavía no armaste ningún viaje"
          description="Creá uno e invitá a tu grupo para arrancar a coordinar."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {trips.map((trip) => (
            <TripSummaryCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </main>
  );
}
