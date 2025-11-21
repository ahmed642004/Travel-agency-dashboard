import {
  Link,
  NavLink,
  useLoaderData,
  useNavigate,
  useNavigation,
} from "react-router";
import { sidebarItems } from "~/constants";
import { cn } from "~/lib/utils";
import { logoutUser } from "~/supabase/supabase";

const NavItems = ({ handleClick }: { handleClick?: () => void }) => {
  const user = useLoaderData();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logoutUser();
    navigate("/sign-in");
  };

  return (
    <section className="nav-items">
      <Link to="/" className="link-logo">
        <img
          src="/assets/icons/logo.svg"
          alt="Travisto Logo"
          className="size-[30px]"
        />
        <h1>Tourvisto</h1>
      </Link>
      <div className="container">
        <nav>
          {sidebarItems.map(({ id, href, label, icon }) => (
            <NavLink to={href} key={id}>
              {({ isActive }: { isActive: boolean }) => (
                <div
                  className={cn(
                    "group nav-item",
                    isActive && "bg-primary-100 !text-white",
                  )}
                  onClick={handleClick}
                >
                  <img
                    src={icon}
                    alt={label}
                    className={cn(
                      `group-hover:brightness-0 size-0 group-hover:invert ${isActive ? "brightness-0 invert" : "text-dark-200"}`,
                    )}
                  />
                  {label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>
        <footer className="nav-footer">
          <img
            src={user.user?.imageUrl || "/assets/images/david.webp"}
            alt="User Image"
            referrerPolicy="no-referrer"
          />
          <article>
            <h2>{user.user.name}</h2>
            <p>{user.user.email}</p>
          </article>
          <button className="cursor-pointer" onClick={handleLogout}>
            <img
              src="/assets/icons/logout.svg"
              alt="Logout"
              className="size-6"
            />
          </button>
        </footer>
      </div>
    </section>
  );
};
export default NavItems;
