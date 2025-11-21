import { redirect, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { storeUserData } from "~/supabase/supabase";
import type { UserRole } from "~/supabase/supabase";
import supabase from "~/supabase/supabase";

// Server-side loader
export async function loader({ request }: LoaderFunctionArgs) {
  return {};
}

// Client-side loader
export async function clientLoader({ request }: { request: Request }) {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const current = authData?.user;

    if (!current?.id) return redirect("/sign-in");

    const url = new URL(request.url);
    const roleParam = url.searchParams.get("role") as UserRole | null;

    // ✅ STEP 1: Sync User Data FIRST
    // We do this before checking status. If they are new, this creates the 'pending' request.
    if (roleParam === "admin" || roleParam === "user") {
      await storeUserData(roleParam);
    }

    // ✅ STEP 2: Check Admin Request Status
    // Now that storeUserData has run, we are guaranteed to find the request if it exists.
    if (roleParam === "admin") {
      const { data: requestData, error } = await supabase
        .from("admin_requests")
        .select("reqStatus")
        .eq("accountId", current.id)
        .limit(1)
        .maybeSingle();

      if (error) console.error("Supabase Error:", error);

      // If they are pending (even if they just signed up 1 second ago), stop them here.
      if (requestData?.reqStatus === "pending") {
        return { status: "pending" };
      }

      // Optional: If rejected, kick them out or send to user home
      if (requestData?.reqStatus === "rejected") {
        return redirect("/home"); // Or show a rejected message
      }
    }

    // ✅ STEP 3: Redirect if approved or normal user
    return redirect(roleParam === "admin" ? "/dashboard" : "/home");

  } catch (error) {
    console.error("Auth callback error:", error);
    return redirect("/sign-in");
  }
}

export default function AuthCallback() {
  // 4. Get the data returned from clientLoader
  const data = useLoaderData<typeof clientLoader>() as { status?: string } | undefined;

  // DEBUG 3: Check if the component received the data
  console.log("Component Data received:", data);

  // 5. Render the "Pending" Page if status is pending
  if (data?.status === "pending") {
    return (
      <main className="min-h-screen grid place-items-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8 text-center border border-gray-100">
          <div className="mx-auto w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Approval Pending</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Your request to join as an Admin is <span className="font-semibold text-yellow-600">awaiting approval</span>.
          </p>
          <div className="flex flex-col gap-3">
            <a href="/home" className="w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors">
              Continue as User
            </a>
          </div>
        </div>
      </main>
    );
  }

  // 6. Default Loading State (Seen while redirecting)
  return (
    <main className="min-h-screen grid place-items-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-primary-500" />
        <p className="text-gray-600">Processing authentication…</p>
      </div>
    </main>
  );
}