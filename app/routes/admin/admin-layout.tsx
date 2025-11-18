import { Outlet, redirect, useLoaderData } from "react-router";
import { SidebarComponent } from "@syncfusion/ej2-react-navigations";
import supabase from "~/supabase/supabase";
import { getExistingUser } from "~/supabase/supabase";
import { MobileSidebar, NavItems } from "~/components";
import { UserProvider } from "~/context/userContext"; // ✅ Add this import

export async function clientLoader() {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData?.user;
    if (!authUser?.id) return redirect("/sign-in");

    const existingUser = await getExistingUser(authUser.id);
    if (!existingUser) return redirect("/");
    if (existingUser.status === "user") {
      return redirect("/");
    }

    return { user: existingUser }; // ✅ Return as object with user key
  } catch (e) {
    console.log("Error in clientLoader", e);
    return redirect("/sign-in");
  }
}

const AdminLayout = () => {
  const { user } = useLoaderData<typeof clientLoader>(); // ✅ Get user from loader
  console.log(user);
  return (
    <UserProvider user={user}>
      <div className="admin-layout">
        <MobileSidebar />

        <aside className="w-full max-w-[270px] hidden lg:block">
          <SidebarComponent width={270} enableGestures={false}>
            <NavItems />
          </SidebarComponent>
        </aside>

        <aside className="children">
          <Outlet />
        </aside>
      </div>
    </UserProvider>
  );
};

export default AdminLayout;
