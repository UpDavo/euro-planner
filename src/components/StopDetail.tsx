"use client";

import { useEffect, useRef } from "react";
import type { City, Stop, Traveler, TripDocument } from "@/lib/types";
import {
  accentVars,
  cn,
  dollars,
  durationLabel,
  euros,
  stopMeta,
} from "@/lib/utils";
import DocumentLink from "./DocumentLink";
import Skeleton from "./Skeleton";
import PhotoHeader from "./PhotoHeader";
import TicketBadge from "./TicketBadge";

interface Props {
  stop: Stop;
  index: number;
  total: number;
  city: City;
  nextStop: Stop | null;
  travelers: Traveler[];
  /** Los documentos de `stop.documents`, ya resueltos. */
  documents: TripDocument[];
  /** Los billetes aún llegan del backend. */
  documentsLoading: boolean;
}

export default function StopDetail({
  stop,
  index,
  total,
  city,
  nextStop,
  travelers,
  documents,
  documentsLoading,
}: Props) {
  const docCount = documentsLoading ? (stop.documents?.length ?? 0) : documents.length;
  const meta = stopMeta[stop.type];
  const top = useRef<HTMLDivElement>(null);

  // Al pasar de parada el modal conserva el scroll: volver arriba.
  useEffect(() => {
    top.current?.closest("[data-modal-scroll]")?.scrollTo({ top: 0 });
  }, [stop.id]);

  return (
    <div ref={top} style={accentVars(city.accent)}>
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
        <TicketBadge required={stop.advanceTicket} className="px-3 py-1 text-[12px]" />
      </div>

      {stop.photo ? <PhotoHeader photo={stop.photo} alt={stop.name} /> : null}

      <h2 className="mt-4 font-display text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-ink">
        {stop.name}
      </h2>

      <p className="mt-3 font-display text-[2.5rem] font-semibold leading-none tracking-tight text-ink tnum">
        {stop.time}
        <span className="text-ink-mute"> — {stop.endTime}</span>
      </p>

      <dl className="mt-6 rounded-2xl bg-well px-4 text-sm">
        <div className="flex items-baseline justify-between border-b border-line py-3">
          <dt className="text-ink-soft">Precio por persona</dt>
          <dd className="text-right">
            <span className="tnum font-semibold text-accent-ink">
              {dollars(stop.price)}
            </span>
            {stop.price > 0 ? (
              <span className="block text-xs text-ink-mute tnum">
                {euros(stop.price)} por persona · los {travelers.length}:{" "}
                {dollars(stop.price * travelers.length)}
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
        {nextStop ? (
          <div
            className={cn(
              "flex items-baseline justify-between gap-6 py-3",
              stop.booking && "border-b border-line",
            )}
          >
            <dt className="text-ink-soft">
              {stop.walkToNext ? "Andando hasta" : "Después"}
            </dt>
            <dd className="text-right text-ink">
              {stop.walkToNext ? (
                <span className="tnum font-medium">{stop.walkToNext} min</span>
              ) : null}
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

      {stop.seats ? (
        <div className="mt-5">
          <h3 className="mb-2 text-[12px] font-medium uppercase tracking-wide text-ink-mute">
            Asientos
          </h3>
          <dl className="rounded-2xl bg-well px-4 text-sm">
            {travelers
              .filter((t) => stop.seats?.[t.id])
              .map((t) => (
                <div
                  key={t.id}
                  className="flex items-baseline justify-between border-b border-line py-2.5 last:border-b-0"
                >
                  <dt className="text-ink-soft">{t.name}</dt>
                  <dd className="font-medium text-ink tnum">{stop.seats?.[t.id]}</dd>
                </div>
              ))}
          </dl>
        </div>
      ) : null}

      {docCount > 0 ? (
        <div className="mt-5">
          <h3 className="mb-2 text-[12px] font-medium uppercase tracking-wide text-ink-mute">
            {docCount === 1 ? "Billete" : "Billetes"}
          </h3>
          <div className="grid gap-2" aria-busy={documentsLoading}>
            {documentsLoading
              ? stop.documents?.map((id) => <Skeleton key={id} className="h-[3.25rem]" />)
              : null}
            {documents.map((doc) => (
              <DocumentLink
                key={doc.id}
                doc={doc}
                label={
                  travelers.find((t) => t.id === doc.travelerId)?.name ??
                  doc.title
                }
              />
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-5 text-[0.9375rem] leading-relaxed text-ink-soft">
        {stop.note}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {stop.ticketUrl ? (
          <a
            href={stop.ticketUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-accent-deep px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <i className="ri-ticket-2-line text-base" aria-hidden />
            Comprar ticket
            <span className="text-white/60">
              · {new URL(stop.ticketUrl).hostname.replace(/^www\./, "")}
            </span>
          </a>
        ) : null}
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${stop.coords[0]},${stop.coords[1]}&travelmode=walking`}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
            stop.ticketUrl
              ? "bg-accent-soft text-accent-ink hover:opacity-80"
              : "bg-accent-deep text-white hover:opacity-85",
          )}
        >
          <i className="ri-navigation-line text-base" aria-hidden />
          Cómo llegar andando
        </a>
      </div>
    </div>
  );
}
