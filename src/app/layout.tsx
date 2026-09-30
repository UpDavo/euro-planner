import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Europa 2026 · Madrid, Barcelona, Roma",
  description:
    "Itinerario día a día con mapa, horarios, precios aproximados y hospedaje.",
  // Nombre bajo el icono al guardarla en la pantalla de inicio del iPhone.
  appleWebApp: {
    title: "Europa 2026",
    capable: true,
    statusBarStyle: "default",
  },
  // Web privada del viaje: que ningún buscador la guarde. `public/_headers`
  // manda lo mismo como cabecera X-Robots-Tag para todo lo que sirve Pages.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export const viewport = {
  themeColor: "#f1f2f0",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${grotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
