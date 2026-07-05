import type { ExpenseOutput } from "@/domain/expense";

export function ExpenseWarningBanner({ warnings }: { warnings: ExpenseOutput["warnings"] }) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="space-y-1 rounded-lg bg-amber-50 p-2 text-sm text-amber-800">
      {warnings.map((warning) => (
        <p key={warning.code}>{warning.message}</p>
      ))}
    </div>
  );
}
