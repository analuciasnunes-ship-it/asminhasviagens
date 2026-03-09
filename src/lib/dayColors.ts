const DAY_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // orange
  "#8b5cf6", // purple
  "#ef4444", // red
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // deep orange
  "#6366f1", // indigo
  "#14b8a6", // teal
];

export function getDayColor(dayNumber: number): string {
  return DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
}
