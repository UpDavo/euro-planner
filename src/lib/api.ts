// Se incrustan al compilar (`next build`): en Cloudflare Pages tienen que
// existir antes del build, y hay que escribirlas literalmente para que Next
// las sustituya.
export const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
const API_KEY = process.env.NEXT_PUBLIC_TRIP_API_KEY;

/** Si hay backend: sin él, la app funciona sola con lo que trae el JSON. */
export const hasBackend = Boolean(API_URL);

/** Llama al backend de Django con la clave del viaje. */
export async function api(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(`${API_URL}/api/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { "X-Trip-Key": API_KEY } : {}),
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string;
      detail?: string;
    } | null;
    throw new Error(body?.error ?? body?.detail ?? `El servidor respondió ${res.status}.`);
  }
  return res.status === 204 ? null : res.json();
}

/**
 * URL para abrir un archivo del backend desde un enlace. Un enlace no puede
 * mandar cabeceras, así que la clave va en `?key=`.
 */
export function apiFileUrl(path: string): string {
  const url = `${API_URL}${path}`;
  return API_KEY ? `${url}?key=${encodeURIComponent(API_KEY)}` : url;
}
