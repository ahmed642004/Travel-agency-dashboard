import { Link, useNavigate } from "react-router";
import { logoutUser } from "~/appwrite/auth";

export default function Home() {
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logoutUser();
    navigate("/sign-in");
  };
  return (
    <main className="p-6">
      <div className="wrapper">
        <h1 className="text-2xl font-semibold text-dark-100">Home</h1>
        <p className="text-gray-600 mt-2">
          You are signed in as a regular user.
        </p>
        <div className="mt-4">
          <button
            className="text-primary-500 underline cursor-pointer"
            onClick={handleLogout}
          >
            Sign out and sign in as another user
          </button>
        </div>
      </div>
    </main>
  );
}
