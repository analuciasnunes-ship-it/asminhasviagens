export const DURATION_OPTIONS = [
  { label: "Paragem rápida", minutes: 10 },
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "1 h", minutes: 60 },
  { label: "1 h 30", minutes: 90 },
  { label: "2 h", minutes: 120 },
  { label: "3 h", minutes: 180 },
  { label: "4 h", minutes: 240 },
  { label: "5 h", minutes: 300 },
  { label: "+ de 5 h", minutes: 360 },
] as const;

export type DurationLabel = typeof DURATION_OPTIONS[number]["label"];

export interface Activity {
  id: string;
  title: string;
  time?: string;
  timeLocked?: boolean;
  estimatedDuration?: DurationLabel;
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
  title?: string;
  activities: Activity[];
  flights?: Flight[];
  accommodations?: Accommodation[];
  rentalCars?: RentalCar[];
}

export interface Flight {
  id: string;
  type: "roundtrip" | "oneway";
  origin: string;
  destination: string;
  flightNumber?: string;
  departureTime?: string;
  arrivalTime?: string;
  returnDepartureTime?: string;
  returnArrivalTime?: string;
  price?: number;
}

export interface Accommodation {
  id: string;
  placeName: string;
  address?: string;
  checkIn: string;
  checkOut: string;
  price?: number;
}

export interface RentalCar {
  id: string;
  company: string;
  pickupDate: string;
  dropoffDate: string;
  price?: number;
}

export interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  flights: Flight[];
  accommodations: Accommodation[];
  rentalCars: RentalCar[];
  days: DayPlan[];
}
