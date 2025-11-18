import { Header, StatsCard, TripCard } from "~/components";
import { getUser, getUsersSupabase } from "~/supabase/supabase";
import type { Route } from "./+types/dashboard";
import {
  getTripsByTravelStyle,
  getUserGrowthPerDay,
  getUsersAndTripsStats,
} from "~/supabase/dashboard";
import { getAllTrips } from "~/supabase/supabase";
import { parseTripData } from "~/lib/utils";
import {
  Category,
  ChartComponent,
  ColumnSeries,
  DataLabel,
  SeriesCollectionDirective,
  SeriesDirective,
  SplineAreaSeries,
  Tooltip,
} from "@syncfusion/ej2-react-charts";
import { Inject } from "@syncfusion/ej2-react-charts";
import { tripXAxis, tripyAxis, users, userXAxis, useryAxis } from "~/constants";
import {
  ColumnDirective,
  ColumnsDirective,
  GridComponent,
} from "@syncfusion/ej2-react-grids";

export const clientLoader = async () => {
  const [
    user,
    dashboardStats,
    trips,
    userGrowth,
    tripsByTravelStyle,
    allUsers,
  ] = await Promise.all([
    await getUser(),
    await getUsersAndTripsStats(),
    await getAllTrips(4, 0),
    await getUserGrowthPerDay(),
    await getTripsByTravelStyle(),
    await getUsersSupabase(4, 0),
  ]);
  const allTrips = trips.allTrips.map(({ id, tripDetail, imageUrls }) => ({
    id: id,
    ...parseTripData(tripDetail),
    imageUrls: imageUrls ?? [],
  }));
  const mappedUsers: UsersItineraryCount[] = allUsers.users.map((user) => ({
    imageUrl: user.imageUrl,
    name: user.name,
    count: user.itineraryCount,
  }));
  return {
    user,
    dashboardStats,
    allTrips,
    userGrowth,
    tripsByTravelStyle,
    allUsers: mappedUsers,
  };
};
export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const user = loaderData.user as User | null;
  const { dashboardStats, allTrips, userGrowth, tripsByTravelStyle, allUsers } =
    loaderData;
  const trips = allTrips.map((trip) => ({
    imageUrl: trip.imageUrls[0],
    name: trip.name,
    interests: trip.interests,
  }));
  const usersAndTrips = [
    {
      title: "Latest user signups",
      dataSource: allUsers,
      field: "count",
      headerText: "Trips Created",
    },
    {
      title: "Trips based on interests",
      dataSource: trips,
      field: "interests",
      headerText: "Interests",
    },
  ];

  return (
    <div className="dashboard wrapper">
      <Header
        title={`Welcome, ${user?.name}`}
        description="Track activity, trends and popular destinations in real time"
      />

      <section className="flex flex-col gap-6 w-full md:flex-row ">
        <StatsCard
          headerTitle="Total users"
          total={dashboardStats.totalUsers}
          currentMonthCount={dashboardStats.usersJoined.currentMonth}
          lastMonthCount={dashboardStats.usersJoined.lastMonth}
        />
        <StatsCard
          headerTitle="Total trips"
          total={dashboardStats.totalTrips}
          currentMonthCount={dashboardStats.tripsCreated.currentMonth}
          lastMonthCount={dashboardStats.tripsCreated.lastMonth}
        />
        <StatsCard
          headerTitle="Active users today"
          total={dashboardStats.userRole.total}
          currentMonthCount={dashboardStats.userRole.currentMonth}
          lastMonthCount={dashboardStats.userRole.lastMonth}
        />
      </section>
      <section className="container">
        <h1 className="text-xl font-semibold text-dark-100">Created Trips</h1>
        <div className="trip-grid">
          {allTrips.map((trip) => (
            <TripCard
              key={trip.name}
              id={trip.id.toString()}
              name={trip.name!}
              imageUrl={trip.imageUrls[0]}
              location={trip.itinerary?.[0]?.location ?? ""}
              tags={[trip.interests!, trip.travelStyle!]}
              price={trip.estimatedPrice!}
              userRole={user?.status}
            />
          ))}
        </div>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ChartComponent
          id="chart-1"
          primaryXAxis={userXAxis}
          primaryYAxis={useryAxis}
          title="User Growth"
          tooltip={{ enable: true }}
        >
          <Inject
            services={[
              ColumnSeries,
              SplineAreaSeries,
              Category,
              DataLabel,
              Tooltip,
            ]}
          />
          <SeriesCollectionDirective>
            <SeriesDirective
              dataSource={userGrowth}
              xName="day"
              yName="count"
              type="Column"
              name="Column"
              columnWidth={0.3}
              cornerRadius={{ topLeft: 10, topRight: 10 }}
            />
            <SeriesDirective
              dataSource={userGrowth}
              xName="day"
              yName="count"
              type="SplineArea"
              name="Wave"
              fill="rgba(71, 132, 238, 0.3)"
              border={{ width: 2, color: "#4784EE" }}
            />
          </SeriesCollectionDirective>
        </ChartComponent>
        <ChartComponent
          id="chart-2"
          primaryXAxis={tripXAxis}
          primaryYAxis={tripyAxis}
          title="Trip Trends"
          tooltip={{ enable: true }}
        >
          <Inject
            services={[
              ColumnSeries,
              SplineAreaSeries,
              Category,
              DataLabel,
              Tooltip,
            ]}
          />
          <SeriesCollectionDirective>
            <SeriesDirective
              dataSource={tripsByTravelStyle}
              xName="travelStyle"
              yName="count"
              type="Column"
              name="day"
              columnWidth={0.3}
              cornerRadius={{ topLeft: 10, topRight: 10 }}
            />
          </SeriesCollectionDirective>
        </ChartComponent>
      </section>
      <section className="user-trip wrapper">
        {usersAndTrips.map(
          ({ title, dataSource, field, headerText }, index) => (
            <div key={index} className="flex flex-col gap-5">
              <h3 className="p-20-semibold text-dark-100">{title}</h3>
              <GridComponent dataSource={dataSource} gridLines="None">
                <ColumnsDirective>
                  <ColumnDirective
                    field="name"
                    headerText="Name"
                    width="200"
                    textAlign="Left"
                    template={(props: UserData) => (
                      <div className="flex items-center gap-1.5 px-4">
                        <img
                          src={props.imageUrl}
                          alt="User"
                          className="rounded-full size-8 aspect-square"
                          referrerPolicy="no-referrer"
                        />
                        <span>{props.name}</span>
                      </div>
                    )}
                  />
                  <ColumnDirective
                    field={field}
                    headerText={headerText}
                    width="250"
                    textAlign="Left"
                  />
                </ColumnsDirective>
              </GridComponent>
            </div>
          ),
        )}
      </section>
    </div>
  );
}
