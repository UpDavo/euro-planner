"use client";

import type { City, Day, Stop } from "@/lib/types";
import { cn, dollars, durationLabel, euros, stopMeta } from "@/lib/utils";

interface Props {
  city: City;
  day: Day;
  activeStopId: string | null;
  onSelectStop: (stop: Stop) => void;
  onSelectStay: () => void;
}

export default function DayTimeline({
  city,
  day,
  activeStopId,
  onSelectStop,
  onSelectStay,
}: Props) {
  return (
    <ol className="relative rounded-card bg-card px-4 pb-3 pt-5 shadow-card sm:px-5">
      <li className="relative pb-7 pl-12">
        <span
          className="absolute left-[15px] top-9 bottom-0 w-px bg-line"
          aria-hidden
        />
        <span
          className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white"
          aria-hidden
        >
          <i className="ri-home-4-fill text-[15px]" />
        </span>
        <button
          type="button"
          onClick={onSelectStay}
          className="group block w-full rounded-xl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          <p className="text-[12px] text-ink-mute">Base · Airbnb</p>
          <p className="mt-0.5 text-[15px] font-medium text-ink group-hover:text-accent-ink">
            {city.stay.name}
          </p>
        </button>
      </li>

      {day.stops.map((stop, i) => {
        const isActive = stop.id === activeStopId;
        const meta = stopMeta[stop.type];
        const isLast = i === day.stops.length - 1;

        return (
          <li key={stop.id} className="relative pl-12">
            {!isLast && (
              <span
                className="absolute left-[15px] top-9 bottom-0 w-px bg-line"
                aria-hidden
              />
            )}

            <span
              className={cn(
                "absolute left-0 top-1.5 flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold tnum transition-colors",
                isActive
                  ? "bg-accent-solid text-white"
                  : "bg-accent-soft text-accent-ink",
              )}
              aria-hidden
            >
              {i + 1}
            </span>

            <button
              type="button"
              onClick={() => onSelectStop(stop)}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "group -ml-3 block w-[calc(100%+0.75rem)] rounded-2xl px-3 py-3 text-left transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                isActive ? "bg-accent-soft" : "hover:bg-well",
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="font-display text-[1.375rem] font-semibold leading-none tracking-tight text-ink tnum">
                  {stop.time}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-well px-2 py-0.5 text-[11px] font-medium text-ink-soft">
                  <i className={cn(meta.icon, "text-[12px]")} aria-hidden />
                  {meta.label}
                </span>
              </div>

              <p className="mt-2 text-[1rem] font-medium leading-snug text-ink">
                {stop.name}
              </p>

              <p className="mt-1 text-[13px] text-ink-mute tnum">
                {durationLabel(stop.duration)} · {dollars(stop.price)}
                {stop.price > 0 ? (
                  <span className="text-ink-mute/70"> · {euros(stop.price)}</span>
                ) : null}
              </p>
            </button>

            {stop.walkToNext !== null && !isLast ? (
              <p className="flex items-center py-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-well px-2.5 py-1 text-[12px] font-medium text-ink-soft">
                  <i className="ri-footprint-line text-[13px]" aria-hidden />
                  <span className="tnum">{stop.walkToNext} min andando</span>
                </span>
              </p>
            ) : (
              <div className="pb-3" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
