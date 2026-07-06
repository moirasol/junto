import type { DecisionOutput } from "@/domain/decision";
import { joinWithY, normalizeText } from "@/lib/text";
import { getTrip } from "@/lib/storage";

// TODO (spec §8): integración real con claude-sonnet-4 sin definir. Esta
// capa es un mock determinístico: interpreta patrones de texto simples, no
// llama a ningún modelo. En una versión productiva se reemplazaría por una
// llamada real con salida estructurada validada.

// Spec 2.11
export type NaturalLanguageCommandInput = {
  tripId: string;
  userId: string;
  text: string;
  locale: "es-AR";
};

// Spec 3.7
export type AIActionType =
  | "suggest_reminder"
  | "summarize_decision"
  | "detect_blocked_decision"
  | "suggest_next_step"
  | "parse_expense"
  | "parse_transport_option"
  | "parse_date_option"
  | "vote_decision"
  | "generate_settlement";

export type AIAction = {
  type: AIActionType;
  confidence: number;
  requiresHumanConfirmation: boolean;
  payload: Record<string, unknown>;
};

export type AIActionOutput = {
  message: string;
  actions: AIAction[];
};

const LOW_CONFIDENCE_THRESHOLD = 0.8;

// Interpreta montos en formato es-AR: la coma es siempre el separador
// decimal; un punto sin coma se asume separador de miles cuando agrupa de a
// 3 dígitos (ej. "45.000"), si no se trata como decimal (ej. "45.5").
function parseAmount(raw: string): number {
  if (raw.includes(",")) {
    return Number(raw.replace(/\./g, "").replace(",", "."));
  }
  if (/^\d{1,3}(\.\d{3})+$/.test(raw)) {
    return Number(raw.replace(/\./g, ""));
  }
  return Number(raw);
}

// Spec 6.7 — rechazar comando vacío.
export function parseNaturalLanguageCommand(
  input: NaturalLanguageCommandInput
): AIActionOutput {
  const text = input.text?.trim();
  if (!text) {
    return {
      message: "Escribí algo para que Junto lo pueda interpretar.",
      actions: [],
    };
  }

  const actions: AIAction[] = [];

  // Gasto: "<Nombre> pagó/gastó/cargó <monto> de <descripción>[ para todos[ menos para <excluidos>]]"
  // \p{L} (con flag u) matea letras Unicode para reconocer nombres con
  // tildes/ñ; la descripción sólo excluye el punto para permitir comas
  // naturales ("de entrada al museo, para todos").
  const expenseMatch = text.match(
    /(\p{L}+)\s+(?:pag(?:ó|o)|gast(?:ó|é|e)|carg(?:ó|ué|ue))\s+([\d.,]+)\s+de\s+([^.]+?)(?:\s+para\s+todos)?(?:\s+menos\s+(?:para\s+)?([^.]+))?(?:\.|$)/iu
  );
  if (expenseMatch) {
    const [, payerName, amountRaw, description, excludedRaw] = expenseMatch;
    const excludedParticipantNames = excludedRaw
      ? excludedRaw.split(/,|\by\b/i).map((name) => name.trim()).filter(Boolean)
      : [];
    actions.push({
      type: "parse_expense",
      confidence: 0.92,
      requiresHumanConfirmation: true,
      payload: {
        payerName,
        amount: parseAmount(amountRaw!),
        currency: "ARS",
        description: description!.trim().replace(/,\s*$/, ""),
        excludedParticipantNames,
      },
    });
  }

  // Transporte: "<Nombre> tiene auto [disponible] con <n> lugares/asientos"
  const transportMatch = text.match(
    /(\p{L}+)\s+tiene\s+auto\s+(?:disponible\s+)?con\s+(\d+)\s+(?:lugares?|asientos?)/iu
  );
  if (transportMatch) {
    const [, ownerName, seatsRaw] = transportMatch;
    actions.push({
      type: "parse_transport_option",
      confidence: 0.88,
      requiresHumanConfirmation: true,
      payload: {
        ownerName,
        vehicleAvailable: true,
        seats: Number(seatsRaw),
      },
    });
  }

  // Voto: "voto por <opción>" — matchea contra las opciones reales de las
  // decisiones abiertas del viaje (no está en el spec original; se agrega
  // como mejora de la simulación, sigue sin llamar a ningún modelo real).
  const voteMatch = text.match(/vot(?:o|a|amos)\s+por\s+(.+?)(?:\.|$)/iu);
  if (voteMatch) {
    const trip = getTrip(input.tripId);
    const referenceText = normalizeText(voteMatch[1]!);

    const votableDecisions = (trip?.decisions ?? []).filter(
      (d) => d.status !== "confirmed" && d.status !== "needs_review"
    );

    let matchedOption: { decisionId: string; decisionType: string; optionId: string; label: string } | null = null;
    for (const decision of votableDecisions) {
      const option = decision.options.find((o) => {
        const normLabel = normalizeText(o.label);
        return referenceText.includes(normLabel) || normLabel.includes(referenceText);
      });
      if (option) {
        matchedOption = {
          decisionId: decision.id,
          decisionType: decision.type,
          optionId: option.id,
          label: option.label,
        };
        break;
      }
    }

    if (matchedOption) {
      actions.push({
        type: "vote_decision",
        confidence: 0.86,
        requiresHumanConfirmation: true,
        payload: matchedOption,
      });
    }
  }

  // Decisión pendiente: "falta elegir <tipo>"
  const pendingMatch = text.match(/falta\s+elegir\s+(fecha|alojamiento|transporte)/i);
  if (pendingMatch) {
    const typeMap: Record<string, string> = {
      fecha: "dates",
      alojamiento: "accommodation",
      transporte: "transport",
    };
    actions.push({
      type: "suggest_next_step",
      confidence: 0.94,
      requiresHumanConfirmation: true,
      payload: {
        decisionType: typeMap[pendingMatch[1]!.toLowerCase()],
      },
    });
  }

  // Fecha en texto libre: "puedo <n> días, del <x> a <y>"
  const dateMatch = text.match(/puedo\s+\d+\s+d[ií]as?,?\s+del\s+.+/i);
  if (dateMatch) {
    actions.push({
      type: "parse_date_option",
      confidence: 0.74,
      requiresHumanConfirmation: true,
      payload: {
        rawText: dateMatch[0],
      },
    });
  }

  if (actions.length === 0) {
    return {
      message: "No pude identificar ninguna acción en ese texto. Probá ser más específico.",
      actions: [],
    };
  }

  const lowConfidenceCount = actions.filter((a) => a.confidence < LOW_CONFIDENCE_THRESHOLD).length;
  const summary = `Detecté ${actions.length} posible${actions.length > 1 ? "s" : ""} acci${
    actions.length > 1 ? "ones" : "ón"
  }. Revisalas antes de confirmarlas${lowConfidenceCount > 0 ? " (alguna necesita más revisión)" : ""}.`;

  return { message: summary, actions };
}

// Spec 4.4.4 / 3.3 aiSummary — resumen determinístico de una decisión.
export function summarizeDecision(decision: DecisionOutput): string {
  const votedCount = decision.participation.votedParticipants;
  const totalCount = decision.participation.totalParticipants;

  if (decision.status === "confirmed") {
    const selected = decision.options.find((o) => o.id === decision.selectedOptionId);
    return selected ? `El grupo confirmó: ${selected.label}.` : "El grupo confirmó esta decisión.";
  }

  if (votedCount === 0) {
    return "Todavía nadie votó esta decisión.";
  }

  const top = decision.options.filter((o) => o.isTopOption && o.voteCount > 0);

  if (decision.status === "blocked" && top.length > 1) {
    const labels = joinWithY(top.map((o) => o.label));
    return `Hay empate entre ${labels}. El grupo tiene que destrabar la decisión.`;
  }

  if (top.length === 1) {
    const leader = top[0]!;
    return `La opción con más apoyo es ${leader.label} (${votedCount} de ${totalCount} votaron). El grupo todavía tiene que confirmarla.`;
  }

  return `Van ${votedCount} de ${totalCount} votos. El grupo todavía tiene que confirmar esta decisión.`;
}
