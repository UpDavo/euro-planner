"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Stop, TripData } from "@/lib/types";
import {
  accentVars,
  cn,
  dayTotal,
  dayWalking,
  dayNumber,
  dollars,
  durationLabel,
  euros,
  planDays,
  shortDate,
  variantNote,
  weekdayShort,
} from "@/lib/utils";
import DayTimeline from "./DayTimeline";
import TicketStops from "./TicketStops";
import ExpensesSheet from "./ExpensesSheet";
import TripDocuments from "./TripDocuments";
import { usePrivateData, withPrivateData } from "@/lib/private";
import PlanPicker from "./PlanPicker";
import ResponsiveModal from "./ResponsiveModal";
import StayDetail from "./StayDetail";
import StopDetail from "./StopDetail";
import TripCalendar from "./TripCalendar";

const TripMap = dynamic(() => import("./TripMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-well text-sm text-ink-mute">
      Cargando mapa…
    </div>
  ),
});

type Sheet =
  | { kind: "stop"; stop: Stop }
  | { kind: "stay" }
  | { kind: "calendar" }
  | { kind: "plans" }
  | { kind: "docs" }
  | { kind: "expenses" }
  | null;

export default function TripPlanner({ data: trip }: { data: TripData }) {
  // Billetes, localizadores y direcciones llegan del backend: el JSON es público.
  const { data: priv, loading: privLoading } = usePrivateData();
  const data = useMemo(() => withPrivateData(trip, priv), [trip, priv]);
  const [cityId, setCityId] = useState(data.cities[0].id);
  const [dayIndex, setDayIndex] = useState(0);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [mapOpenMobile, setMapOpenMobile] = useState(false);
  // Ver el día entero o sólo lo que pide ticket previo. Se mantiene al cambiar de día.
  const [ticketsOnly, setTicketsOnly] = useState(false);
  // La ruta elegida en cada ciudad que ofrece varias. Se recuerda al ir y
  // volver entre ciudades.
  const [planIds, setPlanIds] = useState<Record<string, string>>({});

  const city = useMemo(
    () => data.cities.find((c) => c.id === cityId) ?? data.cities[0],
    [data.cities, cityId],
  );

  const planId = planIds[city.id] ?? city.plans?.[0]?.id ?? null;
  const plan = city.plans?.find((p) => p.id === planId) ?? null;

  const days = useMemo(() => planDays(city, planId), [city, planId]);
  const day = days[Math.min(dayIndex, days.length - 1)];
  const note = variantNote(day);

  const activeStopId = sheet?.kind === "stop" ? sheet.stop.id : null;
  const stopIndex =
    sheet?.kind === "stop"
      ? day.stops.findIndex((s) => s.id === sheet.stop.id)
      : -1;
  const nextStop = stopIndex >= 0 ? (day.stops[stopIndex + 1] ?? null) : null;
  const prevStop = stopIndex > 0 ? day.stops[stopIndex - 1] : null;

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

  function selectPlan(id: string) {
    setPlanIds((prev) => ({ ...prev, [city.id]: id }));
    setSheet(null);
  }

  const hasPlans = (city.plans?.length ?? 0) > 1;

  // Los días de una ciudad pueden no ser consecutivos: el viernes y el sábado
  // se pasan en Barcelona, así que Madrid salta del día 1 al 8.
  const gapNote = useMemo(() => {
    const other = data.cities.find(
      (c) => c.id !== city.id && c.days.some((d) => d.day === day.day + 1),
    );
    const isLastOfCity = day.day === days[days.length - 1].day;
    if (!other || isLastOfCity) return null;
    const nextHere = days.find((d) => d.day > day.day);
    if (!nextHere || nextHere.day === day.day + 1) return null;
    if (!other.days.some((d) => d.day === nextHere.day - 1))
      return `Aquí se retoma el día ${nextHere.day}.`;
    return `Los días ${day.day + 1} y ${nextHere.day - 1} se pasan en ${other.name}. Aquí se retoma el día ${nextHere.day}.`;
  }, [data.cities, city, day, days]);

  const total = dayTotal(day);
  const people = data.travelers.length;
  const walking = dayWalking(day);

  return (
    <div className="min-h-dvh bg-canvas" style={accentVars(city.accent)}>
      {/* Cabecera: el viaje entero en una línea */}
      <header className="bg-canvas">
        <div className="mx-auto flex max-w-[42rem] flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4 sm:px-8 lg:h-[4.5rem] lg:max-w-[110rem] lg:px-8 lg:py-0">
          <h1 className="font-display text-[1.375rem] font-semibold leading-none tracking-tight text-ink">
            {data.trip.title}
          </h1>
          <p className="rounded-full bg-card px-3 py-1 text-[12px] font-medium text-ink-soft shadow-card tnum">
            {shortDate(data.trip.startDate)} – {shortDate(data.trip.endDate)}
          </p>
          <button
            type="button"
            onClick={() => setSheet({ kind: "docs" })}
            className="flex items-center gap-2 rounded-full bg-card py-1 pl-1 pr-3 text-[12px] font-medium text-ink-soft shadow-card transition-colors hover:bg-well hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            title="Billetes de los tres"
          >
            <span className="flex -space-x-1.5" aria-hidden>
              {data.travelers.map((t) => (
                <span
                  key={t.id}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-deep text-[10px] font-semibold text-white ring-2 ring-card"
                >
                  {t.name[0]}
                </span>
              ))}
            </span>
            {data.travelers.map((t) => t.name).join(", ")}
            <span className="flex items-center gap-1 border-l border-line pl-2">
              <i className="ri-file-list-3-line text-[13px]" aria-hidden />
              Billetes
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSheet({ kind: "expenses" })}
            className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-[12px] font-medium text-ink-soft shadow-card transition-colors hover:bg-well hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <i className="ri-wallet-3-line text-[13px]" aria-hidden />
            Gastos
          </button>
          <nav
            className="ml-auto flex gap-1 rounded-full bg-card p-1 shadow-card"
            aria-label="Ciudades"
          >
            {data.cities.map((c) => {
              const selected = c.id === city.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectCity(c.id)}
                  aria-pressed={selected}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                    selected
                      ? "bg-accent-deep text-white"
                      : "text-ink-soft hover:bg-well hover:text-ink",
                  )}
                  style={accentVars(c.accent)}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: c.accent }}
                    aria-hidden
                  />
                  {c.name}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="mx-auto flex max-w-[110rem] flex-col lg:h-[calc(100dvh-4.5rem)] lg:flex-row">
        {/* Columna del itinerario */}
        <section className="flex min-w-0 flex-1 flex-col lg:max-w-[34rem]">
          {/* Selector de día */}
          <div className="sticky top-0 z-20 bg-canvas/90 backdrop-blur-md">
            <div
              className="mx-auto flex w-full max-w-[42rem] gap-2 px-5 pb-3 pt-2 sm:px-8 lg:max-w-none lg:px-8"
              role="tablist"
              aria-label={`Días en ${city.name}`}
            >
              {days.map((d, i) => {
                const selected = i === dayIndex;
                return (
                  <button
                    key={d.day}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => selectDay(i)}
                    className={cn(
                      "min-w-0 flex-1 rounded-2xl px-2 py-2.5 text-center transition-colors",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                      selected
                        ? "bg-accent-deep text-white shadow-card"
                        : "bg-card text-ink-soft shadow-card hover:bg-well",
                    )}
                  >
                    <span
                      className={cn(
                        "block text-[11px] capitalize",
                        selected ? "text-white/65" : "text-ink-mute",
                      )}
                    >
                      {weekdayShort(d.date).replace(".", "")}
                    </span>
                    <span className="mt-0.5 block font-display text-lg font-semibold leading-none tnum">
                      {dayNumber(d.date)}
                    </span>
                  </button>
                );
              })}

              {hasPlans ? (
                <button
                  type="button"
                  onClick={() => setSheet({ kind: "plans" })}
                  className="flex w-12 shrink-0 items-center justify-center rounded-2xl bg-card text-ink-soft shadow-card transition-colors hover:bg-well hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  aria-label={`Rutas alternativas en ${city.name}`}
                  title={`Rutas alternativas en ${city.name}`}
                >
                  <i className="ri-route-line text-lg" aria-hidden />
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setSheet({ kind: "calendar" })}
                className="flex w-12 shrink-0 items-center justify-center rounded-2xl bg-card text-ink-soft shadow-card transition-colors hover:bg-well hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                aria-label="Ver el viaje completo"
                title="Ver el viaje completo"
              >
                <i className="ri-calendar-2-line text-lg" aria-hidden />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[42rem] px-5 pb-14 sm:px-8 lg:max-w-none lg:px-8 lg:pb-20">
            <div className="pb-6 pt-3">
              {hasPlans && plan ? (
                <button
                  type="button"
                  onClick={() => setSheet({ kind: "plans" })}
                  className="mb-4 flex w-full items-center gap-3 rounded-2xl bg-card px-4 py-3 text-left shadow-card transition-colors hover:bg-well focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink"
                    aria-hidden
                  >
                    <i className="ri-route-line text-[15px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-ink">
                      {plan.name}
                    </span>
                    <span className="block truncate text-[12px] text-ink-mute">
                      {plan.tagline}
                    </span>
                  </span>
                  <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-well px-3 py-1 text-[12px] font-medium text-ink-soft">
                    Cambiar
                    <i className="ri-arrow-right-s-line text-sm" aria-hidden />
                  </span>
                </button>
              ) : null}

              {note ? (
                <p className="mb-4 rounded-2xl bg-accent-soft px-4 py-3 text-[13px] leading-relaxed text-accent-ink">
                  {note}
                </p>
              ) : null}

              {gapNote ? (
                <p className="mb-4 rounded-2xl bg-card px-4 py-3 text-[13px] leading-relaxed text-ink-soft shadow-card">
                  {gapNote}
                </p>
              ) : null}

              <dl className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Gasto por persona",
                    value: dollars(total),
                    sub: total > 0 ? euros(total) : null,
                    group:
                      total > 0
                        ? `Los ${people}: ${dollars(total * people)}`
                        : null,
                  },
                  {
                    label: "A pie",
                    value: durationLabel(walking),
                    sub: null,
                    group: null,
                  },
                  {
                    label: "Paradas",
                    value: String(day.stops.length),
                    sub: null,
                    group: null,
                  },
                ].map((item, i) => (
                  <div
                    key={item.label}
                    className="min-w-0 rounded-card bg-card px-4 py-4 shadow-card"
                  >
                    <dt className="text-[12px] text-ink-mute">{item.label}</dt>
                    <dd
                      className={cn(
                        "mt-2 font-display text-[1.25rem] font-semibold leading-none tracking-tight tnum sm:text-[1.375rem] lg:text-[1.5rem]",
                        i === 0 ? "text-accent-ink" : "text-ink",
                      )}
                    >
                      {item.value}
                    </dd>
                    {item.sub ? (
                      <p className="mt-1.5 text-[12px] text-ink-mute tnum">
                        {item.sub}
                      </p>
                    ) : null}
                    {item.group ? (
                      <p className="mt-0.5 text-[12px] font-medium text-ink-soft tnum">
                        {item.group}
                      </p>
                    ) : null}
                  </div>
                ))}
              </dl>
            </div>

            {/* Mapa en móvil: plegado por defecto para no empujar el itinerario */}
            <div className="mb-3 lg:hidden">
              <button
                type="button"
                onClick={() => setMapOpenMobile((v) => !v)}
                aria-expanded={mapOpenMobile}
                className="flex w-full items-center justify-between rounded-full bg-card py-2 pl-2 pr-4 text-sm font-medium text-ink shadow-card transition-colors hover:bg-well focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <span className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent-ink"
                    aria-hidden
                  >
                    <i className="ri-map-2-line text-[15px]" />
                  </span>
                  {mapOpenMobile ? "Ocultar mapa" : "Ver el día en el mapa"}
                </span>
                <i
                  className={cn(
                    "text-base text-ink-mute transition-transform",
                    mapOpenMobile ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line",
                  )}
                  aria-hidden
                />
              </button>
              {mapOpenMobile ? (
                <div className="mt-3 h-[60vh] overflow-hidden rounded-card shadow-card">
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

            <div
              className="mb-3 flex gap-1 rounded-full bg-card p-1 shadow-card"
              role="group"
              aria-label="Qué paradas mostrar"
            >
              {[
                { value: false, label: "Todo el día", icon: "ri-list-check-2" },
                { value: true, label: "Solo ticket previo", icon: "ri-ticket-2-line" },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setTicketsOnly(opt.value)}
                  aria-pressed={ticketsOnly === opt.value}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                    ticketsOnly === opt.value
                      ? "bg-accent-deep text-white"
                      : "text-ink-soft hover:bg-well hover:text-ink",
                  )}
                >
                  <i className={cn(opt.icon, "text-[14px]")} aria-hidden />
                  {opt.label}
                </button>
              ))}
            </div>

            {ticketsOnly ? (
              <TicketStops
                day={day}
                people={people}
                activeStopId={activeStopId}
                onSelectStop={(stop) => setSheet({ kind: "stop", stop })}
              />
            ) : (
              <DayTimeline
                city={city}
                day={day}
                activeStopId={activeStopId}
                onSelectStop={(stop) => setSheet({ kind: "stop", stop })}
                onSelectStay={() => setSheet({ kind: "stay" })}
              />
            )}
            </div>
          </div>
        </section>

        {/* Mapa fijo en escritorio */}
        <section
          className="hidden flex-1 lg:block lg:py-2 lg:pl-2 lg:pr-8 lg:pb-8"
          aria-label="Mapa del día"
        >
          <div className="h-full w-full overflow-hidden rounded-card shadow-card">
            <TripMap
              city={city}
              day={day}
              activeStopId={activeStopId}
              onSelectStop={(stop) => setSheet({ kind: "stop", stop })}
              onSelectStay={() => setSheet({ kind: "stay" })}
            />
          </div>
        </section>
      </div>

      <ResponsiveModal
        open={sheet !== null}
        onOpenChange={(open) => !open && setSheet(null)}
        onPrev={prevStop ? () => setSheet({ kind: "stop", stop: prevStop }) : undefined}
        onNext={nextStop ? () => setSheet({ kind: "stop", stop: nextStop }) : undefined}
        wide={
          sheet?.kind === "calendar" ||
          sheet?.kind === "plans" ||
          sheet?.kind === "docs" ||
          sheet?.kind === "expenses"
        }
        title={
          sheet?.kind === "stop"
            ? sheet.stop.name
            : sheet?.kind === "stay"
              ? city.stay.name
              : sheet?.kind === "calendar"
                ? "El viaje completo"
                : sheet?.kind === "plans"
                  ? `Rutas en ${city.name}`
                  : sheet?.kind === "docs"
                    ? "Billetes"
                    : sheet?.kind === "expenses"
                      ? "Gastos compartidos"
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
            travelers={data.travelers}
            documents={data.documents.filter((d) =>
              sheet.stop.documents?.includes(d.id),
            )}
            documentsLoading={privLoading}
          />
        ) : sheet?.kind === "stay" ? (
          <StayDetail city={city} travelers={people} />
        ) : sheet?.kind === "calendar" ? (
          <TripCalendar
            data={data}
            currentCityId={city.id}
            currentDay={day.day}
            planIds={planIds}
            onPick={pickFromCalendar}
          />
        ) : sheet?.kind === "docs" ? (
          <TripDocuments data={data} loading={privLoading} />
        ) : sheet?.kind === "expenses" ? (
          <ExpensesSheet data={data} accent={city.accent} />
        ) : sheet?.kind === "plans" && planId ? (
          <PlanPicker city={city} planId={planId} onPick={selectPlan} />
        ) : null}
      </ResponsiveModal>
    </div>
  );
}
