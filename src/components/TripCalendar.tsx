"use client";

import type { City, Day, TripData } from "@/lib/types";
import {
  accentVars,
  cn,
  dayTotal,
  dollars,
  euros,
  planDays,
  weekdayShort,
} from "@/lib/utils";

interface Props {
  data: TripData;
  currentCityId: string;
  currentDay: number;
  /** La ruta activa en cada ciudad que ofrece varias. */
  planIds: Record<string, string>;
  onPick: (cityId: string, dayIndex: number) => void;
}

interface Entry {
  city: City;
  day: Day;
  index: number;
}

export default function TripCalendar({
  data,
  currentCityId,
  currentDay,
  planIds,
  onPick,
}: Props) {
  const entries: Entry[] = data.cities
    .flatMap((city) =>
      planDays(city, planIds[city.id] ?? city.plans?.[0]?.id ?? null).map(
        (day, index) => ({ city, day, index }),
      ),
    )
    .sort((a, b) => a.day.date.localeCompare(b.day.date) || a.day.day - b.day.day);

  // El día del vuelo aparece dos veces, en la ciudad que se deja y en la que
  // se llega: son dos tramos de una misma fecha, no dos días de viaje.
  const totalDays = new Set(entries.map((e) => e.day.date)).size;

  const grandTotal = entries.reduce((sum, e) => sum + dayTotal(e.day), 0);
  const stayTotal = data.cities.reduce(
    (sum, c) => sum + c.stay.pricePerNight * c.stay.nights,
    0,
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 pr-10">
        {data.cities.map((c) => (
          <span
            key={c.id}
            className="inline-flex items-center gap-1.5 rounded-full bg-well px-2.5 py-1 text-[12px] font-medium text-ink-soft"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: c.accent }}
              aria-hidden
            />
            {c.name}
          </span>
        ))}
      </div>

      <h2 className="mt-4 font-display text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-ink">
        El viaje completo
      </h2>

      <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">
        <span className="tnum">{totalDays}</span> días. Toca cualquiera para
        abrirlo en el mapa.
      </p>

      <ol className="mt-6 space-y-1.5">
        {entries.map(({ city, day, index }, i) => {
          const isCurrent =
            city.id === currentCityId && day.day === currentDay;
          const total = dayTotal(day);
          const sharesDate =
            entries[i - 1]?.day.date === day.date ||
            entries[i + 1]?.day.date === day.date;
          // En una fecha partida, la segunda entrada es la ciudad de llegada.
          const isArrival = entries[i - 1]?.day.date === day.date;

          return (
            <li key={`${city.id}-${day.day}`} style={accentVars(city.accent)}>
              <button
                type="button"
                onClick={() => onPick(city.id, index)}
                aria-current={isCurrent ? "true" : undefined}
                className={cn(
                  "group flex w-full gap-4 rounded-2xl px-3 py-3 text-left transition-colors",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                  isCurrent ? "bg-accent-soft" : "hover:bg-well",
                )}
              >
                {/* Fecha */}
                <div className="flex w-11 shrink-0 flex-col items-center pt-0.5">
                  {isArrival ? (
                    <span className="h-full w-px bg-line" aria-hidden />
                  ) : (
                    <span
                      className={cn(
                        "flex h-11 w-11 flex-col items-center justify-center rounded-xl",
                        isCurrent
                          ? "bg-accent-deep text-white"
                          : "bg-well text-ink",
                      )}
                    >
                      <span
                        className={cn(
                          "block text-[10px] capitalize leading-none",
                          isCurrent ? "text-white/65" : "text-ink-mute",
                        )}
                      >
                        {weekdayShort(day.date).replace(".", "")}
                      </span>
                      <span className="mt-1 block font-display text-lg font-semibold leading-none tnum">
                        {day.day}
                      </span>
                    </span>
                  )}
                </div>

                {/* Contenido */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: city.accent }}
                      aria-hidden
                    />
                    <span className="text-[12px] font-medium text-accent-ink">
                      {city.name}
                    </span>
                    {sharesDate ? (
                      <span className="text-[12px] text-ink-mute">
                        · {isArrival ? "llegada" : "salida"}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 text-[0.9375rem] font-medium leading-snug text-ink">
                    {day.label}
                  </p>

                  <p className="mt-1 truncate text-[13px] text-ink-mute">
                    {day.stops.map((s) => s.name).join(" · ")}
                  </p>
                </div>

                {/* Cifras */}
                <div className="shrink-0 pt-0.5 text-right">
                  <span className="block font-display text-[1.0625rem] font-semibold text-ink tnum">
                    {dollars(total)}
                  </span>
                  <span className="block text-[11px] text-ink-mute tnum">
                    {day.stops.length}{" "}
                    {day.stops.length === 1 ? "parada" : "paradas"}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ol>

      <dl className="mt-6 rounded-card bg-ink px-6 py-6 text-white">
        <div className="flex items-baseline justify-between gap-6">
          <dt className="text-[13px] text-white/60">Total por persona</dt>
          <dd className="text-right">
            <span className="font-display text-[2.5rem] font-semibold leading-none tracking-tight tnum">
              {dollars(grandTotal + stayTotal)}
            </span>
            <span className="mt-1.5 block text-[13px] text-white/60 tnum">
              {euros(grandTotal + stayTotal)}
            </span>
          </dd>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 text-sm">
          <div>
            <dt className="text-[12px] text-white/60">Visitas y transporte</dt>
            <dd className="mt-1 font-display text-lg font-semibold tnum">
              {dollars(grandTotal)}
              <span className="ml-2 text-[12px] font-normal text-white/50">
                {euros(grandTotal)}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-[12px] text-white/60">Alojamiento</dt>
            <dd className="mt-1 font-display text-lg font-semibold tnum">
              {dollars(stayTotal)}
              <span className="ml-2 text-[12px] font-normal text-white/50">
                {euros(stayTotal)}
              </span>
            </dd>
          </div>
        </div>
      </dl>

      <p className="mt-3 text-[13px] leading-relaxed text-ink-mute">
        Los vuelos internacionales van aparte, ya emitidos.
      </p>
    </div>
  );
}
