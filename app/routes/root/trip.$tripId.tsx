import { Header } from "~/components";
import TripDetails from "~/routes/_shared/trip-details";
import type { LoaderFunctionArgs } from "react-router";
import { getAllTrips, getTripById } from "~/supabase/supabase";
import { parseTripData } from "~/lib/utils";
interface Trip {
  id: string;
  name: string;
  rating: string;
  country: string;
  imageUrls: string[];
  duration: string;
  description: string;
  travelStyle: string;
  budget: string;
  interests: string;
  groupType: string;
  estimatedPrice: string;
  bestTimeToVisit: string[];
  weatherInfo: string[];
  itinerary: Array<{
    day: number;
    location: string;
    activities: Array<{ time: string; description: string }>;
  }>;
}

interface LoaderData {
  trip: {
    tripDetail: any;
    imageUrls: string[];
    id: string;
  };
  allTrips: Trip[];
}
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { id } = params;
  if (!id) throw new Error("Trip ID is required");

  const [trip, trips] = await Promise.all([getTripById(id), getAllTrips(4, 0)]);

  return {
    trip: trip,
    allTrips: trips.allTrips.map(({ id, tripDetail, imageUrls }) => ({
      id: id,
      ...parseTripData(tripDetail),
      imageUrls: imageUrls ?? [],
    })),
  };
};
const PublicUserTrip = () => {
  return (
    <main className="travel-detail wrapper">
      <TripDetails />
    </main>
  );
};
export default PublicUserTrip;
