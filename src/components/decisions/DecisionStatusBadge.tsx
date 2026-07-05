import { CircleDot, CircleAlert, CircleCheck, CircleHelp, Scale } from "lucide-react";
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

const ICON: Record<DecisionStatus, typeof CircleDot> = {
  open: CircleDot,
  blocked: Scale,
  ready_to_confirm: CircleHelp,
  confirmed: CircleCheck,
  needs_review: CircleAlert,
};

export function DecisionStatusBadge({ status }: { status: DecisionStatus }) {
  const Icon = ICON[status];
  return (
    <Badge tone={TONE[status]} className="gap-1">
      <Icon size={12} /> {LABEL[status]}
    </Badge>
  );
}
