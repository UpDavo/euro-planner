import { clsx, type ClassValue } from "clsx";
import type { CSSProperties } from "react";
import { twMerge } from "tailwind-merge";
import type { City, Day, Plan, Stop, StopType } from "./types";

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
