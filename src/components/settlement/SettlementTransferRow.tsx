import type { SuggestedTransfer } from "@/domain/settlement";
import { formatMoney } from "@/lib/money";
import { Button, TextInput } from "@/components/ui/Primitives";

export function SettlementTransferRow({
  transfer,
  fromName,
  toName,
  editable,
  onAmountChange,
  onRemove,
}: {
  transfer: SuggestedTransfer;
  fromName: string;
  toName: string;
  editable: boolean;
  onAmountChange?: (amount: number) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-2 text-sm">
      <span>
        <strong>{fromName}</strong> le transfiere a <strong>{toName}</strong>
      </span>
      {editable ? (
        <div className="flex items-center gap-2">
          <TextInput
            type="number"
            className="w-28"
            min="0"
            value={transfer.amount}
            onChange={(e) => onAmountChange?.(Number(e.target.value))}
            aria-label={`Monto de ${fromName} a ${toName}`}
          />
          <Button variant="ghost" onClick={onRemove}>
            Quitar
          </Button>
        </div>
      ) : (
        <span className="font-medium">{formatMoney(transfer.amount, transfer.currency)}</span>
      )}
    </div>
  );
}
