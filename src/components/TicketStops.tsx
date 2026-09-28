"use client";

import { useState } from "react";
import type { Day, Stop } from "@/lib/types";
import { cn, dollars, durationLabel, euros, ticketGroups } from "@/lib/utils";

interface Props {
  day: Day;
  /** Cuántos viajan: las entradas se compran para todos. */
  people: number;
  activeStopId: string | null;
  onSelectStop: (stop: Stop) => void;
}

/**
 * El día reducido a lo que pide ticket previo, con cada entrada y lo que cubre.
 * Sin `ticketUrl` la parada ya está comprada (vuelos, trenes).
 */
export default function TicketStops({
  day,
  people,
  activeStopId,
  onSelectStop,
}: Props) {
  const groups = ticketGroups(day.stops);
  const total = groups.reduce((sum, g) => sum + g.stop.price, 0);
  // Grupos desplegados. Plegados de entrada: lo que cubre cada billete se
  // mira a demanda.
  const [open, setOpen] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (groups.length === 0) {
    return (
      <p className="rounded-card bg-card px-5 py-6 text-center text-sm text-ink-mute shadow-card">
        Hoy no hace falta ticket previo.
      </p>
    );
  }

  return (
    <div className="rounded-card bg-card px-4 pb-3 pt-3 shadow-card sm:px-5">
      <ol>
        {groups.map(({ stop, index, included }) => {
          const isActive = stop.id === activeStopId;
          return (
            <li key={stop.id} className="border-b border-line py-2 last:border-b-0">
              <button
                type="button"
                onClick={() => onSelectStop(stop)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "group -mx-3 flex w-[calc(100%+1.5rem)] items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                  isActive ? "bg-accent-soft" : "hover:bg-well",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold tnum",
                    isActive
                      ? "bg-accent-solid text-white"
                      : "bg-accent-soft text-accent-ink",
                  )}
                  aria-hidden
                >
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] text-ink-mute tnum">
                      {stop.time}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                        stop.ticketUrl
                          ? "bg-accent-solid text-white"
                          : "bg-well text-ink-soft",
                      )}
                    >
                      <i
                        className={cn(
                          stop.ticketUrl ? "ri-ticket-2-line" : "ri-check-line",
                          "text-[12px]",
                        )}
                        aria-hidden
                      />
                      {stop.ticketUrl ? "Por comprar" : "Comprado"}
                    </span>
                  </span>
                  <span className="mt-1 block text-[1rem] font-medium leading-snug text-ink">
                    {stop.name}
                  </span>
                </span>
                {/* Los vuelos van a cero: se pagaron fuera del itinerario. */}
                {stop.price > 0 ? (
                  <span className="shrink-0 text-right">
                    <span className="block font-semibold text-accent-ink tnum">
                      {dollars(stop.price)}
                    </span>
                    <span className="block text-xs text-ink-mute tnum">
                      {euros(stop.price)} · ×{people}
                    </span>
                  </span>
                ) : null}
              </button>

              {included.length > 0 ? (
                <div className="mb-1 ml-11">
                  <button
                    type="button"
                    onClick={() => toggle(stop.id)}
                    aria-expanded={open.has(stop.id)}
                    aria-controls={`incluye-${stop.id}`}
                    className="flex w-full items-center gap-2 rounded-xl py-1.5 text-left text-[12px] font-medium text-ink-soft transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    <i className="ri-stack-line text-[13px] text-ink-mute" aria-hidden />
                    Incluye {included.length}{" "}
                    {included.length === 1 ? "parada más" : "paradas más"}
                    <i
                      className={cn(
                        "ri-arrow-down-s-line ml-auto text-base text-ink-mute transition-transform",
                        open.has(stop.id) && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </button>
                  {open.has(stop.id) ? (
                    <ul
                      id={`incluye-${stop.id}`}
                      className="mt-1 overflow-hidden rounded-2xl bg-well"
                    >
                      {included.map(({ stop: sub, index: subIndex }) => {
                        const subActive = sub.id === activeStopId;
                        return (
                          <li key={sub.id} className="border-b border-line last:border-b-0">
                            <button
                              type="button"
                              onClick={() => onSelectStop(sub)}
                              aria-current={subActive ? "true" : undefined}
                              className={cn(
                                "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                                "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink",
                                subActive ? "bg-accent-soft" : "hover:bg-card",
                              )}
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-card text-[11px] font-bold text-accent-ink tnum">
                                {subIndex + 1}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-[12px] text-ink-mute tnum">
                                  {sub.time} · {durationLabel(sub.duration)}
                                </span>
                                <span className="block text-[14px] font-medium leading-snug text-ink">
                                  {sub.name}
                                </span>
                              </span>
                              <span className="shrink-0 text-[12px] text-ink-mute">
                                Incluido
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      <p className="flex items-baseline justify-between border-t border-line pt-3 text-sm">
        <span className="text-ink-soft">
          Entradas del día · los {people}
        </span>
        <span className="tnum">
          <span className="font-semibold text-accent-ink">
            {dollars(total * people)}
          </span>
          {total > 0 ? (
            <span className="text-ink-mute"> · {euros(total * people)}</span>
          ) : null}
        </span>
      </p>
    </div>
  );
}
