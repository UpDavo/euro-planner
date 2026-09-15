"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Stop, TripData } from "@/lib/types";
import {
  cn,
  dayTotal,
  dayWalking,
  dayNumber,
  dollars,
  durationLabel,
  euros,
  formatDate,
  shortDate,
  weekdayShort,
} from "@/lib/utils";
import DayTimeline from "./DayTimeline";
import ResponsiveModal from "./ResponsiveModal";
import StayDetail from "./StayDetail";
import StopDetail from "./StopDetail";
import TripCalendar from "./TripCalendar";

const TripMap = dynamic(() => import("./TripMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-paper-dim text-sm text-ink-mute">
      Cargando mapa…
    </div>
  ),
});

type Sheet =
  | { kind: "stop"; stop: Stop }
  | { kind: "stay" }
  | { kind: "calendar" }
  | null;

export default function TripPlanner({ data }: { data: TripData }) {
  const [cityId, setCityId] = useState(data.cities[0].id);
  const [dayIndex, setDayIndex] = useState(0);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [mapOpenMobile, setMapOpenMobile] = useState(false);

  const city = useMemo(
    () => data.cities.find((c) => c.id === cityId) ?? data.cities[0],
    [data.cities, cityId],
  );
  const day = city.days[Math.min(dayIndex, city.days.length - 1)];

  const activeStopId = sheet?.kind === "stop" ? sheet.stop.id : null;
  const stopIndex =
    sheet?.kind === "stop"
      ? day.stops.findIndex((s) => s.id === sheet.stop.id)
      : -1;
  const nextStop = stopIndex >= 0 ? (day.stops[stopIndex + 1] ?? null) : null;

  function selectCity(id: string) {
    setCityId(id);
    setDayIndex(0);
    setSheet(null);
  }

  function pickFromCalendar(id: string, i: number) {
    setCityId(id);
    setDayIndex(i);
    setSheet(null);
  }

  function selectDay(i: number) {
    setDayIndex(i);
    setSheet(null);
  }

  // El viaje dura tantos días como el mayor número de día del itinerario.
  const tripDays = useMemo(
    () =>
      Math.max(...data.cities.flatMap((c) => c.days.map((d) => d.day))),
    [data.cities],
  );

  // Los días de una ciudad pueden no ser consecutivos: el viernes y el sábado
  // se pasan en Barcelona, así que Madrid salta del día 1 al 4.
  const gapNote = useMemo(() => {
    const other = data.cities.find(
      (c) => c.id !== city.id && c.days.some((d) => d.day === day.day + 1),
    );
    const isLastOfCity = day.day === city.days[city.days.length - 1].day;
    if (!other || isLastOfCity) return null;
    const nextHere = city.days.find((d) => d.day > day.day);
    if (!nextHere || nextHere.day === day.day + 1) return null;
    return `Los días ${day.day + 1} y ${nextHere.day - 1} se pasan en ${other.name}. Aquí se retoma el día ${nextHere.day}.`;
  }, [data.cities, city, day]);

  const total = dayTotal(day);
  const walking = dayWalking(day);

  return (
    <div className="min-h-dvh">
      {/* Cabecera: el viaje entero en una línea */}
      <header className="border-b border-rule bg-paper">
        <div className="mx-auto flex max-w-[42rem] flex-wrap items-baseline gap-x-6 gap-y-3 px-5 py-6 sm:px-8 lg:max-w-[110rem] lg:px-8">
          <h1 className="font-display text-2xl leading-none text-ink">
            {data.trip.title}
          </h1>
          <p className="text-sm text-ink-mute tnum">
            {shortDate(data.trip.startDate)} – {shortDate(data.trip.endDate)}
          </p>
          <nav className="ml-auto flex gap-1" aria-label="Ciudades">
            {data.cities.map((c) => {
              const selected = c.id === city.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectCity(c.id)}
                  aria-pressed={selected}
                  className={cn(
                    "rounded-sm px-3 py-1.5 text-sm transition-colors",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                    selected
                      ? "font-medium text-ink"
                      : "text-ink-mute hover:text-ink",
                  )}
                  style={
                    selected
                      ? { boxShadow: `inset 0 -2px 0 ${c.accent}` }
                      : undefined
                  }
                >
                  {c.name}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="mx-auto flex max-w-[110rem] flex-col lg:h-[calc(100dvh-4.5rem)] lg:flex-row">
        {/* Columna del itinerario */}
        <section className="flex min-w-0 flex-1 flex-col lg:max-w-[34rem] lg:border-r lg:border-rule">
          {/* Selector de día */}
          <div className="sticky top-0 z-20 border-b border-rule bg-paper/95 backdrop-blur-sm">
            <div
              className="mx-auto flex w-full max-w-[42rem] gap-1.5 px-5 py-4 sm:px-8 lg:max-w-none lg:px-8"
              role="tablist"
              aria-label={`Días en ${city.name}`}
            >
              {city.days.map((d, i) => {
                const selected = i === dayIndex;
                return (
                  <button
                    key={d.day}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => selectDay(i)}
                    className={cn(
                      "min-w-0 flex-1 rounded-sm border px-2 py-2.5 text-center transition-colors",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                      selected
                        ? "border-ink bg-ink text-paper"
                        : "border-rule text-ink-soft hover:border-ink-mute",
                    )}
                  >
                    <span className="block text-[11px] capitalize opacity-70">
                      {weekdayShort(d.date).replace(".", "")}
                    </span>
                    <span className="block font-display text-lg leading-none tnum">
                      {dayNumber(d.date)}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setSheet({ kind: "calendar" })}
                className="flex shrink-0 items-center justify-center rounded-sm border border-rule px-3 text-ink-mute transition-colors hover:border-ink-mute hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                aria-label="Ver el viaje completo"
                title="Ver el viaje completo"
              >
                <i className="ri-calendar-2-line text-lg" aria-hidden />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[42rem] px-5 pb-14 sm:px-8 lg:max-w-none lg:px-8 lg:pb-20">
            <div className="pb-8 pt-9">
              {gapNote ? (
                <p className="mb-5 border-l-2 border-rule pl-3 text-[13px] leading-relaxed text-ink-mute">
                  {gapNote}
                </p>
              ) : null}
              <p className="text-sm text-ink-mute first-letter:uppercase">
                {formatDate(day.date)}
                <span className="text-ink-mute/70">
                  {" "}
                  · día <span className="tnum">{day.day}</span> de{" "}
                  <span className="tnum">{tripDays}</span>
                </span>
              </p>
              <h2 className="mt-2 font-display text-[2.125rem] leading-[1.1] text-ink sm:text-[2.5rem]">
                {day.label}
              </h2>
              <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-ink-soft">
                {day.summary}
              </p>

              <dl className="mt-8 grid grid-cols-3 border-y border-rule">
                {[
                  {
                    label: "Gasto del día",
                    value: dollars(total),
                    sub: total > 0 ? euros(total) : null,
                  },
                  {
                    label: "A pie",
                    value: durationLabel(walking),
                    sub: null,
                  },
                  {
                    label: "Paradas",
                    value: String(day.stops.length),
                    sub: null,
                  },
                ].map((item, i) => (
                  <div
                    key={item.label}
                    className={cn(
                      "py-4",
                      i > 0 && "border-l border-rule pl-4 sm:pl-5",
                    )}
                  >
                    <dt className="pr-3 text-[13px] text-ink-mute">
                      {item.label}
                    </dt>
                    <dd className="mt-1.5 pr-3 font-display text-2xl leading-none text-ink tnum">
                      {item.value}
                    </dd>
                    {item.sub ? (
                      <p className="mt-1 pr-3 text-xs text-ink-mute tnum">
                        {item.sub}
                      </p>
                    ) : null}
                  </div>
                ))}
              </dl>
            </div>

            {/* Mapa en móvil: plegado por defecto para no empujar el itinerario */}
            <div className="mb-6 lg:hidden">
              <button
                type="button"
                onClick={() => setMapOpenMobile((v) => !v)}
                aria-expanded={mapOpenMobile}
                className="flex w-full items-center justify-between border border-rule px-4 py-3 text-sm text-ink transition-colors hover:bg-paper-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <span>
                  {mapOpenMobile ? "Ocultar mapa" : "Ver el día en el mapa"}
                </span>
                <i
                  className={cn(
                    "text-base transition-transform",
                    mapOpenMobile ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line",
                  )}
                  aria-hidden
                />
              </button>
              {mapOpenMobile ? (
                <div className="mt-3 h-[60vh] border border-rule">
                  <TripMap
                    city={city}
                    day={day}
                    activeStopId={activeStopId}
                    onSelectStop={(stop) => setSheet({ kind: "stop", stop })}
                    onSelectStay={() => setSheet({ kind: "stay" })}
                  />
                </div>
              ) : null}
            </div>

            <DayTimeline
              city={city}
              day={day}
              activeStopId={activeStopId}
              onSelectStop={(stop) => setSheet({ kind: "stop", stop })}
              onSelectStay={() => setSheet({ kind: "stay" })}
            />
            </div>
          </div>
        </section>

        {/* Mapa fijo en escritorio */}
        <section className="hidden flex-1 lg:block" aria-label="Mapa del día">
          <TripMap
            city={city}
            day={day}
            activeStopId={activeStopId}
            onSelectStop={(stop) => setSheet({ kind: "stop", stop })}
            onSelectStay={() => setSheet({ kind: "stay" })}
          />
        </section>
      </div>

      <ResponsiveModal
        open={sheet !== null}
        onOpenChange={(open) => !open && setSheet(null)}
        wide={sheet?.kind === "calendar"}
        title={
          sheet?.kind === "stop"
            ? sheet.stop.name
            : sheet?.kind === "stay"
              ? city.stay.name
              : sheet?.kind === "calendar"
                ? "El viaje completo"
                : ""
        }
      >
        {sheet?.kind === "stop" ? (
          <StopDetail
            stop={sheet.stop}
            index={stopIndex + 1}
            total={day.stops.length}
            city={city}
            nextStop={nextStop}
          />
        ) : sheet?.kind === "stay" ? (
          <StayDetail city={city} />
        ) : sheet?.kind === "calendar" ? (
          <TripCalendar
            data={data}
            currentCityId={city.id}
            currentDay={day.day}
            onPick={pickFromCalendar}
          />
        ) : null}
      </ResponsiveModal>
    </div>
  );
}
