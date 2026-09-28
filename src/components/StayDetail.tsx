"use client";

import type { City } from "@/lib/types";
import {
  accentVars,
  euros,
  formatDate,
  money,
  stayCost,
  toEur,
} from "@/lib/utils";
import PhotoHeader from "./PhotoHeader";

export default function StayDetail({
  city,
  travelers,
}: {
  city: City;
  /** Cuántos viajan: su parte cuando el alojamiento se comparte. */
  travelers: number;
}) {
  const { stay } = city;
  const cost = stayCost(stay, travelers);
  const shared = cost.guests > travelers;
  const cur = stay.currency;
  const isHome = stay.kind === "home";

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
          {isHome ? "Casa familiar" : "Hospedaje"} en {city.name}
        </span>
      </div>

      {stay.photo ? <PhotoHeader photo={stay.photo} alt={stay.address} /> : null}

      <h2 className="mt-4 font-display text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-ink">
        {stay.name}
      </h2>

      <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">
        {stay.address}
      </p>

      {isHome ? (
        <div className="mt-6 rounded-2xl bg-accent-deep px-5 py-5 text-white">
          <p className="text-[12px] text-white/60">
            <span className="tnum">{stay.nights}</span>{" "}
            {stay.nights === 1 ? "noche" : "noches"} en casa de familia
          </p>
          <p className="mt-1.5 font-display text-[2.25rem] font-semibold leading-none tracking-tight">
            Sin coste
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl bg-accent-deep px-5 py-5 text-white">
          <p className="text-[12px] text-white/60">
            Total <span className="tnum">{stay.nights}</span>{" "}
            {stay.nights === 1 ? "noche" : "noches"}
            {shared ? ` · entre ${cost.guests} personas` : ""}
          </p>
          <p className="mt-1.5 font-display text-[2.25rem] font-semibold leading-none tracking-tight tnum">
            {money(cost.total, cur)}
          </p>
          <p className="mt-2 text-[13px] text-white/60 tnum">
            {cur === "USD" ? `≈ ${euros(toEur(cost.total, cur))} · ` : ""}
            {money(cost.perNight, cur)} por noche
          </p>
          {shared ? (
            <p className="mt-3 border-t border-white/15 pt-3 text-[13px] text-white/80 tnum">
              La parte de los {travelers}:{" "}
              <span className="font-semibold text-white">
                {money(cost.share, cur)}
              </span>{" "}
              · {money(cost.perPerson, cur)} cada uno
            </p>
          ) : null}
        </div>
      )}

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
        {isHome ? null : (
          <div className="flex items-baseline justify-between border-b border-line py-3">
            <dt className="text-ink-soft">Por persona y noche</dt>
            <dd className="text-right">
              <span className="tnum font-medium text-ink">
                {money(cost.perPersonPerNight, cur)}
              </span>
              <span className="block text-xs text-ink-mute tnum">
                {money(cost.perPerson, cur)} las {stay.nights}{" "}
                {stay.nights === 1 ? "noche" : "noches"}
              </span>
            </dd>
          </div>
        )}
        <div className="flex items-baseline justify-between py-3">
          <dt className="text-ink-soft">{isHome ? "Les recibe" : "Anfitrión"}</dt>
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
            <i className="ri-home-heart-line text-base" aria-hidden />
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
