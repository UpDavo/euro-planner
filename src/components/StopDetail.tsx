"use client";

import type { City, Stop } from "@/lib/types";
import { dollars, durationLabel, euros, stopMeta } from "@/lib/utils";

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
    <div>
      <p className="text-[11px] tracking-wide text-ink-mute tnum">
        Parada {index} de {total} · {meta.label}
      </p>

      <h2 className="mt-2 font-display text-[1.75rem] leading-[1.15] text-ink">
        {stop.name}
      </h2>

      <p className="mt-4 font-display text-4xl leading-none text-ink tnum">
        {stop.time}
        <span className="text-ink-mute"> — {stop.endTime}</span>
      </p>

      <dl className="mt-6 border-t border-rule text-sm">
        <div className="flex items-baseline justify-between border-b border-rule py-3">
          <dt className="text-ink-soft">Precio aprox.</dt>
          <dd className="text-right">
            <span className="tnum font-medium text-ink">
              {dollars(stop.price)}
            </span>
            {stop.price > 0 ? (
              <span className="block text-xs text-ink-mute tnum">
                {euros(stop.price)}
              </span>
            ) : null}
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-b border-rule py-3">
          <dt className="text-ink-soft">Tiempo allí</dt>
          <dd className="tnum text-ink">{durationLabel(stop.duration)}</dd>
        </div>
        {stop.walkToNext !== null && nextStop ? (
          <div className="flex items-baseline justify-between gap-6 border-b border-rule py-3">
            <dt className="text-ink-soft">Andando hasta</dt>
            <dd className="text-right text-ink">
              <span className="tnum font-medium">{stop.walkToNext} min</span>
              <span className="block text-xs text-ink-mute">
                {nextStop.name}
              </span>
            </dd>
          </div>
        ) : (
          <div className="flex items-baseline justify-between border-b border-rule py-3">
            <dt className="text-ink-soft">Después</dt>
            <dd className="text-ink">Fin del día</dd>
          </div>
        )}
        {stop.booking ? (
          <div className="flex items-baseline justify-between gap-6 border-b border-rule py-3">
            <dt className="text-ink-soft">Reserva</dt>
            <dd className="text-right text-ink">{stop.booking}</dd>
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
        className="mt-6 inline-flex items-center gap-2 border-b pb-0.5 text-sm font-medium transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        style={{ color: city.accent, borderColor: city.accent }}
      >
        <i className="ri-navigation-line text-base" aria-hidden />
        Cómo llegar andando
      </a>
    </div>
  );
}
