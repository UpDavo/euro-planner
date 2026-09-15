import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Day, Stop, StopType } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

/** Referencia en euros, para acompañar a la cifra en dólares. */
export function euros(n: number) {
  return n === 0 ? "Gratis" : `${n} €`;
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

export function stopIndexLabel(stops: Stop[], id: string) {
  return stops.findIndex((s) => s.id === id) + 1;
}
