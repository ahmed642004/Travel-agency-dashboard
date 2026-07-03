import { redirect } from "react-router";

export async function clientLoader() {
  return redirect("/home");
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
