import type { ParticipantOutput } from "./participant";
import type { DecisionOutput } from "./decision";
import type { ExpenseOutput } from "./expense";
import type { SettlementOutput } from "./settlement";

// Spec 7.3
export type TripStatus =
  | "draft"
  | "planning"
  | "ready"
  | "in_progress"
  | "finished"
  | "closed"
  | "deleted";

// Spec 2.1
export type CreateTripInput = {
  name: string;
  destination: string;
  createdByUserId: string;
  participants: Array<{
    name: string;
    email?: string;
    phone?: string;
  }>;
};

// Spec 3.1
export type TripOutput = {
  id: string;
  name: string;
  destination: string;
  status: TripStatus;
  createdByUserId: string;
  participants: ParticipantOutput[];
  decisions: DecisionOutput[];
  expenses: ExpenseOutput[];
  settlement?: SettlementOutput;
  createdAt: string;
  updatedAt: string;
};
