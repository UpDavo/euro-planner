import { useEffect, useState } from "react";
import { api, apiFileUrl, hasBackend } from "./api";
import { createResource } from "./cache";
import type { Day, TripData, TripDocument } from "./types";

/** Lo que el backend guarda fuera del repositorio público. */
export interface PrivateData {
  documents: TripDocument[];
  /** Texto de "Reserva" con localizadores, por id de parada. */
  bookings: Record<string, string>;
  /** Dirección completa del alojamiento, por id de ciudad. */
  addresses: Record<string, string>;
}

/**
 * Los billetes y datos sensibles no cambian durante la visita: se piden una
 * sola vez por página y se reutilizan al moverse por la app.
 */
const privateCache = createResource(
  () => api("private/") as Promise<PrivateData>,
  Number.POSITIVE_INFINITY,
);

/**
 * Pide al backend los billetes y los datos sensibles. Sin backend, o si falla,
 * `data` es `null` y la app se queda con lo que trae el JSON; `loading` sólo es
 * cierto mientras se espera la primera respuesta.
 */
export function usePrivateData(): { data: PrivateData | null; loading: boolean } {
  const [data, setData] = useState<PrivateData | null>(() => privateCache.peek() ?? null);
  const [loading, setLoading] = useState(() => hasBackend && !privateCache.isFresh());

  useEffect(() => {
    if (!hasBackend || privateCache.isFresh()) return;
    let alive = true;
    privateCache
      .fetch()
      .then((res) => {
        if (alive) setData(res);
      })
      .catch(() => {
        // Sin conexión o sin clave: se ve el viaje, sólo faltan los billetes.
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { data, loading };
}

/** El viaje con los billetes, localizadores y direcciones del backend encima. */
export function withPrivateData(trip: TripData, priv: PrivateData | null): TripData {
  if (!priv) return trip;
  const withBookings = <D extends Day>(day: D): D => ({
    ...day,
    stops: day.stops.map((stop) =>
      priv.bookings[stop.id] ? { ...stop, booking: priv.bookings[stop.id] } : stop,
    ),
  });
  return {
    ...trip,
    documents: priv.documents.map((d) => ({ ...d, file: apiFileUrl(d.file) })),
    cities: trip.cities.map((city) => ({
      ...city,
      stay: priv.addresses[city.id]
        ? { ...city.stay, address: priv.addresses[city.id] }
        : city.stay,
      days: city.days.map(withBookings),
      plans: city.plans?.map((plan) => ({ ...plan, days: plan.days.map(withBookings) })),
    })),
  };
}
