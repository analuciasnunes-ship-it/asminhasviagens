import { Activity } from "@/types/trip";

export function sortActivities(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => {
    // If both have orderIndex, use it as primary sort
    const aIdx = a.orderIndex;
    const bIdx = b.orderIndex;
    if (aIdx != null && bIdx != null) {
      return aIdx - bIdx;
    }

    // If only one has orderIndex, it takes priority
    if (aIdx != null && bIdx == null) return -1;
    if (aIdx == null && bIdx != null) return 1;

    // Neither has orderIndex: sort by time, untimed last
    const timeA = a.time || "";
    const timeB = b.time || "";
    if (timeA && timeB) return timeA.localeCompare(timeB);
    if (!timeA && !timeB) return 0;
    if (!timeA) return 1;
    return -1;
  });
}
