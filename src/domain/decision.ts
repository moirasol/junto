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
  title: string;
  description?: string;
  options: DecisionOptionInput[];
  minimumParticipation?: number;
};

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
  title: string;
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
