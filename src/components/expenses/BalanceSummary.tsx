import type { BalanceOutput } from "@/domain/expense";
import type { TripOutput } from "@/domain/trip";
import { formatMoney } from "@/lib/money";
import { Card } from "@/components/ui/Primitives";

export function BalanceSummary({ trip, balances }: { trip: TripOutput; balances: BalanceOutput[] }) {
  if (balances.length === 0) return null;

  return (
    <Card className="space-y-2">
      <h2 className="font-semibold text-neutral-900">Balances</h2>
      <ul className="space-y-1 text-sm">
        {balances.map((balance) => {
          const name = trip.participants.find((p) => p.id === balance.participantId)?.name ?? "—";
          const tone = balance.netBalance > 0 ? "text-emerald-700" : balance.netBalance < 0 ? "text-rose-700" : "text-neutral-500";
          return (
            <li key={`${balance.participantId}-${balance.currency}`} className="flex justify-between">
              <span>{name}</span>
              <span className={tone}>
                {balance.netBalance > 0 ? "le deben " : balance.netBalance < 0 ? "debe " : ""}
                {formatMoney(Math.abs(balance.netBalance), balance.currency)}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
