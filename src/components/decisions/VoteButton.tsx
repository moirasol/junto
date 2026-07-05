import { Button } from "@/components/ui/Primitives";

export function VoteButton({
  isSelected,
  disabled,
  onVote,
}: {
  isSelected: boolean;
  disabled: boolean;
  onVote: () => void;
}) {
  return (
    <Button variant={isSelected ? "primary" : "secondary"} disabled={disabled} onClick={onVote}>
      {isSelected ? "Tu voto" : "Votar"}
    </Button>
  );
}
