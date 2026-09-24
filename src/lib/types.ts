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

/**
 * Una versión alternativa de un día. Sustituye por completo al día del mismo
 * número en `City.days` cuando su plan está activo.
 */
export interface DayVariant extends Day {
  /** Por qué existe esta versión, en una línea. Se muestra sobre el día. */
  variantNote: string;
}

/**
 * Una forma entera de recorrer la ciudad. El plan por defecto es `City.days`;
 * cada plan adicional sólo declara los días que cambia.
 */
export interface Plan {
  id: string;
  name: string;
  tagline: string;
  description: string;
  /** Días que este plan reemplaza, indexados por `Day.day`. */
  days: DayVariant[];
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
  /** Rutas alternativas. El primero es siempre el plan por defecto. */
  plans?: Plan[];
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
