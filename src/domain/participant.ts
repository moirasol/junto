// Spec 3.2
export type ParticipantStatus = "invited" | "accepted" | "rejected" | "left";

export type ParticipantOutput = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: ParticipantStatus;
  joinedAt?: string;
  leftAt?: string;
};

// Spec 2.2
export type InviteParticipantsInput = {
  tripId: string;
  invitedByUserId: string;
  participants: Array<{
    name: string;
    email?: string;
    phone?: string;
  }>;
};

// Spec 2.3
export type AcceptInvitationInput = {
  tripId: string;
  participantId: string;
  response: "accepted" | "rejected";
};
