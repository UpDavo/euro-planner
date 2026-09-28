/** Los precios del itinerario van en euros; lo pagado desde Ecuador, en dólares. */
export type Currency = "EUR" | "USD";

export type StopType =
  | "stay"
  | "sight"
  | "museum"
  | "food"
  | "walk"
  | "transport";

/** Foto de Wikimedia Commons. `page` es la ficha del archivo, con su licencia. */
export interface Photo {
  src: string;
  page: string;
  credit: string;
}

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
  photo?: Photo;
  /** Hay que comprar la entrada o el billete antes de llegar. */
  advanceTicket: boolean;
  /** Id de la parada del mismo día cuya entrada o billete ya cubre esta. */
  includedIn?: string;
  /** Ids de `TripData.documents` que hay que llevar en esta parada. */
  documents?: string[];
  /** Plaza de cada viajero, por id de viajero ("coche 9 · asiento 30"). */
  seats?: Record<string, string>;
  /** Web oficial donde se compra. Falta si ya está comprado (vuelos). */
  ticketUrl?: string;
}

export interface Day {
  day: number;
  date: string;
  label: string;
  summary: string;
  stops: Stop[];
}

export interface Stay {
  /** Airbnb reservado o casa de familia, que no se paga. Por defecto, airbnb. */
  kind?: "airbnb" | "home";
  name: string;
  address: string;
  coords: [number, number];
  checkIn: string;
  checkOut: string;
  /** Lo que costó el alojamiento entero, en `currency`, tal como se pagó. */
  totalPrice: number;
  currency: Currency;
  nights: number;
  /**
   * Personas que se reparten el precio, contando a los viajeros. Falta cuando
   * sólo lo pagan ellos (Barcelona se comparte con la familia de Alejandra).
   */
  guests?: number;
  notes: string;
  host: string;
  /** Enlace a la reserva. Solo en los alojamientos ya reservados. */
  url?: string;
  photo?: Photo;
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

export interface Traveler {
  id: string;
  name: string;
}

/**
 * Un billete o reserva, en PDF o captura. Llegan del backend (`/api/private/`)
 * y no del JSON: el repositorio del frontend es público.
 */
export interface TripDocument {
  id: string;
  title: string;
  kind: "flight" | "train";
  /** URL completa para abrirlo, con la clave del viaje ya puesta. */
  file: string;
  format: "pdf" | "image";
  /** Una línea con lo que cubre, para reconocerlo sin abrirlo. */
  detail: string;
  /** De quién es. Sin viajero, es un documento conjunto de los tres. */
  travelerId?: string;
}

/** Un gasto del viaje que se reparte a partes iguales entre algunos viajeros. */
export interface Expense {
  id: string;
  concept: string;
  amount: number;
  currency: Currency;
  /** Id del viajero que lo pagó. `null` mientras no se sepa: no cuenta en el saldo. */
  paidBy: string | null;
  /** Ids de los viajeros que se lo reparten. */
  splitAmong: string[];
  /** Día del gasto, `YYYY-MM-DD`. */
  date: string;
  note?: string;
}

/** Una transferencia entre viajeros para saldar lo que uno le debe al otro. */
export interface Payment {
  id: string;
  from: string;
  to: string;
  /** En dólares, como las cuentas. */
  amount: number;
  /** `YYYY-MM-DD`. */
  date: string;
}

export interface TripData {
  trip: Trip;
  travelers: Traveler[];
  documents: TripDocument[];
  /** Gastos de partida. Los que se anotan en la app se guardan aparte. */
  expenses: Expense[];
  cities: City[];
}
