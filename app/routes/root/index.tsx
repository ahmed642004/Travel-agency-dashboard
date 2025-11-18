import { redirect } from "react-router";
import supabase from "~/supabase/supabase";

export async function clientLoader() {
  try {
    // If no authenticated Supabase user, send to sign-in
    const { data: authData } = await supabase.auth.getUser();
    const current = authData?.user;
    if (!current?.id) return redirect("/sign-in");

    return redirect("/home");
  } catch (e) {
    console.error("Root index redirect error:", e);
    return redirect("/sign-in");
  }
}

export default function Index() {
  // Show a lightweight spinner while the loader decides where to redirect
  return (
    <main className="min-h-screen grid place-items-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-primary-500" />
        <p className="text-gray-600">Redirecting…</p>
      </div>
    </main>
  );
}
