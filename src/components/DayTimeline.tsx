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
    <ol className="relative">
      <li className="relative pb-9 pl-14">
        <span
          className="absolute left-[13px] top-9 bottom-0 w-px"
          style={{ background: "var(--color-rule)" }}
          aria-hidden
        />
        <span
          className="absolute left-0 top-0.5 flex h-7 w-7 items-center justify-center rounded-sm bg-ink text-paper"
          aria-hidden
        >
          <i className="ri-home-4-fill text-sm" />
        </span>
        <button
          type="button"
          onClick={onSelectStay}
          className="group block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          <p className="text-[13px] text-ink-mute">Base · Airbnb</p>
          <p className="mt-1 text-base font-medium text-ink underline decoration-rule underline-offset-[5px] group-hover:decoration-ink">
            {city.stay.name}
          </p>
        </button>
      </li>

      {day.stops.map((stop, i) => {
        const isActive = stop.id === activeStopId;
        const meta = stopMeta[stop.type];
        const isLast = i === day.stops.length - 1;

        return (
          <li key={stop.id} className="relative pl-14">
            {!isLast && (
              <span
                className="absolute left-[13px] top-9 bottom-0 w-px bg-rule"
                aria-hidden
              />
            )}

            <span
              className={cn(
                "absolute left-0 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold tnum transition-colors",
              )}
              style={{
                borderColor: city.accent,
                background: isActive ? city.accent : "var(--color-paper)",
                color: isActive ? "var(--color-paper)" : "var(--color-ink)",
              }}
              aria-hidden
            >
              {i + 1}
            </span>

            <button
              type="button"
              onClick={() => onSelectStop(stop)}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "group -ml-4 block w-[calc(100%+1rem)] rounded-sm px-4 py-3 text-left transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                isActive ? "bg-paper-dim" : "hover:bg-paper-dim/60",
              )}
            >
              <div className="flex items-baseline gap-3">
                <span className="font-display text-[1.625rem] leading-none text-ink tnum">
                  {stop.time}
                </span>
                <span className="text-[13px] text-ink-mute">{meta.label}</span>
              </div>

              <p className="mt-2.5 text-[1.0625rem] font-medium leading-snug text-ink">
                {stop.name}
              </p>

              <p className="mt-1.5 text-sm text-ink-mute tnum">
                {durationLabel(stop.duration)} · {dollars(stop.price)}
                {stop.price > 0 ? (
                  <span className="text-ink-mute/70"> · {euros(stop.price)}</span>
                ) : null}
              </p>
            </button>

            {stop.walkToNext !== null && !isLast ? (
              <p className="flex items-center gap-2.5 py-4 pl-4 text-sm text-ink-mute">
                <i className="ri-arrow-down-line text-base" aria-hidden />
                <span className="tnum">{stop.walkToNext} min andando</span>
              </p>
            ) : (
              <div className="pb-4" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
