import { Outlet, redirect, useLoaderData } from "react-router";
import { SidebarComponent } from "@syncfusion/ej2-react-navigations";
import {
  getExistingUser,
  requireAuthenticatedAccountId,
} from "~/supabase/supabase";
import { MobileSidebar, NavItems } from "~/components";
import { UserProvider } from "~/context/userContext";

export async function clientLoader() {
  try {
    const accountId = await requireAuthenticatedAccountId();
    const existingUser = await getExistingUser(accountId);
    if (!existingUser) return redirect("/");
    if (existingUser.status === "user") {
      return redirect("/");
    }
    if (existingUser.request_status === "pending") {
      return redirect("/auth/callback?role=admin");
    }
    return { user: existingUser };
  } catch (e) {
    console.log("Error in clientLoader", e);
    return redirect("/sign-in");
  }
}

const AdminLayout = () => {
  const { user } = useLoaderData<typeof clientLoader>();
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
