import { Activity } from "@/types/trip";

export function sortActivities(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => {
    const timeA = a.time || "";
    const timeB = b.time || "";

    // Both have time → sort by time
    if (timeA && timeB) return timeA.localeCompare(timeB);

    // Both have no time → sort by orderIndex
    if (!timeA && !timeB) {
      return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
    }

    // One has time, one doesn't → timed first
    if (!timeA) return 1;
    return -1;
  });
}
