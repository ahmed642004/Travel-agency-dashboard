import { Outlet } from "react-router";
import UserNavBar from "~/components/userNavBar";
import { getCurrentUserProfile } from "~/supabase/supabase";
import { UserProvider } from "~/context/userContext";
import type { Route } from "./+types/page-layout";

export async function clientLoader() {
  try {
    const user = await getCurrentUserProfile();
    return { user };
  } catch (e) {
    console.error("Error fetching user:", e);
    return { user: null };
  }
}

const PageLayout = ({ loaderData }: Route.ComponentProps) => {
  const user = loaderData.user as User | null;

  return (
    <UserProvider user={user}>
      <div className="bg-light-200">
        <UserNavBar />
        <Outlet />
      </div>
    </UserProvider>
  );
};

export default PageLayout;
