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
  title?: string;
  activities: Activity[];
}

export interface Flight {
  id: string;
  origin: string;
  destination: string;
  date: string;
  airline?: string;
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
