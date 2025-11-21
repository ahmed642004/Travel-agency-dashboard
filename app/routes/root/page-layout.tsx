import { Outlet, redirect, useLoaderData } from "react-router";
import type { ReactNode } from "react"; // Add this if you get type errors
import UserNavBar from "~/components/userNavBar";
import supabase, { getExistingUser, getUser } from "~/supabase/supabase";
import { UserProvider } from "~/context/userContext"; // ✅ Add this import
import type { Route } from "./+types/home";

export async function clientLoader() {
  try {
    const { data: authData, error } = await supabase.auth.getUser();
    if (error) throw error;

    const current = authData?.user;
    if (!current?.id) return redirect("/sign-in");

    const existingUser = await getExistingUser(current.id);
    if (!existingUser) return redirect("/");
    const user = await getUser();
    return { user };
  } catch (e) {
    console.error("Error fetching user:", e);
    return redirect("/sign-in");
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
