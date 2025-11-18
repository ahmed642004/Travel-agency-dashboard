import { parseTripData } from "~/lib/utils";
import supabase from "./supabase"; // adjust the import path

interface Document {
  [key: string]: any;
}

type FilterByDate = (
  items: Document[],
  key: string,
  start: string,
  end?: string,
) => number;

export const getUsersAndTripsStats = async (): Promise<DashboardStats> => {
  const d = new Date();
  const startCurrent = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
  const startPrev = new Date(
    d.getFullYear(),
    d.getMonth() - 1,
    1,
  ).toISOString();
  const endPrev = new Date(d.getFullYear(), d.getMonth(), 0).toISOString();

  // Fetch users and trips in parallel
  const [usersRes, tripsRes] = await Promise.all([
    supabase.from("users").select("*"), // replace 'users' with your table name
    supabase.from("trips").select("*"), // replace 'trips' with your table name
  ]);
  const users: Document[] = usersRes.data ?? [];
  const trips: Document[] = tripsRes.data ?? [];

  const filterByDate: FilterByDate = (items, key, start, end) =>
    items.filter((item) => item[key] >= start && (!end || item[key] <= end))
      .length;

  const filterUsersByRole = (role: string) => {
    return users.filter((u: Document) => u.status === role);
  };
  return {
    totalUsers: users.length,
    usersJoined: {
      currentMonth: filterByDate(users, "joinedAt", startCurrent),
      lastMonth: filterByDate(users, "joinedAt", startPrev, endPrev),
    },
    userRole: {
      total: filterUsersByRole("user").length,
      currentMonth: filterByDate(
        filterUsersByRole("user"),
        "joinedAt",
        startCurrent,
      ),
      lastMonth: filterByDate(
        filterUsersByRole("user"),
        "joinedAt",
        startPrev,
        endPrev,
      ),
    },
    totalTrips: trips.length,
    tripsCreated: {
      currentMonth: filterByDate(trips, "createdAt", startCurrent),
      lastMonth: filterByDate(trips, "createdAt", startPrev, endPrev),
    },
  };
};

export const getUserGrowthPerDay = async () => {
  const { data: users } = await supabase.from("users").select("*");
  const safeUsers: Document[] = users ?? [];

  const userGrowth = safeUsers.reduce(
    (acc: { [key: string]: number }, user: Document) => {
      const date = new Date(user.joinedAt);
      const day = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    },
    {},
  );

  return Object.entries(userGrowth).map(([day, count]) => ({ count, day }));
};

export const getTripsCreatedPerDay = async () => {
  const { data: trips } = await supabase.from("trips").select("*");
  const safeTrips: Document[] = trips ?? [];

  const tripsGrowth = safeTrips.reduce(
    (acc: { [key: string]: number }, trip: Document) => {
      const date = new Date(trip.created_at);
      const day = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    },
    {},
  );

  return Object.entries(tripsGrowth).map(([day, count]) => ({ count, day }));
};

export const getTripsByTravelStyle = async () => {
  const { data: trips } = await supabase.from("trips").select("*");
  const safeTrips: Document[] = trips ?? [];

  const travelStyleCounts = safeTrips.reduce(
    (acc: { [key: string]: number }, trip: Document) => {
      const rawDetails = trip.tripDetail ?? trip.tripDetails;
      const tripDetail = parseTripData(rawDetails);

      if (tripDetail?.travelStyle) {
        acc[tripDetail.travelStyle] = (acc[tripDetail.travelStyle] || 0) + 1;
      }
      return acc;
    },
    {},
  );

  return Object.entries(travelStyleCounts).map(([travelStyle, count]) => ({
    count,
    travelStyle,
  }));
};
