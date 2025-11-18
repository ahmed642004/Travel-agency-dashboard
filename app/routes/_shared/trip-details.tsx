// app/routes/trip.$tripId.tsx (or shared component)
import React from "react";
import { useLoaderData, redirect } from "react-router";
import { cn, getFirstWord, parseTripData } from "~/lib/utils";
import { TripCard } from "~/components";
import InfoPill from "~/components/info-pill";
import {
  ChipDirective,
  ChipListComponent,
  ChipsDirective,
} from "@syncfusion/ej2-react-buttons";
import { getAllTrips, getTripById, getUser } from "~/supabase/supabase";

// === TYPES ===
interface DayPlan {
  day: number;
  location: string;
  activities: Array<{ time: string; description: string }>;
}

interface Trip {
  id: string;
  name: string;
  rating: string;
  country: string;
  duration: string;
  description: string;
  travelStyle: string;
  budget: string;
  interests: string;
  groupType: string;
  estimatedPrice: string;
  bestTimeToVisit: string[];
  weatherInfo: string[];
  itinerary: DayPlan[];
  imageUrls: string[];
}

interface LoaderData {
  trip: {
    tripDetail: any;
    imageUrls: string[];
    id: string;
  };
  allTrips: Trip[];
  user: {
    status: string;
    name: string;
    email: string;
  };
}

export const clientLoader = async ({ params }: { params: any }) => {
  const tripId = params.tripId;

  // Get user first and handle redirect
  const user = await getUser();

  // If getUser returns null, redirect to sign-in
  if (!user) {
    throw redirect("/sign-in");
  }

  const [trip, allTrips] = await Promise.all([
    getTripById(tripId),
    getAllTrips(10, 0),
  ]);

  return {
    user,
    trip,
    allTrips: allTrips.allTrips.map(({ tripDetail, imageUrls, id }: any) => ({
      ...parseTripData(tripDetail),
      imageUrls: imageUrls ?? [],
      id,
    })),
  };
};

// === COMPONENT ===
const TripDetails = () => {
  const { trip, allTrips } = useLoaderData<LoaderData>();
  const imageUrls = trip.imageUrls ?? [];
  const tripData = parseTripData(trip.tripDetail);

  const {
    name = "",
    duration = "",
    description = "",
    travelStyle = "",
    budget = "",
    interests = "",
    itinerary = [],
    groupType = "",
    estimatedPrice = "",
    bestTimeToVisit = [],
    weatherInfo = [],
    country = "",
    rating = "0",
  } = tripData ?? {};

  const numericRating = parseFloat(rating);

  const pillItems = [
    { text: travelStyle, bg: "!bg-pink-50 !text-pink-500" },
    { text: groupType, bg: "!bg-primary-50 !text-primary-500" },
    { text: budget, bg: "!bg-success-50 !text-success-700" },
    { text: interests, bg: "!bg-navy-50 !text-navy-500" },
  ].filter((pill) => pill.text);

  const visitTimeAndWeatherInfo = [
    { title: "Best Time to Visit", items: bestTimeToVisit },
    { title: "Weather", items: weatherInfo },
  ].filter((sec) => sec.items.length > 0);

  return (
    <>
      <section className="container wrapper-md">
        {/* Header */}
        <header>
          <h1 className="p-40-semibold text-dark-100">{name}</h1>
          <div className="flex items-center gap-5">
            <InfoPill
              text={`${duration} day plan`}
              image="/assets/icons/calendar.svg"
            />
            <InfoPill
              text={
                itinerary
                  .slice(0, 4)
                  .map((item) => item.location)
                  .filter(Boolean)
                  .join(", ") || "Various locations"
              }
              image="/assets/icons/location-mark.svg"
            />
          </div>
        </header>

        {/* Gallery */}
        <section className="gallery mt-6">
          {imageUrls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`Trip image ${i + 1}`}
              className={cn(
                "w-full rounded-xl object-cover",
                i === 0
                  ? "md:col-span-2 md:row-span-2 h-[330px]"
                  : "md:col-span-1 md:row-span-1 h-[150px]",
              )}
            />
          ))}
        </section>

        {/* Pills + Rating */}
        <section className="flex gap-3 md:gap-5 items-center flex-wrap mt-6">
          <ChipListComponent id="travel-chip">
            <ChipsDirective>
              {pillItems.map((pill, index) => (
                <ChipDirective
                  key={index}
                  text={getFirstWord(pill.text)}
                  cssClass={`${pill.bg} !text-base !font-medium !px-4`}
                />
              ))}
            </ChipsDirective>
          </ChipListComponent>

          {/* Star Rating */}
          <ul className="flex gap-1 items-center">
            {Array.from({ length: 5 }, (_, i) => {
              const filled = i + 1 <= Math.floor(numericRating);
              const half =
                !filled && i < numericRating && numericRating < i + 1;

              return (
                <li key={i}>
                  <img
                    src={
                      filled
                        ? "/assets/icons/star.svg"
                        : half
                          ? "/assets/icons/star-half.svg"
                          : "/assets/icons/star-empty.svg"
                    }
                    alt="Star"
                    className="size-[18px]"
                  />
                </li>
              );
            })}

            <li className="ml-1">
              <ChipListComponent>
                <ChipsDirective>
                  <ChipDirective
                    text={`${rating}/5`}
                    cssClass="!bg-yellow-50 !text-red-500"
                  />
                </ChipsDirective>
              </ChipListComponent>
            </li>
          </ul>
        </section>

        {/* Title + Price */}
        <section className="title flex justify-between items-start mt-6">
          <article>
            <h3 className="p-24-semibold">
              {duration}-Day {country} {travelStyle} Trip
            </h3>
            <p className="text-dark-400">
              {budget}, {groupType} and {interests}
            </p>
          </article>
          <h2 className="p-32-bold text-primary-500">{estimatedPrice}</h2>
        </section>

        {/* Description */}
        <p className="text-sm md:text-lg font-normal text-dark-400 mt-4">
          {description}
        </p>

        {/* Itinerary */}
        <ul className="itinerary mt-8 space-y-6">
          {itinerary.map((dayPlan, index) => (
            <li key={index} className="border-b pb-4 last:border-0">
              <h3 className="p-20-semibold text-dark-100">
                Day {dayPlan.day}: {dayPlan.location}
              </h3>
              <ul className="mt-3 space-y-2">
                {dayPlan.activities.map((activity, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 p-18-semibold text-primary-500">
                      {activity.time}
                    </span>
                    <p className="flex-grow text-dark-400">
                      {activity.description}
                    </p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        {/* Best Time & Weather */}
        {visitTimeAndWeatherInfo.map((section) => (
          <section key={section.title} className="visit mt-8">
            <h3 className="p-20-semibold text-dark-100 mb-3">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary-500 mt-1">•</span>
                  <p className="flex-grow text-dark-400">{item}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </section>

      {/* Popular Trips */}
      <section className="flex flex-col gap-6 mt-12">
        <h2 className="p-24-semibold text-dark-100">Popular Trips</h2>
        <div className="trip-grid">
          {allTrips.map((t) => (
            <TripCard
              key={t.id}
              id={t.id}
              name={t.name}
              location={t.itinerary?.[0]?.location ?? ""}
              imageUrl={t.imageUrls[0] ?? "/fallback-trip.jpg"}
              tags={[t.interests, t.travelStyle].filter(Boolean) as string[]}
              price={t.estimatedPrice}
            />
          ))}
        </div>
      </section>
    </>
  );
};

export default TripDetails;
