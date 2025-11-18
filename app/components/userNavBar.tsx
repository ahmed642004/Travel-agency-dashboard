import React from "react";
import {
  Link,
  useLoaderData,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import { logoutUser } from "~/supabase/supabase";
import { cn } from "~/lib/utils";

const userNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { user } = useLoaderData();
  const handleLogout = async () => {
    await logoutUser();
    navigate("/sign-in");
  };
  const isOnTripDetailPage = location.pathname.startsWith("/trips/");
  console.log(isOnTripDetailPage);
  return (
    <nav
      className={cn(isOnTripDetailPage ? "bg-white" : "", "w-full sticky z-50")}
    >
      <header className="root-nav wrapper">
        <Link to="/" className="link-logo">
          <img
            src="/assets/icons/logo.svg"
            alt="logo"
            className="size-[30px]"
          />
          <h1>Tourvisto</h1>
        </Link>

        <aside>
          {user.status === "admin" && (
            <Link
              to="/dashboard"
              className={cn("text-base font-normal text-white", {
                "text-dark-100": location.pathname.startsWith("/travel"),
              })}
            >
              Admin Panel
            </Link>
          )}

          <img
            src={user?.imageUrl || "/assets/images/david.wepb"}
            alt="user"
            referrerPolicy="no-referrer"
          />

          <button onClick={handleLogout} className="cursor-pointer">
            <img
              src="/assets/icons/logout.svg"
              alt="logout"
              className="size-6 rotate-180"
            />
          </button>
        </aside>
      </header>
    </nav>
  );
};
export default userNavBar;
