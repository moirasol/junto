"use client";

import { useEffect, useState, useCallback } from "react";
import type { TripOutput } from "@/domain/trip";
import { getTrip, listTrips, subscribe } from "./storage";

export function useTripsList(): TripOutput[] {
  const [trips, setTrips] = useState<TripOutput[]>([]);

  const refresh = useCallback(() => setTrips(listTrips()), []);

  useEffect(() => {
    refresh();
    return subscribe(refresh);
  }, [refresh]);

  return trips;
}

export function useTrip(tripId: string): TripOutput | undefined {
  const [trip, setTrip] = useState<TripOutput | undefined>(undefined);

  const refresh = useCallback(() => setTrip(getTrip(tripId)), [tripId]);

  useEffect(() => {
    refresh();
    return subscribe(refresh);
  }, [refresh]);

  return trip;
}
