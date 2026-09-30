import type { MetadataRoute } from "next";

// No se bloquea el rastreo: si un buscador no puede leer la página, tampoco ve
// el `noindex` y podría indexar la URL igual si alguien la enlaza. El bloqueo
// real lo hacen la meta robots del layout y la cabecera de `public/_headers`.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" } };
}
