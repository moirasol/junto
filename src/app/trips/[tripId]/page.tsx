"use client";

import { useParams } from "next/navigation";
import { useTrip } from "@/lib/hooks";
import { ParticipantsList } from "@/components/participants/ParticipantsList";
import { NextActionPanel } from "@/components/trips/NextActionPanel";
import { AICommandInput } from "@/components/ai/AICommandInput";

export default function TripPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const trip = useTrip(tripId);

  if (!trip) return null;

  return (
    <div className="space-y-4">
      <ParticipantsList trip={trip} />
      <NextActionPanel trip={trip} />
      <AICommandInput trip={trip} />
    </div>
  );
}
