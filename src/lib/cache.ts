/**
 * Un dato del backend guardado en memoria mientras la página esté abierta, para
 * no volver a pedirlo cada vez que se abre una hoja. Las peticiones simultáneas
 * comparten la misma respuesta.
 */
export interface Resource<T> {
  /** Lo último cargado o guardado, si hay. */
  peek(): T | undefined;
  /** Si lo guardado es lo bastante reciente como para no volver a pedirlo. */
  isFresh(): boolean;
  /** Pide el dato; si ya hay una petición en curso, espera a esa. */
  fetch(): Promise<T>;
  /** Sustituye lo guardado, p. ej. tras un cambio hecho en la app. */
  set(value: T): void;
}

export function createResource<T>(load: () => Promise<T>, maxAgeMs: number): Resource<T> {
  let value: T | undefined;
  let loadedAt = 0;
  let inFlight: Promise<T> | null = null;

  return {
    peek: () => value,
    isFresh: () => value !== undefined && Date.now() - loadedAt < maxAgeMs,
    fetch() {
      inFlight ??= load()
        .then((v) => {
          value = v;
          loadedAt = Date.now();
          return v;
        })
        .finally(() => {
          inFlight = null;
        });
      return inFlight;
    },
    set(v) {
      value = v;
      loadedAt = Date.now();
    },
  };
}
