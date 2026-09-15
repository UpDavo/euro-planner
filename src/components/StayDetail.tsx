"use client";

import type { City } from "@/lib/types";
import { dollars, euros, formatDate } from "@/lib/utils";

export default function StayDetail({ city }: { city: City }) {
  const { stay } = city;
  const total = stay.pricePerNight * stay.nights;

  return (
    <div>
      <p className="text-[11px] tracking-wide text-ink-mute">
        Hospedaje en {city.name}
      </p>

      <h2 className="mt-2 font-display text-[1.75rem] leading-[1.15] text-ink">
        {stay.name}
      </h2>

      <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">
        {stay.address}
      </p>

      <dl className="mt-6 border-t border-rule text-sm">
        <div className="flex items-baseline justify-between border-b border-rule py-3">
          <dt className="text-ink-soft">Entrada</dt>
          <dd className="text-right text-ink">
            {formatDate(stay.checkIn.slice(0, 10))}
            <span className="tnum text-ink-mute">
              {" "}
              · {stay.checkIn.slice(11)}
            </span>
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-b border-rule py-3">
          <dt className="text-ink-soft">Salida</dt>
          <dd className="text-right text-ink">
            {formatDate(stay.checkOut.slice(0, 10))}
            <span className="tnum text-ink-mute">
              {" "}
              · {stay.checkOut.slice(11)}
            </span>
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-b border-rule py-3">
          <dt className="text-ink-soft">Por noche</dt>
          <dd className="text-right">
            <span className="tnum text-ink">{dollars(stay.pricePerNight)}</span>
            <span className="block text-xs text-ink-mute tnum">
              {euros(stay.pricePerNight)}
            </span>
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-b border-rule py-3">
          <dt className="text-ink-soft">
            Total <span className="tnum">{stay.nights}</span>{" "}
            {stay.nights === 1 ? "noche" : "noches"}
          </dt>
          <dd className="text-right">
            <span className="tnum font-medium text-ink">{dollars(total)}</span>
            <span className="block text-xs text-ink-mute tnum">
              {euros(total)}
            </span>
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-b border-rule py-3">
          <dt className="text-ink-soft">Anfitrión</dt>
          <dd className="text-ink">{stay.host}</dd>
        </div>
      </dl>

      <p className="mt-5 text-[0.9375rem] leading-relaxed text-ink-soft">
        {stay.notes}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        {stay.url ? (
          <a
            href={stay.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-sm px-4 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            style={{ background: city.accent }}
          >
            Ver en Airbnb
          </a>
        ) : null}
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${stay.coords[0]},${stay.coords[1]}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 border-b pb-0.5 text-sm font-medium transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          style={{ color: city.accent, borderColor: city.accent }}
        >
          <i className="ri-map-pin-line text-base" aria-hidden />
          Ver ubicación
        </a>
      </div>
    </div>
  );
}
