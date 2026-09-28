import { clsx, type ClassValue } from "clsx";
import type { CSSProperties } from "react";
import { twMerge } from "tailwind-merge";
import type { City, Currency, Day, Plan, Stay, Stop, StopType } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Los días de la ciudad con el plan aplicado encima: cada día que el plan
 * reemplaza sustituye al original y el resto se mantiene. Sin plan activo, o
 * en una ciudad sin planes, devuelve los días tal cual.
 */
export function planDays(city: City, planId: string | null): Day[] {
  if (!planId) return city.days;
  const plan = city.plans?.find((p) => p.id === planId);
  if (!plan) return city.days;
  return city.days.map(
    (day) => plan.days.find((d) => d.day === day.day) ?? day,
  );
}

/** La nota de una variante, si el día activo viene de un plan. */
export function variantNote(day: Day): string | null {
  return "variantNote" in day ? (day as { variantNote: string }).variantNote : null;
}

/** Lo que cuesta la ciudad entera con un plan puesto, sin contar el hospedaje. */
export function planTotal(city: City, plan: Plan | null): number {
  return planDays(city, plan?.id ?? null).reduce(
    (sum, day) => sum + dayTotal(day),
    0,
  );
}

// Tasa EUR→USD. Actualízala antes de viajar: los precios del JSON están en euros,
// que es lo que verás en taquilla.
export const EUR_TO_USD = 1.08;

export function usd(eur: number) {
  return Math.round(eur * EUR_TO_USD);
}

/** Cifra principal en dólares. */
export function dollars(n: number) {
  return n === 0 ? "Gratis" : `$${usd(n)}`;
}

/** Pasa un importe a dólares, venga en la moneda que venga. */
export function toUsd(amount: number, currency: Currency) {
  return currency === "USD" ? amount : amount * EUR_TO_USD;
}

/** Pasa un importe a euros, venga en la moneda que venga. */
export function toEur(amount: number, currency: Currency) {
  return currency === "EUR" ? amount : amount / EUR_TO_USD;
}

/**
 * Un importe con céntimos en su propia moneda, para lo que se paga y se
 * reparte: "$194,55" o "15,90 €".
 */
export function money(amount: number, currency: Currency) {
  // es-EC agrupa ya desde los miles (1.203,75); es-ES esperaría a 10.000.
  const n = (Math.round(amount * 100) / 100).toLocaleString("es-EC", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency === "USD" ? `$${n}` : `${n} €`;
}

/**
 * Lo que cuesta un alojamiento, en su moneda: el total, por noche, y la parte
 * de los viajeros cuando se comparte con más gente.
 */
export function stayCost(stay: Stay, travelers: number) {
  const guests = stay.guests ?? travelers;
  const perPerson = stay.totalPrice / guests;
  const share = perPerson * travelers;
  return {
    total: stay.totalPrice,
    perNight: stay.totalPrice / stay.nights,
    guests,
    perPerson,
    /** Lo que pagan los viajeros entre todos. */
    share,
    perPersonPerNight: perPerson / stay.nights,
  };
}

/** Referencia en euros, para acompañar a la cifra en dólares. */
export function euros(n: number) {
  if (n === 0) return "Gratis";
  // Los billetes de tren traen céntimos (15,90 €); sumarlos arrastra decimales
  // de coma flotante, así que se redondea al céntimo y se escribe en español.
  const cents = Math.round(n * 100);
  return `${(cents / 100).toLocaleString("es-ES", {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })} €`;
}

export function dayTotal(day: Day) {
  return day.stops.reduce((sum, s) => sum + s.price, 0);
}

export function dayWalking(day: Day) {
  return day.stops.reduce((sum, s) => sum + (s.walkToNext ?? 0), 0);
}

export function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function weekdayShort(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-ES", {
    weekday: "short",
  });
}

export function dayNumber(iso: string) {
  return new Date(`${iso}T12:00:00`).getDate();
}

export function shortDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Qué se hace entre una parada y la siguiente. Las paradas de transporte
 * llevan las coordenadas de destino, así que el tramo a pie que sale de ellas
 * es "al bajar", y el que llega a ellas es para ir a subir. Sin caminata real
 * (0 min: el taxi deja en la puerta) no hay nada que mostrar.
 */
export function walkLabel(stop: Stop, next: Stop | null): string | null {
  if (!next || !stop.walkToNext) return null;
  const min = `${stop.walkToNext} min andando`;
  const from = stop.type === "transport";
  const to = next.type === "transport";
  if (from && to) return `Transbordo · ${min}`;
  if (from) return `Al bajar · ${min}`;
  if (to) return `${min} hasta el transporte`;
  return `${min}`;
}

export function durationLabel(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export const stopMeta: Record<StopType, { label: string; icon: string }> = {
  stay: { label: "Hospedaje", icon: "ri-home-4-line" },
  sight: { label: "Visita", icon: "ri-ancient-gate-line" },
  museum: { label: "Museo", icon: "ri-artboard-line" },
  food: { label: "Comida", icon: "ri-restaurant-line" },
  walk: { label: "Paseo", icon: "ri-footprint-line" },
  transport: { label: "Traslado", icon: "ri-train-line" },
};

export interface TicketGroup {
  stop: Stop;
  /** Posición de la parada en el día, empezando en 0. */
  index: number;
  /** Paradas que entran con el mismo billete que `stop`. */
  included: { stop: Stop; index: number }[];
}

/**
 * Las paradas del día con ticket previo, una por entrada: las cubiertas por el
 * billete de otra (el Foro con el del Coliseo) cuelgan de ella en vez de salir
 * sueltas. Si la parada que las cubre no está en el día, salen solas.
 */
export function ticketGroups(stops: Stop[]): TicketGroup[] {
  const groups: TicketGroup[] = [];
  const byId = new Map<string, TicketGroup>();
  stops.forEach((stop, index) => {
    if (!stop.advanceTicket || stop.includedIn) return;
    const group = { stop, index, included: [] };
    groups.push(group);
    byId.set(stop.id, group);
  });
  stops.forEach((stop, index) => {
    if (!stop.advanceTicket || !stop.includedIn) return;
    const parent = byId.get(stop.includedIn);
    if (parent) parent.included.push({ stop, index });
    else groups.push({ stop, index, included: [] });
  });
  return groups.sort((a, b) => a.index - b.index);
}

export function stopIndexLabel(stops: Stop[], id: string) {
  return stops.findIndex((s) => s.id === id) + 1;
}

/**
 * Las cinco caras del acento de una ciudad. El color crudo sólo se usa donde
 * no hay texto encima (puntos, líneas); `solid` es el fondo para texto blanco
 * (el dorado de Roma se queda en 3,4:1 con el blanco si no se oscurece);
 * `ink` es la versión para texto sobre blanco; `soft` es la tinta al ~10 %
 * para chips y notas; `deep` es el acento hundido en negro para las tarjetas
 * oscuras.
 */
export function accentPalette(accent: string) {
  return {
    accent,
    solid: `color-mix(in oklab, ${accent} 82%, #14171a)`,
    ink: `color-mix(in oklab, ${accent} 66%, #14171a)`,
    soft: `color-mix(in oklab, ${accent} 11%, #ffffff)`,
    deep: `color-mix(in oklab, ${accent} 28%, #111416)`,
  };
}

/** Las variables CSS que alimentan `bg-accent`, `text-accent-ink`, etc. */
export function accentVars(accent: string): CSSProperties {
  const p = accentPalette(accent);
  return {
    "--accent": p.accent,
    "--accent-solid": p.solid,
    "--accent-ink": p.ink,
    "--accent-soft": p.soft,
    "--accent-deep": p.deep,
  } as CSSProperties;
}
