"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { City, Day, Stop } from "@/lib/types";

function pinIcon(label: string, accent: string, active: boolean) {
  return L.divIcon({
    className: "trip-pin",
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:${active ? 30 : 24}px;height:${active ? 30 : 24}px;
      border-radius:999px;
      background:${active ? accent : "#fbfaf7"};
      color:${active ? "#fbfaf7" : "#16181d"};
      border:2px solid ${accent};
      font:600 ${active ? 13 : 11}px/1 var(--font-inter, system-ui);
      font-variant-numeric:tabular-nums;
      box-shadow:0 1px 4px rgba(22,24,29,.35);
      transition:width .15s,height .15s;
    ">${label}</div>`,
    iconSize: [active ? 30 : 24, active ? 30 : 24],
    iconAnchor: [active ? 15 : 12, active ? 15 : 12],
  });
}

function stayIcon(accent: string) {
  return L.divIcon({
    className: "trip-pin",
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:28px;height:28px;border-radius:4px;
      background:#16181d;color:#fbfaf7;
      border:2px solid ${accent};
      box-shadow:0 1px 4px rgba(22,24,29,.4);
    "><span style="font-size:14px" class="ri-home-4-fill"></span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
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
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, {
      padding: [56, 56],
      maxZoom: 15,
      animate: true,
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
    if (!stop) return;
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
    if (near.length <= 2) {
      const far = all.filter((c) => !near.includes(c));
      return far.length > 0 ? far : all;
    }
    return near;
  }, [city.stay.coords, city.center, day.stops]);

  const route = useMemo<[number, number][]>(
    () => day.stops.map((s) => s.coords),
    [day.stops],
  );

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
    <MapContainer
      center={city.center}
      zoom={city.zoom}
      scrollWheelZoom
      zoomControl={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />
      <FitBounds points={points} activeId={activeStopId} />
      <FlyToActive stop={activeStop} />

      {/* Halo blanco bajo la ruta: la separa de las calles de color del mapa */}
      <Polyline
        positions={route}
        pathOptions={{
          color: "#ffffff",
          weight: 7,
          opacity: 0.9,
          lineCap: "round",
        }}
      />
      <Polyline
        positions={route}
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
    </MapContainer>
  );
}
