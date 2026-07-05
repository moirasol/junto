"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTrip } from "@/lib/hooks";
import { exportTripData, deleteTripData, closeTripWithoutExpenses } from "@/services/tripService";
import { getActingUserId } from "@/lib/currentUser";
import { SettlementProposal } from "@/components/settlement/SettlementProposal";
import { Button, Card } from "@/components/ui/Primitives";

export default function SettlementPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const trip = useTrip(tripId);
  const [deleteChecked, setDeleteChecked] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!trip) {
    return <p className="text-neutral-600">No encontramos ese viaje.</p>;
  }

  function handleExport() {
    const result = exportTripData(tripId);
    if (!result.success) {
      setMessage(result.message);
      return;
    }
    const blob = new Blob([result.data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${trip?.name ?? "viaje"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleDelete() {
    const result = deleteTripData(tripId, getActingUserId(tripId), deleteChecked);
    if (!result.success) {
      setMessage(result.message);
      return;
    }
    router.push("/trips");
  }

  function handleCloseWithoutExpenses() {
    const result = closeTripWithoutExpenses(tripId);
    if (!result.success) {
      setMessage(result.message);
    }
  }

  return (
    <main className="space-y-6">
      <Link href={`/trips/${tripId}`} className="text-sm text-brand-700 hover:underline">
        ← Volver al viaje
      </Link>

      <h1 className="text-2xl font-bold text-neutral-900">Liquidación</h1>

      <SettlementProposal trip={trip} />

      {trip.expenses.length === 0 && trip.status !== "closed" && (
        <Card className="space-y-2">
          <p className="text-sm text-neutral-600">
            Este viaje no tiene gastos. Si ya terminó, pueden cerrarlo directamente.
          </p>
          <Button variant="secondary" onClick={handleCloseWithoutExpenses}>
            Cerrar viaje sin gastos
          </Button>
        </Card>
      )}

      <Card className="space-y-3">
        <h2 className="font-semibold text-neutral-900">Datos del viaje</h2>
        <p className="text-sm text-neutral-500">
          Sólo se puede exportar la información cuando el viaje está cerrado.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={trip.status !== "closed"} onClick={handleExport}>
            Exportar datos
          </Button>
        </div>

        <div className="space-y-2 border-t border-neutral-100 pt-3">
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={deleteChecked}
              onChange={(e) => setDeleteChecked(e.target.checked)}
            />
            Confirmo que quiero borrar este viaje
          </label>
          <Button variant="secondary" disabled={!deleteChecked} onClick={handleDelete}>
            Borrar viaje
          </Button>
        </div>

        {message && (
          <p className="text-sm font-medium text-rose-700" role="alert">
            {message}
          </p>
        )}
      </Card>
    </main>
  );
}
