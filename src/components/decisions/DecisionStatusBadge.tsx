import type { DecisionStatus } from "@/domain/decision";
import { Badge } from "@/components/ui/Primitives";

const LABEL: Record<DecisionStatus, string> = {
  open: "Abierta",
  blocked: "Empatada",
  ready_to_confirm: "Lista para confirmar",
  confirmed: "Confirmada",
  needs_review: "Necesita revisión",
};

const TONE: Record<DecisionStatus, "neutral" | "brand" | "warning" | "danger" | "success"> = {
  open: "neutral",
  blocked: "danger",
  ready_to_confirm: "brand",
  confirmed: "success",
  needs_review: "warning",
};

export function DecisionStatusBadge({ status }: { status: DecisionStatus }) {
  return <Badge tone={TONE[status]}>{LABEL[status]}</Badge>;
}
