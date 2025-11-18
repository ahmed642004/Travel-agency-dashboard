/* app/routes/home.tsx */
import {
  Link,
  type LoaderFunctionArgs,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from "react-router";
import {
  getAllTrips,
  getUser,
  getUsersSupabase,
  logoutUser,
} from "~/supabase/supabase";
import { parseTripData } from "~/lib/utils";
import { FeaturedTripCard, Header, TripCard } from "~/components";
import { PagerComponent } from "@syncfusion/ej2-react-grids";
import { ButtonComponent } from "@syncfusion/ej2-react-buttons";
import { user } from "~/constants";

export const clientLoader = async ({ request }: LoaderFunctionArgs) => {
  const limit = 8;
  const url = new URL(request.url);
  const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10), 1);
  const offset = (page - 1) * limit;
  const featuredPromise = getAllTrips(6, 0).then((res) =>
    res.allTrips
      .map(({ tripDetail, imageUrls, id }) => ({
        ...parseTripData(tripDetail),
        imageUrls: imageUrls ?? [],
        id,
      }))
      .filter((t) => {
        const r = parseFloat(t.rating);
        return !isNaN(r) && r > 4.5 && t.imageUrls.length > 0;
      })
      .slice(0, 6),
  );
  const [user, users, trips, featuredTrips] = await Promise.all([
    getUser(),
    getUsersSupabase(10, 0),
    getAllTrips(limit, offset),
    featuredPromise,
  ]);

  return {
    total: trips.total,
    user: user,
    users,
    allTrips: trips.allTrips.map(({ tripDetail, imageUrls, id }) => ({
      ...parseTripData(tripDetail),
      imageUrls: imageUrls ?? [],
      id,
    })),
    featuredTrips,
  };
};
interface LoaderData {
  total: number;
  user: User | null;
  users: any[];
  allTrips: Trip[];
  featuredTrips: Trip[];
}
export default function Home() {
  const { total, allTrips, featuredTrips, user } =
    useLoaderData() as LoaderData;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentPage = Math.max(Number(searchParams.get("page") || "1"), 1);

  const handlePageChange = (page: number) => {
    navigate(`?page=${page}`, { replace: true });
    document.getElementById("trips")?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <>
      <main className="flex flex-col">
        {/* ────── Hero ────── */}
        <section className="travel-hero">
          <div>
            <section className="wrapper">
              <article>
                <h1 className="p-72-bold text-dark-100">
                  Plan Your Trip with Ease
                </h1>

                <p className="text-dark-100">
                  Customize your travel itinerary in minutes—pick your
                  destination, set your preferences, and explore with
                  confidence.
                </p>
              </article>

              <Link to="#trips">
                <ButtonComponent
                  type="button"
                  className="button-class !h-11 !w-full md:!w-[240px]"
                >
                  <span className="p-16-semibold text-white">Get Started</span>
                </ButtonComponent>
              </Link>
            </section>
          </div>
        </section>
        <section className="pt-20 wrapper flex flex-col gap-10">
          <Header
            title="Featured Travel Destinations"
            description="Explore top-rated destinations with our AI-generated travel plans"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[280px]">
            {/* 1 – Big card (2×2) */}
            {featuredTrips[0] && (
              <div className="md:col-span-2 md:row-span-2">
                <Link to={`/trips/${featuredTrips[0].id}`}>
                  <FeaturedTripCard
                    key={featuredTrips[0].id}
                    activityCount={190}
                    rating={parseFloat(featuredTrips[0].rating)}
                    bgImage={
                      featuredTrips[0].imageUrls[0] ??
                      "/fallback-destination.jpg"
                    }
                    title={featuredTrips[0].country}
                    bigCard
                  />
                </Link>
              </div>
            )}

            {/* 2 */}
            {featuredTrips[1] && (
              <div className="md:row-start-1">
                <Link to={`/trips/${featuredTrips[1].id}`}>
                  <FeaturedTripCard
                    key={featuredTrips[1].id}
                    activityCount={190}
                    rating={parseFloat(featuredTrips[1].rating)}
                    bgImage={
                      featuredTrips[1].imageUrls[0] ??
                      "/fallback-destination.jpg"
                    }
                    title={featuredTrips[1].country}
                  />
                </Link>
              </div>
            )}

            {/* 3 */}
            {featuredTrips[2] && (
              <div className="md:row-start-2">
                <Link to={`/trips/${featuredTrips[2].id}`}>
                  <FeaturedTripCard
                    key={featuredTrips[2].id}
                    activityCount={190}
                    rating={parseFloat(featuredTrips[2].rating)}
                    bgImage={
                      featuredTrips[2].imageUrls[0] ??
                      "/fallback-destination.jpg"
                    }
                    title={featuredTrips[2].country}
                  />
                </Link>
              </div>
            )}

            {/* 4-6 – stacked */}
            {featuredTrips.slice(3, 6).map((trip) => (
              <div key={trip.id}>
                <Link to={`/trips/${trip.id}`}>
                  <FeaturedTripCard
                    activityCount={190}
                    rating={parseFloat(trip.rating)}
                    bgImage={trip.imageUrls[0] ?? "/fallback-destination.jpg"}
                    title={trip.country}
                  />
                </Link>
              </div>
            ))}
          </div>
        </section>
        <section id="trips" className="py-20 wrapper flex flex-col gap-10">
          <Header
            title="Handpicked Trips"
            description="Browse well-planned trips designed for your travel style"
          />

          <div className="trip-grid">
            {allTrips.length === 0 ? (
              <div className="grid trip-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-64 rounded-lg bg-gray-200 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              allTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  id={trip.id}
                  name={trip.name}
                  imageUrl={trip.imageUrls[0] ?? "/fallback-trip.jpg"}
                  location={trip.itinerary?.[0]?.location ?? "Unknown"}
                  tags={
                    [trip.interests, trip.travelStyle].filter(
                      Boolean,
                    ) as string[]
                  }
                  price={trip.estimatedPrice}
                />
              ))
            )}
          </div>

          <PagerComponent
            totalRecordsCount={total}
            pageSize={8}
            currentPage={currentPage}
            click={(args) => handlePageChange(args.currentPage)}
            cssClass="!mb-4"
          />
        </section>
        {/* ────── Footer ────── */}
        <footer className="h-28 bg-white mt-auto">
          <div className="wrapper flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/assets/icons/logo.svg"
                alt="Tourvisto logo"
                className="size-[30px]"
              />
              <h1 className="text-lg font-bold">Tourvisto</h1>
            </Link>

            <div className="flex gap-6 text-sm text-gray-600">
              {["Terms & Conditions", "Privacy Policy"].map((item) => (
                <Link
                  to="/"
                  key={item}
                  className="hover:text-primary transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
