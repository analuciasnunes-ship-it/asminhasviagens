export interface Activity {
  id: string;
  title: string;
  time?: string;
  description?: string;
  cost?: number;
  link?: string;
  status: "planeado" | "visitado";
  photos?: string[];
  rating?: number;
  comments?: string;
}

export interface DayPlan {
  id: string;
  date: string;
  dayNumber: number;
  activities: Activity[];
}

export interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  days: DayPlan[];
}
