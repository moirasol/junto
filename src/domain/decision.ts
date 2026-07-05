// Spec 7.4
export type DecisionStatus =
  | "open"
  | "blocked"
  | "ready_to_confirm"
  | "confirmed"
  | "needs_review";

export type DecisionType = "dates" | "accommodation" | "transport";

// Spec 2.4
export type DecisionOptionInput = {
  label: string;
  description?: string;
  metadata?: Record<string, unknown>;
};

export type CreateDecisionInput = {
  tripId: string;
  createdByUserId: string;
  type: DecisionType;
  description?: string;
  options: DecisionOptionInput[];
  minimumParticipation?: number;
};

// Spec 7.8 — algoritmo de mayoría simple.
export function hasSimpleMajority(optionVoteCount: number, totalValidVotes: number): boolean {
  if (totalValidVotes === 0) return false;
  return optionVoteCount > totalValidVotes / 2;
}

// Spec 2.5 — no existe campo title: el título visible se deriva del type.
export function getDecisionDisplayTitle(type: DecisionType): string {
  const labels: Record<DecisionType, string> = {
    dates: "Elegir fechas",
    accommodation: "Elegir alojamiento",
    transport: "Elegir transporte",
  };

  return labels[type];
}

// Spec 2.5
export type VoteInput = {
  tripId: string;
  decisionId: string;
  participantId: string;
  optionId: string;
};

// Spec 2.6
export type ConfirmDecisionInput = {
  tripId: string;
  decisionId: string;
  confirmedByUserId: string;
  selectedOptionId: string;
  explicitConfirmation: true;
};

// Spec 3.3
export type DecisionOptionOutput = {
  id: string;
  label: string;
  description?: string;
  metadata?: Record<string, unknown>;
  voteCount: number;
  isTopOption: boolean;
};

export type VoteOutput = {
  participantId: string;
  optionId: string;
};

export type DecisionOutput = {
  id: string;
  tripId: string;
  type: DecisionType;
  displayTitle: string;
  description?: string;
  status: DecisionStatus;
  options: DecisionOptionOutput[];
  votes: VoteOutput[];
  selectedOptionId?: string | null;
  minimumParticipation?: number;
  participation: {
    totalParticipants: number;
    votedParticipants: number;
    missingParticipantIds: string[];
    participationRate: number;
  };
  aiSummary?: string;
  createdAt: string;
  updatedAt: string;
};
