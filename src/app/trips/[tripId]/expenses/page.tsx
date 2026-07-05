"use client";

import { useParams } from "next/navigation";
import { Wallet } from "lucide-react";
import { useTrip } from "@/lib/hooks";
import { calculateBalances } from "@/services/expenseService";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";
import { BalanceSummary } from "@/components/expenses/BalanceSummary";
import { EmptyState } from "@/components/ui/Primitives";

export default function ExpensesPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const trip = useTrip(tripId);

  if (!trip) return null;

  const acceptedParticipants = trip.participants.filter((p) => p.status === "accepted");
  const balances = calculateBalances(tripId);

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-neutral-900">
        <Wallet className="text-brand-600" /> Gastos
      </h1>

      {acceptedParticipants.length === 0 ? (
        <EmptyState
          title="Todavía no hay nadie confirmado"
          description="Necesitás al menos un integrante que haya aceptado el viaje para cargar gastos."
        />
      ) : (
        <ExpenseForm trip={trip} />
      )}

      {trip.expenses.length === 0 ? (
        <EmptyState
          title="Este viaje todavía no tiene gastos"
          description="Cuando alguien pague algo, cargalo acá para llevar la cuenta entre todos."
        />
      ) : (
        <>
          <ExpenseTable trip={trip} />
          <BalanceSummary trip={trip} balances={balances} />
        </>
      )}
    </div>
  );
}
