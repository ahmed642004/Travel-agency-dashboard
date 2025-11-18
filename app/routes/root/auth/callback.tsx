import { redirect, type LoaderFunctionArgs } from "react-router";
import { storeUserData } from "~/supabase/supabase";
import type { UserRole } from "~/supabase/supabase";
import supabase from "~/supabase/supabase";

// Server-side loader - required for initial GET requests
export async function loader({ request }: LoaderFunctionArgs) {
  // Return empty data - actual auth handling happens in clientLoader
  return {};
}

export async function clientLoader({ request }: { request: Request }) {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const current = authData?.user;
    if (!current?.id) return redirect("/sign-in");

    const url = new URL(request.url);
    const roleParam = url.searchParams.get("role") as UserRole | null;

    if (roleParam === "admin" || roleParam === "user") {
      await storeUserData(roleParam);
      return redirect(roleParam === "admin" ? "/dashboard" : "/home");
    }

    return redirect("/home");
  } catch (error) {
    console.error("Auth callback error:", error);
    return redirect("/sign-in");
  }
}

export default function AuthCallback() {
  // This component will rarely be seen since the loader redirects,
  // but it's required by React Router
  return (
    <main className="min-h-screen grid place-items-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-primary-500" />
        <p className="text-gray-600">Processing authentication…</p>
      </div>
    </main>
  );
}

