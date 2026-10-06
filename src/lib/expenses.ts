import { useCallback, useEffect, useRef, useState } from "react";
import type { Expense, Payment } from "./types";
import { api, hasBackend } from "./api";
import { createResource } from "./cache";
import { toUsd } from "./utils";

/** Todo lo que se anota en la hoja de gastos. */
export interface Ledger {
  expenses: Expense[];
  payments: Payment[];
}

/** Un cambio en las cuentas, tal como se manda al almacén. */
export type LedgerOp =
  | { type: "addExpense"; expense: Expense }
  | { type: "updateExpense"; id: string; patch: Partial<Expense> }
  | { type: "removeExpense"; id: string }
  | { type: "addPayment"; payment: Payment }
  | { type: "updatePayment"; id: string; patch: Partial<Payment> }
  | { type: "removePayment"; id: string };

/**
 * Dónde viven las cuentas. `apply` recibe el cambio y cómo quedan las cuentas
 * después: la API usa lo primero y el navegador guarda lo segundo.
 */
export interface LedgerStore {
  load(): Promise<Ledger | null>;
  apply(op: LedgerOp, next: Ledger): Promise<void>;
}

const KEY = "viaje-2026:cuentas";
/** Versión anterior: sólo guardaba la lista de gastos. */
const OLD_KEY = "viaje-2026:gastos";

/** Cada navegador con sus cuentas. Para desarrollo o sin backend. */
export const localLedgerStore: LedgerStore = {
  async load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw) as Ledger;
      const old = localStorage.getItem(OLD_KEY);
      return old ? { expenses: JSON.parse(old) as Expense[], payments: [] } : null;
    } catch {
      return null;
    }
  },
  async apply(_op, next) {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Sin almacenamiento (modo privado): las cuentas duran lo que la pestaña.
    }
  },
};

/** Las cuentas compartidas de los tres, en el backend de Django. */
export const apiLedgerStore: LedgerStore = {
  async load() {
    return (await api("ledger/")) as Ledger;
  },
  async apply(op) {
    const body = (data: unknown) => JSON.stringify(data);
    switch (op.type) {
      case "addExpense":
        await api("expenses/", { method: "POST", body: body(op.expense) });
        return;
      case "updateExpense":
        await api(`expenses/${encodeURIComponent(op.id)}/`, {
          method: "PATCH",
          body: body(op.patch),
        });
        return;
      case "removeExpense":
        await api(`expenses/${encodeURIComponent(op.id)}/`, { method: "DELETE" });
        return;
      case "addPayment":
        await api("payments/", { method: "POST", body: body(op.payment) });
        return;
      case "updatePayment":
        await api(`payments/${encodeURIComponent(op.id)}/`, {
          method: "PATCH",
          body: body(op.patch),
        });
        return;
      case "removePayment":
        await api(`payments/${encodeURIComponent(op.id)}/`, { method: "DELETE" });
        return;
    }
  },
};

/** Con backend configurado, las cuentas son compartidas; si no, del navegador. */
export const ledgerStore: LedgerStore = hasBackend ? apiLedgerStore : localLedgerStore;

function reduce(ledger: Ledger, op: LedgerOp): Ledger {
  switch (op.type) {
    case "addExpense":
      return { ...ledger, expenses: [...ledger.expenses, op.expense] };
    case "updateExpense":
      return {
        ...ledger,
        expenses: ledger.expenses.map((e) =>
          e.id === op.id ? { ...e, ...op.patch } : e,
        ),
      };
    case "removeExpense":
      return { ...ledger, expenses: ledger.expenses.filter((e) => e.id !== op.id) };
    case "addPayment":
      return { ...ledger, payments: [...ledger.payments, op.payment] };
    case "updatePayment":
      return {
        ...ledger,
        payments: ledger.payments.map((p) =>
          p.id === op.id ? { ...p, ...op.patch } : p,
        ),
      };
    case "removePayment":
      return { ...ledger, payments: ledger.payments.filter((p) => p.id !== op.id) };
  }
}

/**
 * Las cuentas guardadas en memoria mientras la página esté abierta: abrir y
 * cerrar la hoja no vuelve a pedirlas. Pasado un minuto se refrescan por
 * detrás, para ver lo que han anotado los demás.
 */
const ledgerCache = createResource(() => ledgerStore.load(), 60_000);

function message(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

/**
 * Las cuentas con sus operaciones. `ledger` es `null` sólo la primera vez,
 * mientras llegan (para el skeleton); después sale de la caché al instante.
 * Cada cambio se ve al momento y luego se manda al almacén; si falla, se
 * recargan las cuentas reales y queda el error en `error`. Sin nada guardado,
 * arranca con los gastos de `trip.json`.
 */
export function useLedger(seed: Expense[]) {
  const orSeed = useCallback(
    (saved: Ledger | null): Ledger => saved ?? { expenses: seed, payments: [] },
    [seed],
  );
  const cached = ledgerCache.peek();
  const [ledger, setLedger] = useState<Ledger | null>(
    cached === undefined ? null : orSeed(cached),
  );
  const [error, setError] = useState<string | null>(null);
  // Lo último aplicado, para encadenar cambios seguidos sin esperar al render.
  const current = useRef(ledger);
  useEffect(() => {
    current.current = ledger;
  }, [ledger]);

  useEffect(() => {
    if (ledgerCache.isFresh()) return;
    let alive = true;
    ledgerCache
      .fetch()
      .then((saved) => {
        if (alive) setLedger(orSeed(saved));
      })
      .catch((e: unknown) => {
        if (alive) setError(message(e, "No se pudieron cargar las cuentas."));
      });
    return () => {
      alive = false;
    };
  }, [orSeed]);

  const commit = useCallback(
    (op: LedgerOp) => {
      if (!current.current) return;
      const next = reduce(current.current, op);
      current.current = next;
      ledgerCache.set(next);
      setLedger(next);
      setError(null);
      ledgerStore.apply(op, next).catch((e: unknown) => {
        setError(`No se guardó el cambio: ${message(e, "error de conexión")}`);
        ledgerCache
          .fetch()
          .then((saved) => setLedger(orSeed(saved)))
          .catch(() => {});
      });
    },
    [orSeed],
  );

  return {
    ledger,
    error,
    addExpense: (expense: Expense) => commit({ type: "addExpense", expense }),
    updateExpense: (id: string, patch: Partial<Expense>) =>
      commit({ type: "updateExpense", id, patch }),
    removeExpense: (id: string) => commit({ type: "removeExpense", id }),
    addPayment: (payment: Payment) => commit({ type: "addPayment", payment }),
    updatePayment: (id: string, patch: Partial<Payment>) =>
      commit({ type: "updatePayment", id, patch }),
    removePayment: (id: string) => commit({ type: "removePayment", id }),
  };
}

export interface Balance {
  travelerId: string;
  /** Lo que ha adelantado, en dólares. */
  paid: number;
  /** Lo que le toca de los gastos en que participa, en dólares. */
  share: number;
}

export interface Debt {
  from: string;
  to: string;
  /** Lo que `from` le debe a `to`, en dólares: la suma de `items`. */
  amount: number;
  /** De qué gastos sale, con la parte de `from` en cada uno, en dólares. */
  items: { expenseId: string; concept: string; amount: number }[];
  /** Transferencias de `from` a `to` ya hechas, en orden de fecha. */
  payments: Payment[];
  /** Lo ya transferido, en dólares. */
  paid: number;
  /** Lo que falta; nunca negativo. */
  pending: number;
}

const cents = (n: number) => Math.round(n * 100) / 100;

/**
 * El saldo de cada viajero, en dólares. Los gastos sin pagador todavía no
 * cuentan: nadie ha adelantado ese dinero.
 */
export function balances(expenses: Expense[], travelerIds: string[]): Balance[] {
  const paid = new Map(travelerIds.map((id) => [id, 0]));
  const share = new Map(travelerIds.map((id) => [id, 0]));
  for (const e of expenses) {
    if (!e.paidBy || e.splitAmong.length === 0) continue;
    const usd = toUsd(e.amount, e.currency);
    paid.set(e.paidBy, (paid.get(e.paidBy) ?? 0) + usd);
    for (const id of e.splitAmong) {
      share.set(id, (share.get(id) ?? 0) + usd / e.splitAmong.length);
    }
  }
  return travelerIds.map((id) => ({
    travelerId: id,
    paid: cents(paid.get(id) ?? 0),
    share: cents(share.get(id) ?? 0),
  }));
}

/**
 * Lo que cada uno le debe a cada pagador, sin compensar: si Alejandra le debe
 * a Daniela y Daniela a Alejandra, salen las dos deudas. Son más pagos, pero
 * cada uno devuelve exactamente su parte de lo que adelantó el otro. Las
 * transferencias hechas se descuentan de la deuda de su pareja.
 */
export function debts(expenses: Expense[], payments: Payment[]): Debt[] {
  const byPair = new Map<string, Debt>();
  for (const e of expenses) {
    if (!e.paidBy || e.splitAmong.length === 0) continue;
    const part = cents(toUsd(e.amount, e.currency) / e.splitAmong.length);
    for (const id of e.splitAmong) {
      if (id === e.paidBy) continue;
      const key = `${id}>${e.paidBy}`;
      const debt = byPair.get(key) ?? {
        from: id,
        to: e.paidBy,
        amount: 0,
        items: [],
        payments: [],
        paid: 0,
        pending: 0,
      };
      debt.items.push({ expenseId: e.id, concept: e.concept, amount: part });
      debt.amount = cents(debt.amount + part);
      byPair.set(key, debt);
    }
  }
  for (const debt of byPair.values()) {
    debt.payments = payments
      .filter((p) => p.from === debt.from && p.to === debt.to)
      .sort((a, b) => a.date.localeCompare(b.date));
    debt.paid = cents(debt.payments.reduce((s, p) => s + p.amount, 0));
    debt.pending = Math.max(cents(debt.amount - debt.paid), 0);
  }
  return [...byPair.values()];
}
