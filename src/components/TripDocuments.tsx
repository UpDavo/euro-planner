"use client";

import type { TripData } from "@/lib/types";
import DocumentLink from "./DocumentLink";
import Skeleton from "./Skeleton";

/** Todos los billetes del viaje: primero los de cada uno, luego los conjuntos. */
export default function TripDocuments({
  data,
  loading,
}: {
  data: TripData;
  /** Los billetes aún llegan del backend. */
  loading: boolean;
}) {
  const shared = data.documents.filter((d) => !d.travelerId);

  return (
    <div className="grid gap-6">
      <p className="text-[0.9375rem] leading-relaxed text-ink-soft">
        Los billetes de los tres, para tenerlos a mano en el aeropuerto y en la
        estación. Cada parada con billete enlaza también el suyo.
      </p>

      {loading ? (
        <div className="grid gap-6" aria-busy="true">
          <p className="sr-only" role="status">
            Cargando los billetes…
          </p>
          {data.travelers.map((t) => (
            <section key={t.id}>
              <h3 className="mb-2 text-[12px] font-medium uppercase tracking-wide text-ink-mute">
                {t.name}
              </h3>
              <Skeleton className="h-[3.25rem]" />
            </section>
          ))}
        </div>
      ) : null}

      {!loading && data.documents.length === 0 ? (
        <p className="rounded-2xl bg-well px-4 py-3 text-sm text-ink-soft">
          No se pudieron cargar los billetes del servidor. Recarga la página para intentarlo de nuevo.
        </p>
      ) : null}

      {data.travelers.map((t) => {
        const docs = data.documents.filter((d) => d.travelerId === t.id);
        if (docs.length === 0) return null;
        return (
          <section key={t.id}>
            <h3 className="mb-2 text-[12px] font-medium uppercase tracking-wide text-ink-mute">
              {t.name}
            </h3>
            <div className="grid gap-2">
              {docs.map((doc) => (
                <DocumentLink key={doc.id} doc={doc} />
              ))}
            </div>
          </section>
        );
      })}

      {shared.length > 0 ? (
        <section>
          <h3 className="mb-2 text-[12px] font-medium uppercase tracking-wide text-ink-mute">
            De los tres
          </h3>
          <div className="grid gap-2">
            {shared.map((doc) => (
              <DocumentLink key={doc.id} doc={doc} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
