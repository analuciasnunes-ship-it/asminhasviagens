import { Activity } from "@/types/trip";

export function sortActivities(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => {
    const timeA = a.time || "";
    const timeB = b.time || "";
    // Activities without time go to the end
    if (!timeA && !timeB) return 0;
    if (!timeA) return 1;
    if (!timeB) return -1;
    return timeA.localeCompare(timeB);
  });
}
