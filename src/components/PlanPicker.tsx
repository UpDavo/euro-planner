"use client";

import type { City } from "@/lib/types";
import {
  accentVars,
  cn,
  dayTotal,
  dollars,
  euros,
  planDays,
  shortDate,
} from "@/lib/utils";

interface Props {
  city: City;
  planId: string;
  onPick: (planId: string) => void;
}

export default function PlanPicker({ city, planId, onPick }: Props) {
  const plans = city.plans ?? [];

  return (
    <div style={accentVars(city.accent)}>
      <div className="flex flex-wrap items-center gap-2 pr-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-medium text-accent-ink">
          <span
            className="h-2 w-2 rounded-full bg-accent"
            aria-hidden
          />
          {city.name}
        </span>
      </div>

      <h2 className="mt-4 font-display text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-ink">
        Rutas alternativas
      </h2>

      <p className="mt-2 max-w-[52ch] text-[0.9375rem] leading-relaxed text-ink-soft">
        Tres formas de recorrer los mismos días. Cambiar de ruta reescribe el
        itinerario entero de {city.name}: el resto del viaje no se toca.
      </p>

      <ul className="mt-6 space-y-3">
        {plans.map((plan) => {
          const selected = plan.id === planId;
          const days = planDays(city, plan.id);
          const total = days.reduce((sum, day) => sum + dayTotal(day), 0);
          const changed = new Set(plan.days.map((d) => d.day));

          return (
            <li key={plan.id}>
              <button
                type="button"
                onClick={() => onPick(plan.id)}
                aria-pressed={selected}
                className={cn(
                  "w-full rounded-card px-5 py-5 text-left transition-colors",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                  selected
                    ? "bg-accent-deep text-white"
                    : "bg-well text-ink hover:bg-line/60",
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="font-display text-xl font-semibold leading-none tracking-tight">
                    {plan.name}
                  </span>
                  {selected ? (
                    <span className="ml-auto shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white">
                      En uso
                    </span>
                  ) : (
                    <span className="ml-auto shrink-0 rounded-full bg-card px-2.5 py-1 text-[11px] font-medium text-ink-soft tnum">
                      {dollars(total)}
                    </span>
                  )}
                </div>

                <p
                  className={cn(
                    "mt-1 text-[13px]",
                    selected ? "text-white/60" : "text-ink-mute",
                  )}
                >
                  {plan.tagline}
                </p>

                <p
                  className={cn(
                    "mt-3 max-w-[56ch] text-[0.875rem] leading-relaxed",
                    selected ? "text-white/80" : "text-ink-soft",
                  )}
                >
                  {plan.description}
                </p>

                <dl
                  className={cn(
                    "mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t pt-3 text-[12px]",
                    selected ? "border-white/10" : "border-line",
                  )}
                >
                  <div className="flex gap-1.5">
                    <dt className={selected ? "text-white/60" : "text-ink-mute"}>
                      Gasto
                    </dt>
                    <dd className="font-medium tnum">
                      {dollars(total)}
                      <span
                        className={cn(
                          "font-normal",
                          selected ? "text-white/60" : "text-ink-mute",
                        )}
                      >
                        {" "}
                        · {euros(total)}
                      </span>
                    </dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className={selected ? "text-white/60" : "text-ink-mute"}>
                      Paradas
                    </dt>
                    <dd className="font-medium tnum">
                      {days.reduce((sum, day) => sum + day.stops.length, 0)}
                    </dd>
                  </div>
                </dl>

                {/* Qué días cambian respecto a la ruta de referencia */}
                <ol className="mt-3 space-y-1">
                  {days.map((day) => (
                    <li
                      key={day.day}
                      className="flex gap-2 text-[12px] leading-relaxed"
                    >
                      <span
                        className={cn(
                          "w-14 shrink-0 tnum",
                          selected ? "text-white/60" : "text-ink-mute",
                        )}
                      >
                        {shortDate(day.date)}
                      </span>
                      <span
                        className={
                          changed.has(day.day)
                            ? selected
                              ? "text-white"
                              : "text-ink"
                            : selected
                              ? "text-white/60"
                              : "text-ink-mute"
                        }
                      >
                        {day.label}
                        {changed.has(day.day) ? (
                          <span
                            className={cn(
                              "ml-1.5 rounded-full px-1.5 py-px text-[10px] font-medium",
                              selected
                                ? "bg-white/15 text-white"
                                : "bg-accent-soft text-accent-ink",
                            )}
                          >
                            cambia
                          </span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ol>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
