"use client";

import type { City, Day, TripData } from "@/lib/types";
import {
  cn,
  dayTotal,
  dollars,
  euros,
  weekdayShort,
} from "@/lib/utils";

interface Props {
  data: TripData;
  currentCityId: string;
  currentDay: number;
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
  onPick,
}: Props) {
  const entries: Entry[] = data.cities
    .flatMap((city) =>
      city.days.map((day, index) => ({ city, day, index })),
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
      <p className="text-[11px] tracking-wide text-ink-mute">
        {data.trip.subtitle}
      </p>

      <h2 className="mt-2 font-display text-[1.75rem] leading-[1.15] text-ink">
        El viaje completo
      </h2>

      <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">
        <span className="tnum">{totalDays}</span> días. Toca cualquiera para
        abrirlo en el mapa.
      </p>

      <ol className="mt-6 border-t border-rule">
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
            <li key={`${city.id}-${day.day}`} className="border-b border-rule">
              <button
                type="button"
                onClick={() => onPick(city.id, index)}
                aria-current={isCurrent ? "true" : undefined}
                className={cn(
                  "group flex w-full gap-4 px-2 py-3.5 text-left transition-colors",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                  isCurrent ? "bg-paper-dim" : "hover:bg-paper-dim/60",
                )}
              >
                {/* Fecha */}
                <div className="w-11 shrink-0 pt-0.5 text-center">
                  {isArrival ? (
                    <span
                      className="mx-auto block h-full w-px bg-rule"
                      aria-hidden
                    />
                  ) : (
                    <>
                      <span className="block text-[11px] capitalize text-ink-mute">
                        {weekdayShort(day.date).replace(".", "")}
                      </span>
                      <span className="block font-display text-xl leading-none text-ink tnum">
                        {day.day}
                      </span>
                    </>
                  )}
                </div>

                {/* Contenido */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: city.accent }}
                      aria-hidden
                    />
                    <span className="text-[11px] text-ink-mute">
                      {city.name}
                    </span>
                    {sharesDate ? (
                      <span className="text-[11px] text-ink-mute/70">
                        · {isArrival ? "llegada" : "salida"}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 text-[0.9375rem] font-medium leading-snug text-ink">
                    {day.label}
                  </p>

                  <p className="mt-1.5 truncate text-[13px] text-ink-mute">
                    {day.stops.map((s) => s.name).join(" · ")}
                  </p>
                </div>

                {/* Cifras */}
                <div className="shrink-0 pt-0.5 text-right">
                  <span className="block text-[0.9375rem] text-ink tnum">
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

      <dl className="mt-6 text-sm">
        <div className="flex items-baseline justify-between border-b border-rule py-3">
          <dt className="text-ink-soft">Visitas y transporte</dt>
          <dd className="text-right">
            <span className="tnum text-ink">{dollars(grandTotal)}</span>
            <span className="block text-xs text-ink-mute tnum">
              {euros(grandTotal)}
            </span>
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-b border-rule py-3">
          <dt className="text-ink-soft">Alojamiento</dt>
          <dd className="text-right">
            <span className="tnum text-ink">{dollars(stayTotal)}</span>
            <span className="block text-xs text-ink-mute tnum">
              {euros(stayTotal)}
            </span>
          </dd>
        </div>
        <div className="flex items-baseline justify-between py-3">
          <dt className="font-medium text-ink">Total por persona</dt>
          <dd className="text-right">
            <span className="font-display text-2xl leading-none text-ink tnum">
              {dollars(grandTotal + stayTotal)}
            </span>
            <span className="mt-1 block text-xs text-ink-mute tnum">
              {euros(grandTotal + stayTotal)}
            </span>
          </dd>
        </div>
      </dl>

      <p className="mt-2 text-[13px] leading-relaxed text-ink-mute">
        Los vuelos internacionales van aparte, ya emitidos.
      </p>
    </div>
  );
}
