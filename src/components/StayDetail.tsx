"use client";

import type { City } from "@/lib/types";
import { accentVars, dollars, euros, formatDate } from "@/lib/utils";
import PhotoHeader from "./PhotoHeader";

export default function StayDetail({ city }: { city: City }) {
  const { stay } = city;
  const total = stay.pricePerNight * stay.nights;

  return (
    <div style={accentVars(city.accent)}>
      <div className="flex flex-wrap items-center gap-2 pr-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft py-1 pl-1 pr-3 text-[12px] font-medium text-accent-ink">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-solid text-white"
            aria-hidden
          >
            <i className="ri-home-4-fill text-[13px]" />
          </span>
          Hospedaje en {city.name}
        </span>
      </div>

      {stay.photo ? <PhotoHeader photo={stay.photo} alt={stay.address} /> : null}

      <h2 className="mt-4 font-display text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-ink">
        {stay.name}
      </h2>

      <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">
        {stay.address}
      </p>

      <div className="mt-6 rounded-2xl bg-accent-deep px-5 py-5 text-white">
        <p className="text-[12px] text-white/60">
          Total <span className="tnum">{stay.nights}</span>{" "}
          {stay.nights === 1 ? "noche" : "noches"}
        </p>
        <p className="mt-1.5 font-display text-[2.25rem] font-semibold leading-none tracking-tight tnum">
          {dollars(total)}
        </p>
        <p className="mt-2 text-[13px] text-white/60 tnum">
          {euros(total)} · {dollars(stay.pricePerNight)} por noche
        </p>
      </div>

      <dl className="mt-3 rounded-2xl bg-well px-4 text-sm">
        <div className="flex items-baseline justify-between border-b border-line py-3">
          <dt className="text-ink-soft">Entrada</dt>
          <dd className="text-right font-medium text-ink">
            {formatDate(stay.checkIn.slice(0, 10))}
            <span className="tnum font-normal text-ink-mute">
              {" "}
              · {stay.checkIn.slice(11)}
            </span>
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-b border-line py-3">
          <dt className="text-ink-soft">Salida</dt>
          <dd className="text-right font-medium text-ink">
            {formatDate(stay.checkOut.slice(0, 10))}
            <span className="tnum font-normal text-ink-mute">
              {" "}
              · {stay.checkOut.slice(11)}
            </span>
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-b border-line py-3">
          <dt className="text-ink-soft">Por noche</dt>
          <dd className="text-right">
            <span className="tnum font-medium text-ink">
              {dollars(stay.pricePerNight)}
            </span>
            <span className="block text-xs text-ink-mute tnum">
              {euros(stay.pricePerNight)}
            </span>
          </dd>
        </div>
        <div className="flex items-baseline justify-between py-3">
          <dt className="text-ink-soft">Anfitrión</dt>
          <dd className="font-medium text-ink">{stay.host}</dd>
        </div>
      </dl>

      <p className="mt-5 text-[0.9375rem] leading-relaxed text-ink-soft">
        {stay.notes}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {stay.url ? (
          <a
            href={stay.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-accent-deep px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Ver en Airbnb
          </a>
        ) : null}
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${stay.coords[0]},${stay.coords[1]}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-5 py-2.5 text-sm font-medium text-accent-ink transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <i className="ri-map-pin-line text-base" aria-hidden />
          Ver ubicación
        </a>
      </div>
    </div>
  );
}
