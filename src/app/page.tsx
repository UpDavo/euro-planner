import TripPlanner from "@/components/TripPlanner";
import tripData from "@/data/trip.json";
import type { TripData } from "@/lib/types";

export default function Home() {
  return <TripPlanner data={tripData as TripData} />;
}
