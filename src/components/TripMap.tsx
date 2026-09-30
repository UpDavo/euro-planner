"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  LeafletContext,
  createLeafletContext,
  type LeafletContextInterface,
} from "@react-leaflet/core";
import {
  Marker,
  Polyline,
  TileLayer,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { City, Day, Stop } from "@/lib/types";
import { accentPalette } from "@/lib/utils";

function pinIcon(label: string, accent: string, active: boolean) {
  const p = accentPalette(accent);
  const size = active ? 32 : 26;
  return L.divIcon({
    className: "trip-pin",
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:${size}px;height:${size}px;
      border-radius:999px;
      background:${active ? p.solid : "#ffffff"};
      color:${active ? "#ffffff" : p.ink};
      font:700 ${active ? 13 : 12}px/1 var(--font-grotesk, var(--font-inter, system-ui));
      font-variant-numeric:tabular-nums;
      box-shadow:${
        active
          ? `0 0 0 5px color-mix(in oklab, ${accent} 28%, transparent), 0 6px 16px -4px rgba(20,23,26,.35)`
          : `0 1px 2px rgba(20,23,26,.08), 0 6px 16px -6px rgba(20,23,26,.25)`
      };
      transition:width .15s,height .15s;
    ">${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function stayIcon(accent: string) {
  const p = accentPalette(accent);
  return L.divIcon({
    className: "trip-pin",
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:30px;height:30px;border-radius:10px;
      background:${p.deep};color:#ffffff;
      box-shadow:0 1px 2px rgba(20,23,26,.08), 0 6px 16px -6px rgba(20,23,26,.3);
    "><span style="font-size:15px" class="ri-home-4-fill"></span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

/**
 * Sustituye a `MapContainer` de react-leaflet 5.0.0, que al desmontar hace
 * `map.remove()` pero conserva la instancia en un ref: cuando StrictMode o Fast
 * Refresh vuelven a montar los efectos, las capas se añaden a un mapa ya
 * destruido ("Cannot read properties of undefined (reading 'appendChild')").
 * Aquí el mapa nace y muere con el efecto, y los hijos se remontan con él.
 */
function MapShell({
  center,
  zoom,
  className,
  children,
}: {
  center: [number, number];
  zoom: number;
  className?: string;
  children: ReactNode;
}) {
  const node = useRef<HTMLDivElement>(null);
  const [context, setContext] = useState<LeafletContextInterface | null>(null);

  useEffect(() => {
    const map = L.map(node.current!, {
      center,
      zoom,
      scrollWheelZoom: true,
      zoomControl: false,
    });
    setContext(createLeafletContext(map));
    return () => {
      setContext(null);
      map.remove();
    };
    // El centro inicial sólo importa al crear el mapa; luego encuadra FitBounds.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={node} className={className}>
      {context ? (
        <LeafletContext value={context}>{children}</LeafletContext>
      ) : null}
    </div>
  );
}

function FitBounds({
  points,
  activeId,
}: {
  points: [number, number][];
  activeId: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    // El mapa de escritorio sigue montado en móvil con display:none: sin
    // tamaño, Leaflet calcula un zoom NaN.
    if (points.length === 0 || map.getSize().x === 0) return;
    const bounds = L.latLngBounds(points);
    // Animar sólo dentro de la misma zona: saltar de Madrid a Roma animado
    // mezcla tiles de dos zooms a la vez y el navegador deja huecos sin pintar.
    map.fitBounds(bounds, {
      padding: [56, 56],
      maxZoom: 15,
      animate: map.getBounds().intersects(bounds),
    });
    // Sólo re-encuadra al cambiar de día, no al seleccionar una parada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points)]);

  useEffect(() => {
    if (!activeId) return;
    // El zoom a la parada activa lo maneja FlyToActive.
  }, [activeId]);

  return null;
}

function FlyToActive({ stop }: { stop: Stop | null }) {
  const map = useMap();
  useEffect(() => {
    if (!stop || map.getSize().x === 0) return;
    map.flyTo(stop.coords, Math.max(map.getZoom(), 15), { duration: 0.7 });
  }, [stop, map]);
  return null;
}

interface Props {
  city: City;
  day: Day;
  activeStopId: string | null;
  onSelectStop: (stop: Stop) => void;
  onSelectStay: () => void;
}

export default function TripMap({
  city,
  day,
  activeStopId,
  onSelectStop,
  onSelectStay,
}: Props) {
  // Un día puede empezar lejos (el AVE sale de Atocha, el tren de Toledo de
  // Atocha). Si encuadráramos todas las paradas, el mapa se alejaría a media
  // España y el recorrido a pie quedaría en un punto. Encuadramos solo las
  // paradas del núcleo donde se camina, y si el día entero transcurre fuera
  // (Toledo, Segovia) encuadramos ese grupo.
  const points = useMemo<[number, number][]>(() => {
    const all: [number, number][] = [
      city.stay.coords,
      ...day.stops.map((s) => s.coords),
    ];
    // ~12 km. Deja fuera los aeropuertos (Fiumicino está a 30 km de Roma,
    // Barajas a 15 de Madrid) sin partir el casco urbano.
    const near = all.filter(
      ([lat, lng]) =>
        Math.abs(lat - city.center[0]) < 0.11 &&
        Math.abs(lng - city.center[1]) < 0.15,
    );
    // El día se desarrolla fuera de la ciudad: encuadrar las paradas lejanas.
    // La excursión a Florencia deja tres anclas en Roma (los dos trenes en
    // Termini y la cena en Monti) y diez paradas fuera, así que no basta
    // con mirar si quedan dos o menos cerca: manda dónde está la mayoría.
    const far = all.filter((c) => !near.includes(c));
    // Con la base fuera de la ciudad (Ciempozuelos, a 30 km de Madrid) el día
    // es justamente el trayecto entre ella y lo de dentro: encuadrar todo.
    if (!near.includes(city.stay.coords)) return all;
    if (far.length > near.length) return far;
    return near.length > 0 ? near : all;
  }, [city.stay.coords, city.center, day.stops]);

  // Tramos a pie y en transporte por separado: el que llega a una parada de
  // transporte es el trayecto en tren, taxi o avión, no una caminata.
  const legs = useMemo(() => {
    const walk: [number, number][][] = [];
    const ride: [number, number][][] = [];
    day.stops.slice(1).forEach((s, i) =>
      (s.type === "transport" ? ride : walk).push([
        day.stops[i].coords,
        s.coords,
      ]),
    );
    return { walk, ride };
  }, [day.stops]);

  const stayOverlaps = useMemo(
    () =>
      day.stops.some(
        (s) =>
          Math.abs(s.coords[0] - city.stay.coords[0]) < 0.0004 &&
          Math.abs(s.coords[1] - city.stay.coords[1]) < 0.0004,
      ),
    [day.stops, city.stay.coords],
  );

  const activeStop = day.stops.find((s) => s.id === activeStopId) ?? null;

  return (
    <MapShell center={city.center} zoom={city.zoom} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />
      <FitBounds points={points} activeId={activeStopId} />
      <FlyToActive stop={activeStop} />

      {/* Halo blanco bajo la ruta: la separa de las calles de color del mapa */}
      <Polyline
        positions={legs.ride}
        pathOptions={{
          color: city.accent,
          weight: 2,
          opacity: 0.45,
          lineCap: "round",
        }}
      />
      <Polyline
        positions={legs.walk}
        pathOptions={{
          color: "#ffffff",
          weight: 7,
          opacity: 0.9,
          lineCap: "round",
        }}
      />
      <Polyline
        positions={legs.walk}
        pathOptions={{
          color: city.accent,
          weight: 3,
          opacity: 1,
          dashArray: "1 8",
          lineCap: "round",
        }}
      />

      {/* El pin de la base se omite cuando una parada ya ocupa esas coordenadas */}
      {stayOverlaps ? null : (
        <Marker
          position={city.stay.coords}
          icon={stayIcon(city.accent)}
          eventHandlers={{ click: onSelectStay }}
          zIndexOffset={100}
        />
      )}

      {day.stops.map((stop, i) => (
        <Marker
          key={stop.id}
          position={stop.coords}
          icon={pinIcon(String(i + 1), city.accent, stop.id === activeStopId)}
          eventHandlers={{ click: () => onSelectStop(stop) }}
          zIndexOffset={stop.id === activeStopId ? 600 : 300}
        />
      ))}
    </MapShell>
  );
}
