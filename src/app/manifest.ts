import type { MetadataRoute } from "next";

// Lo que usa Android al "Añadir a pantalla de inicio": nombre, icono y que abra
// sin la barra del navegador. iPhone usa `apple-icon.png` y `appleWebApp`.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Europa 2026 · Madrid, Barcelona, Roma",
    short_name: "Europa 2026",
    start_url: "/",
    display: "standalone",
    background_color: "#f1f2f0",
    theme_color: "#f1f2f0",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
