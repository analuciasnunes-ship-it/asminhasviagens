import { useState, useEffect } from "react";
import { Trip } from "@/types/trip";

const STORAGE_KEY = "travelbook_trips";

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  }, [trips]);

  const addTrip = (trip: Trip) => setTrips((prev) => [...prev, trip]);

  const updateTrip = (updated: Trip) =>
    setTrips((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));

  const deleteTrip = (id: string) =>
    setTrips((prev) => prev.filter((t) => t.id !== id));

  const getTrip = (id: string) => trips.find((t) => t.id === id);

  return { trips, addTrip, updateTrip, deleteTrip, getTrip };
}
