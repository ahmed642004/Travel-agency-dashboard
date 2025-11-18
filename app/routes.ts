import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/root/index.tsx"),
  route("sign-in", "routes/root/Sign-in.tsx"),
  route("auth/callback", "routes/root/auth/callback.tsx"),
  route("api/create-trip", "routes/api/create-trip.ts"),
  layout("routes/admin/admin-layout.tsx", [
    route("dashboard", "routes/admin/dashboard.tsx"),
    route("all-users", "routes/admin/all-users.tsx"),
    route("trips", "routes/admin/trips.tsx"),
    route("trips/create", "routes/admin/create-trip.tsx"),
    route("admin/trips/:id", "routes/admin/trip.$tripId.tsx"),
  ]),
  layout("routes/root/page-layout.tsx", [
    route("home", "routes/root/home.tsx"),
    route("trips/:id", "routes/root/trip.$tripId.tsx"),
  ]),
] satisfies RouteConfig;
