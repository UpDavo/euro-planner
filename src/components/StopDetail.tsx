"use client";

import type { City, Stop } from "@/lib/types";
import {
  accentVars,
  cn,
  dollars,
  durationLabel,
  euros,
  stopMeta,
} from "@/lib/utils";

interface Props {
  stop: Stop;
  index: number;
  total: number;
  city: City;
  nextStop: Stop | null;
}

export default function StopDetail({
  stop,
  index,
  total,
  city,
  nextStop,
}: Props) {
  const meta = stopMeta[stop.type];

  return (
    <div style={accentVars(city.accent)}>
      <div className="flex flex-wrap items-center gap-2 pr-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft py-1 pl-1 pr-3 text-[12px] font-medium text-accent-ink">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-solid text-white"
            aria-hidden
          >
            <i className={cn(meta.icon, "text-[13px]")} />
          </span>
          {meta.label}
        </span>
        <span className="rounded-full bg-well px-3 py-1 text-[12px] font-medium text-ink-soft tnum">
          Parada {index} de {total}
        </span>
      </div>

      <h2 className="mt-4 font-display text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-ink">
        {stop.name}
      </h2>

      <p className="mt-3 font-display text-[2.5rem] font-semibold leading-none tracking-tight text-ink tnum">
        {stop.time}
        <span className="text-ink-mute"> — {stop.endTime}</span>
      </p>

      <dl className="mt-6 rounded-2xl bg-well px-4 text-sm">
        <div className="flex items-baseline justify-between border-b border-line py-3">
          <dt className="text-ink-soft">Precio aprox.</dt>
          <dd className="text-right">
            <span className="tnum font-semibold text-accent-ink">
              {dollars(stop.price)}
            </span>
            {stop.price > 0 ? (
              <span className="block text-xs text-ink-mute tnum">
                {euros(stop.price)}
              </span>
            ) : null}
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-b border-line py-3">
          <dt className="text-ink-soft">Tiempo allí</dt>
          <dd className="tnum font-medium text-ink">
            {durationLabel(stop.duration)}
          </dd>
        </div>
        {stop.walkToNext !== null && nextStop ? (
          <div
            className={cn(
              "flex items-baseline justify-between gap-6 py-3",
              stop.booking && "border-b border-line",
            )}
          >
            <dt className="text-ink-soft">Andando hasta</dt>
            <dd className="text-right text-ink">
              <span className="tnum font-medium">{stop.walkToNext} min</span>
              <span className="block text-xs text-ink-mute">
                {nextStop.name}
              </span>
            </dd>
          </div>
        ) : (
          <div
            className={cn(
              "flex items-baseline justify-between py-3",
              stop.booking && "border-b border-line",
            )}
          >
            <dt className="text-ink-soft">Después</dt>
            <dd className="font-medium text-ink">Fin del día</dd>
          </div>
        )}
        {stop.booking ? (
          <div className="flex items-baseline justify-between gap-6 py-3">
            <dt className="text-ink-soft">Reserva</dt>
            <dd className="text-right font-medium text-ink">{stop.booking}</dd>
          </div>
        ) : null}
      </dl>

      <p className="mt-5 text-[0.9375rem] leading-relaxed text-ink-soft">
        {stop.note}
      </p>

      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${stop.coords[0]},${stop.coords[1]}&travelmode=walking`}
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent-deep px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <i className="ri-navigation-line text-base" aria-hidden />
        Cómo llegar andando
      </a>
    </div>
  );
}
