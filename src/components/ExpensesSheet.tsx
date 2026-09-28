"use client";

import { useState, type FormEvent } from "react";
import { balances, debts, useLedger, type Debt } from "@/lib/expenses";
import type { Currency, Expense, Payment, TripData } from "@/lib/types";
import { accentVars, cn, money, shortDate, toUsd } from "@/lib/utils";
import Skeleton from "./Skeleton";

const fieldClass =
  "w-full rounded-xl border border-line bg-card px-3 py-2 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink";
const labelClass = "mb-1 block text-[12px] font-medium text-ink-soft";
const sectionTitle =
  "mb-2 text-[12px] font-medium uppercase tracking-wide text-ink-mute";

/** Quién está mirando las cuentas en este navegador. Sólo es una comodidad. */
const WHO_KEY = "viaje-2026:quien";

const sum = (items: { pending: number }[]) =>
  items.reduce((acc, d) => acc + d.pending, 0);

/**
 * Los gastos compartidos del viaje: quién adelantó qué, cuánto le toca a cada
 * uno y lo que falta por devolverse. Las cuentas se hacen en dólares.
 */
export default function ExpensesSheet({
  data,
  accent,
}: {
  data: TripData;
  /** Color de la ciudad abierta, como el resto de fichas. */
  accent: string;
}) {
  const ledger = useLedger(data.expenses);
  const [tab, setTab] = useState<"cuentas" | "gastos">("cuentas");
  const ids = data.travelers.map((t) => t.id);
  const name = (id: string | null) =>
    data.travelers.find((t) => t.id === id)?.name ?? "Sin asignar";

  // `null` es "Todos". Se recuerda por navegador: cada uno entra con el suyo.
  // La hoja sólo se monta al abrirla, en el cliente, así que puede leerlo ya.
  const [who, setWho] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(WHO_KEY);
      return saved && ids.includes(saved) ? saved : null;
    } catch {
      return null;
    }
  });
  function pickWho(id: string | null) {
    setWho(id);
    try {
      if (id) localStorage.setItem(WHO_KEY, id);
      else localStorage.removeItem(WHO_KEY);
    } catch {}
  }

  if (!ledger.ledger) {
    return <ExpensesSkeleton accent={accent} error={ledger.error} />;
  }
  const { expenses, payments } = ledger.ledger;

  const list = balances(expenses, ids);
  const owed = debts(expenses, payments);
  const totalUsd = expenses.reduce((s, e) => s + toUsd(e.amount, e.currency), 0);
  const unassigned = expenses.filter((e) => !e.paidBy).length;

  const mine = who ? list.find((b) => b.travelerId === who) : null;
  const toPay = who ? owed.filter((d) => d.from === who) : [];

  function pay(debt: Debt, amount: number, date: string) {
    ledger.addPayment({
      id: crypto.randomUUID(),
      from: debt.from,
      to: debt.to,
      amount,
      date,
    });
  }

  const debtList = (items: Debt[], empty: string) =>
    items.length === 0 ? (
      <p className="rounded-2xl bg-well px-4 py-3 text-sm text-ink-soft">{empty}</p>
    ) : (
      <ul className="grid gap-2">
        {items.map((d) => (
          <DebtCard
            key={`${d.from}-${d.to}`}
            debt={d}
            name={name}
            onPay={(amount, date) => pay(d, amount, date)}
            onRemovePayment={ledger.removePayment}
          />
        ))}
      </ul>
    );

  return (
    <div className="grid gap-6" style={accentVars(accent)}>
      {ledger.error ? (
        <p
          className="rounded-2xl bg-accent-soft px-4 py-3 text-[13px] font-medium text-accent-ink"
          role="alert"
        >
          {ledger.error}
        </p>
      ) : null}
      <div
        className="flex gap-1 rounded-full bg-well p-1 md:mr-12"
        role="tablist"
        aria-label="Secciones de gastos"
      >
        {(
          [
            { id: "cuentas", label: "Cuentas", icon: "ri-exchange-dollar-line" },
            { id: "gastos", label: `Gastos · ${expenses.length}`, icon: "ri-receipt-line" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium transition-colors",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
              tab === t.id
                ? "bg-card text-ink shadow-card"
                : "text-ink-soft hover:text-ink",
            )}
          >
            <i className={cn(t.icon, "text-[14px]")} aria-hidden />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "gastos" ? (
        <div className="grid gap-7" role="tabpanel">
          <section>
            <h3 className={sectionTitle}>Gastos</h3>
            {expenses.length === 0 ? (
              <p className="rounded-2xl bg-well px-4 py-3 text-sm text-ink-soft">
                Todavía no hay gastos. Anota el primero abajo.
              </p>
            ) : (
              <ul className="grid gap-2">
                {[...expenses]
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((e) => (
                    <ExpenseRow
                      key={e.id}
                      expense={e}
                      data={data}
                      onPaidBy={(paidBy) => ledger.updateExpense(e.id, { paidBy })}
                      onRemove={() => ledger.removeExpense(e.id)}
                    />
                  ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className={sectionTitle}>Anotar un gasto</h3>
            <ExpenseForm data={data} onAdd={ledger.addExpense} />
          </section>
        </div>
      ) : (
        <div className="grid gap-7" role="tabpanel">
          <div
            className="-mb-3 flex flex-wrap gap-1.5"
            role="group"
            aria-label="Ver las cuentas de"
          >
            {[{ id: null, label: "Todos" }, ...data.travelers.map((t) => ({ id: t.id, label: t.name }))].map(
              (opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => pickWho(opt.id)}
                  aria-pressed={who === opt.id}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                    who === opt.id
                      ? "bg-accent-deep text-white"
                      : "bg-well text-ink-soft hover:text-ink",
                  )}
                >
                  {opt.label}
                </button>
              ),
            )}
          </div>

          {mine ? (
            <div className="rounded-2xl bg-accent-deep px-5 py-5 text-white">
              <p className="text-[12px] text-white/60">
                Cuentas de {name(mine.travelerId)}
              </p>
              <dl className="mt-3 grid grid-cols-3 gap-3">
                {[
                  { label: "Le toca", value: mine.share },
                  {
                    label: "Ya transferido",
                    value: toPay.reduce((acc, d) => acc + d.paid, 0),
                  },
                  { label: "Falta pagar", value: sum(toPay) },
                ].map((item) => (
                  <div key={item.label} className="min-w-0">
                    <dt className="truncate text-[13px] text-white/70">{item.label}</dt>
                    <dd className="mt-1 font-display text-[1.375rem] font-semibold leading-none tracking-tight tnum sm:text-[1.75rem]">
                      {money(item.value, "USD")}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 border-t border-white/15 pt-3 text-[13px] text-white/60 tnum">
                Adelantó {money(mine.paid, "USD")} · total anotado{" "}
                {money(totalUsd, "USD")}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-accent-deep px-5 py-5 text-white">
              <p className="text-[12px] text-white/60">Le toca pagar a cada uno</p>
              <dl className="mt-3 grid grid-cols-3 gap-3">
                {list.map((b) => (
                  <div key={b.travelerId} className="min-w-0">
                    <dt className="truncate text-[13px] text-white/70">{name(b.travelerId)}</dt>
                    <dd className="mt-1 font-display text-[1.375rem] font-semibold leading-none tracking-tight tnum sm:text-[1.75rem]">
                      {money(b.share, "USD")}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 border-t border-white/15 pt-3 text-[13px] text-white/60 tnum">
                Total anotado {money(totalUsd, "USD")} · {expenses.length}{" "}
                {expenses.length === 1 ? "gasto" : "gastos"}
              </p>
            </div>
          )}

          {who ? (
            <section>
              <h3 className={sectionTitle}>Lo que {name(who)} tiene que pagar</h3>
              {debtList(toPay, `${name(who)} no le debe nada a nadie.`)}
            </section>
          ) : (
            <section>
              <h3 className={sectionTitle}>Quién le paga a quién</h3>
              {debtList(owed, "Nadie le debe nada a nadie.")}
            </section>
          )}
          {unassigned > 0 ? (
            <p className="-mt-5 text-[12px] text-ink-mute">
              {unassigned === 1
                ? "Hay 1 gasto sin pagador: no cuenta hasta que se elija quién pagó."
                : `Hay ${unassigned} gastos sin pagador: no cuentan hasta que se elija quién pagó.`}
            </p>
          ) : null}

          {who ? null : (
            <section>
              <h3 className={sectionTitle}>Saldo de cada uno</h3>
              <div className="grid gap-2 sm:grid-cols-3">
                {list.map((b) => (
                  <div key={b.travelerId} className="rounded-2xl bg-well px-4 py-3">
                    <p className="text-sm font-medium text-ink">{name(b.travelerId)}</p>
                    <dl className="mt-2 grid gap-1 text-[12px] text-ink-soft tnum">
                      <div className="flex justify-between gap-2">
                        <dt>Adelantó</dt>
                        <dd>{money(b.paid, "USD")}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>Le toca</dt>
                        <dd>{money(b.share, "USD")}</dd>
                      </div>
                      <div className="flex justify-between gap-2 border-t border-line pt-1 font-medium text-ink">
                        <dt>Falta pagar</dt>
                        <dd>{money(sum(owed.filter((d) => d.from === b.travelerId)), "USD")}</dd>
                      </div>
                      <div className="flex justify-between gap-2 font-medium text-accent-ink">
                        <dt>Falta cobrar</dt>
                        <dd>{money(sum(owed.filter((d) => d.to === b.travelerId)), "USD")}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

/** La hoja de gastos mientras llegan las cuentas por primera vez. */
function ExpensesSkeleton({ accent, error }: { accent: string; error: string | null }) {
  return (
    <div className="grid gap-6" style={accentVars(accent)} aria-busy="true">
      {error ? (
        <p
          className="rounded-2xl bg-accent-soft px-4 py-3 text-[13px] font-medium text-accent-ink"
          role="alert"
        >
          {error}
        </p>
      ) : (
        <p className="sr-only" role="status">
          Cargando las cuentas…
        </p>
      )}
      <Skeleton className="h-11 rounded-full md:mr-12" />
      <div className="flex gap-1.5">
        {[4.5, 6, 5, 5.5].map((w) => (
          <Skeleton key={w} className="h-8 rounded-full" style={{ width: `${w}rem` }} />
        ))}
      </div>
      <Skeleton className="h-36" />
      <div className="grid gap-2">
        <Skeleton className="h-3 w-32 rounded-full" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    </div>
  );
}

/** Hoy en formato `YYYY-MM-DD`, en la hora del dispositivo. */
function today() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Una deuda entre dos personas: de qué gastos sale, lo transferido y lo que
 * falta, con un formulario para anotar una transferencia, aunque sea parcial.
 */
function DebtCard({
  debt: d,
  name,
  onPay,
  onRemovePayment,
}: {
  debt: Debt;
  name: (id: string | null) => string;
  onPay: (amount: number, date: string) => void;
  onRemovePayment: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [error, setError] = useState<string | null>(null);
  const done = d.pending < 0.005;
  const progress = d.amount > 0 ? Math.min(d.paid / d.amount, 1) : 0;
  const formId = `pago-${d.from}-${d.to}`;

  function start() {
    setAmount(d.pending.toFixed(2).replace(".", ","));
    setDate(today());
    setError(null);
    setOpen(true);
  }

  function submit(ev: FormEvent) {
    ev.preventDefault();
    const value = Math.round(Number(amount.replace(",", ".")) * 100) / 100;
    if (!Number.isFinite(value) || value <= 0)
      return setError("El importe tiene que ser un número mayor que cero.");
    onPay(value, date);
    setOpen(false);
  }

  return (
    <li className="rounded-2xl bg-well px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-ink">{name(d.from)}</span>
        <i className="ri-arrow-right-line text-ink-mute" aria-hidden />
        <span className="text-sm font-medium text-ink">{name(d.to)}</span>
        <span className="ml-auto text-right">
          {done ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-[12px] font-medium text-ink-soft">
              <i className="ri-check-line text-[13px]" aria-hidden />
              Saldado
            </span>
          ) : (
            <span className="block font-display text-lg font-semibold leading-tight text-accent-ink tnum">
              {money(d.pending, "USD")}
            </span>
          )}
          {d.paid > 0 ? (
            <span className="block text-[12px] text-ink-mute tnum">
              pagado {money(d.paid, "USD")} de {money(d.amount, "USD")}
            </span>
          ) : null}
        </span>
      </div>

      {d.paid > 0 ? (
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-card"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label="Parte ya transferida"
        >
          <div
            className="h-full rounded-full bg-accent-solid"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      ) : null}

      <ul className="mt-2 grid gap-0.5 border-t border-line pt-2 text-[12px] text-ink-mute">
        {d.items.map((item) => (
          <li key={item.expenseId} className="flex justify-between gap-3">
            <span className="min-w-0 truncate">{item.concept}</span>
            <span className="shrink-0 tnum">{money(item.amount, "USD")}</span>
          </li>
        ))}
      </ul>

      {d.payments.length > 0 ? (
        <ul className="mt-2 grid gap-1 border-t border-line pt-2 text-[12px]">
          {d.payments.map((p: Payment) => (
            <li key={p.id} className="flex items-center gap-2 text-ink-soft">
              <i className="ri-exchange-dollar-line text-[13px] text-accent-ink" aria-hidden />
              <span className="tnum">{shortDate(p.date)}</span>
              <span>· transferencia</span>
              <span className="ml-auto font-medium text-ink tnum">
                {money(p.amount, "USD")}
              </span>
              <button
                type="button"
                onClick={() => onRemovePayment(p.id)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-ink-mute transition-colors hover:bg-card hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
                aria-label={`Quitar la transferencia del ${shortDate(p.date)}`}
              >
                <i className="ri-close-line text-[14px]" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {open ? (
        <form
          onSubmit={submit}
          className="mt-3 grid gap-2 rounded-xl bg-card p-3"
          aria-label={`Transferencia de ${name(d.from)} a ${name(d.to)}`}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor={`${formId}-importe`} className={labelClass}>
                Importe en $
              </label>
              <input
                id={`${formId}-importe`}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={cn(fieldClass, "tnum")}
              />
            </div>
            <div>
              <label htmlFor={`${formId}-fecha`} className={labelClass}>
                Fecha
              </label>
              <input
                id={`${formId}-fecha`}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>
          {error ? (
            <p className="text-[13px] font-medium text-accent-ink" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-full bg-accent-deep px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Guardar transferencia
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full px-4 py-2 text-[13px] font-medium text-ink-soft hover:bg-well focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : done ? null : (
        <button
          type="button"
          onClick={start}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-[12px] font-medium text-accent-ink transition-colors hover:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <i className="ri-add-line text-[13px]" aria-hidden />
          Registrar transferencia
        </button>
      )}
    </li>
  );
}

function splitLabel(e: Expense, data: TripData) {
  if (e.splitAmong.length === data.travelers.length) {
    return `Entre los ${e.splitAmong.length}`;
  }
  return `Entre ${data.travelers
    .filter((t) => e.splitAmong.includes(t.id))
    .map((t) => t.name)
    .join(" y ")}`;
}

function ExpenseRow({
  expense: e,
  data,
  onPaidBy,
  onRemove,
}: {
  expense: Expense;
  data: TripData;
  onPaidBy: (id: string | null) => void;
  onRemove: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const each = e.amount / Math.max(e.splitAmong.length, 1);

  return (
    <li className="rounded-2xl border border-line bg-card px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-ink-mute tnum">{shortDate(e.date)}</p>
          <p className="text-[15px] font-medium leading-snug text-ink">{e.concept}</p>
          {e.note ? <p className="mt-0.5 text-[12px] text-ink-mute">{e.note}</p> : null}
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-lg font-semibold text-accent-ink tnum">
            {money(each, e.currency)}
            <span className="ml-1 text-[12px] font-normal text-ink-mute">c/u</span>
          </p>
          {e.currency === "EUR" ? (
            <p className="text-[12px] font-medium text-ink-soft tnum">
              ≈ {money(toUsd(each, "EUR"), "USD")} c/u
            </p>
          ) : null}
          <p className="text-[12px] text-ink-mute tnum">
            Total {money(e.amount, e.currency)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <label className="flex items-center gap-2 text-[12px] text-ink-soft">
          Pagó
          <select
            id={`pago-${e.id}`}
            value={e.paidBy ?? ""}
            onChange={(ev) => onPaidBy(ev.target.value || null)}
            className={cn(
              "rounded-full border border-line bg-well px-2.5 py-1 text-[12px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink",
              e.paidBy ? "text-ink" : "text-accent-ink",
            )}
          >
            <option value="">Sin asignar</option>
            {data.travelers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <span className="rounded-full bg-well px-2.5 py-1 text-[12px] text-ink-soft">
          {splitLabel(e, data)}
        </span>
        <span className="ml-auto flex items-center gap-2">
          {confirming ? (
            <>
              <span className="text-[12px] text-ink-soft">¿Borrar?</span>
              <button
                type="button"
                onClick={onRemove}
                className="rounded-full bg-ink px-3 py-1 text-[12px] font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Borrar
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-full bg-well px-3 py-1 text-[12px] font-medium text-ink-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-ink-mute transition-colors hover:bg-well hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              aria-label={`Borrar ${e.concept}`}
            >
              <i className="ri-delete-bin-6-line text-[14px]" aria-hidden />
            </button>
          )}
        </span>
      </div>
    </li>
  );
}

function ExpenseForm({
  data,
  onAdd,
}: {
  data: TripData;
  onAdd: (e: Expense) => void;
}) {
  const all = data.travelers.map((t) => t.id);
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [paidBy, setPaidBy] = useState("");
  const [splitAmong, setSplitAmong] = useState<string[]>(all);
  const [date, setDate] = useState(data.trip.startDate);
  const [error, setError] = useState<string | null>(null);

  function submit(ev: FormEvent) {
    ev.preventDefault();
    const value = Number(amount.replace(",", "."));
    if (!concept.trim()) return setError("Escribe en qué se gastó.");
    if (!Number.isFinite(value) || value <= 0)
      return setError("El importe tiene que ser un número mayor que cero.");
    if (splitAmong.length === 0)
      return setError("Elige al menos una persona para repartir el gasto.");
    onAdd({
      id: crypto.randomUUID(),
      concept: concept.trim(),
      amount: Math.round(value * 100) / 100,
      currency,
      paidBy: paidBy || null,
      splitAmong,
      date,
    });
    setConcept("");
    setAmount("");
    setError(null);
  }

  function toggle(id: string) {
    setSplitAmong((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-2xl bg-well p-4">
      <div>
        <label htmlFor="gasto-concepto" className={labelClass}>
          Concepto
        </label>
        <input
          id="gasto-concepto"
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder="Cena en Trastevere"
          className={fieldClass}
        />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <div>
          <label htmlFor="gasto-importe" className={labelClass}>
            Importe
          </label>
          <input
            id="gasto-importe"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="45,50"
            className={cn(fieldClass, "tnum")}
          />
        </div>
        <div>
          <label htmlFor="gasto-moneda" className={labelClass}>
            Moneda
          </label>
          <select
            id="gasto-moneda"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className={fieldClass}
          >
            <option value="EUR">€ euros</option>
            <option value="USD">$ dólares</option>
          </select>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label htmlFor="gasto-pago" className={labelClass}>
            Pagó
          </label>
          <select
            id="gasto-pago"
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className={fieldClass}
          >
            <option value="">Sin asignar</option>
            {data.travelers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="gasto-fecha" className={labelClass}>
            Fecha
          </label>
          <input
            id="gasto-fecha"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>
      <fieldset>
        <legend className={labelClass}>Se reparte entre</legend>
        <div className="flex flex-wrap gap-2">
          {data.travelers.map((t) => {
            const on = splitAmong.includes(t.id);
            return (
              <label
                key={t.id}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                  on ? "bg-accent-deep text-white" : "bg-card text-ink-soft",
                )}
              >
                <input
                  id={`gasto-entre-${t.id}`}
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(t.id)}
                  className="sr-only"
                />
                <i
                  className={on ? "ri-check-line" : "ri-add-line"}
                  aria-hidden
                />
                {t.name}
              </label>
            );
          })}
        </div>
      </fieldset>
      {error ? (
        <p className="text-[13px] font-medium text-accent-ink" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-deep px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <i className="ri-add-line text-base" aria-hidden />
        Anotar gasto
      </button>
    </form>
  );
}
