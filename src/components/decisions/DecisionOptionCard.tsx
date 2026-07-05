import type { DecisionOptionOutput } from "@/domain/decision";
import { Badge } from "@/components/ui/Primitives";
import { VoteButton } from "./VoteButton";

export function DecisionOptionCard({
  option,
  isMyVote,
  votingDisabled,
  onVote,
}: {
  option: DecisionOptionOutput;
  isMyVote: boolean;
  votingDisabled: boolean;
  onVote: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 p-3">
      <div>
        <p className="font-medium text-neutral-900">
          {option.label}
          {option.isTopOption && option.voteCount > 0 && (
            <Badge tone="brand" className="ml-2">
              Más apoyo
            </Badge>
          )}
        </p>
        {option.description && <p className="text-sm text-neutral-500">{option.description}</p>}
        <p className="text-xs text-neutral-400">
          {option.voteCount} voto{option.voteCount === 1 ? "" : "s"}
        </p>
      </div>
      <VoteButton isSelected={isMyVote} disabled={votingDisabled} onVote={onVote} />
    </div>
  );
}
