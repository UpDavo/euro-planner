export type StopType =
  | "stay"
  | "sight"
  | "museum"
  | "food"
  | "walk"
  | "transport";

export interface Stop {
  id: string;
  time: string;
  endTime: string;
  name: string;
  type: StopType;
  coords: [number, number];
  price: number;
  duration: number;
  walkToNext: number | null;
  note: string;
  booking?: string;
}

export interface Day {
  day: number;
  date: string;
  label: string;
  summary: string;
  stops: Stop[];
}

export interface Stay {
  name: string;
  address: string;
  coords: [number, number];
  checkIn: string;
  checkOut: string;
  pricePerNight: number;
  nights: number;
  notes: string;
  host: string;
  /** Enlace a la reserva. Solo en los alojamientos ya reservados. */
  url?: string;
}

export interface City {
  id: string;
  name: string;
  country: string;
  accent: string;
  center: [number, number];
  zoom: number;
  arrival: string;
  departure: string;
  stay: Stay;
  days: Day[];
}

export interface Trip {
  title: string;
  subtitle: string;
  startDate: string;
  endDate: string;
  currency: string;
}

export interface TripData {
  trip: Trip;
  cities: City[];
}
