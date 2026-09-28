import TripPlanner from "@/components/TripPlanner";
import tripData from "@/data/trip.json";
import type { TripData } from "@/lib/types";

export default function Home() {
  // Los billetes no están en el JSON (el repositorio es público): llegan del
  // backend al cargar la página.
  const trip = { ...(tripData as Omit<TripData, "documents">), documents: [] };
  return <TripPlanner data={trip} />;
}
