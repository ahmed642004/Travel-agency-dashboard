import { redirect } from "react-router";
import { account, database, appwriteConfig } from "~/appwrite/client";
import { Query } from "appwrite";
import { storeUserData } from "~/appwrite/auth";

export async function clientLoader() {
  try {
    // Ensure there is a current authenticated account
    const current = await account.get();
    if (!current?.$id) return redirect("/sign-in");

    // Determine intent from the query string (only available client-side)
    let intent: "user" | "admin" | null = null;
    try {
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        const i = url.searchParams.get("intent");
        if (i === "user" || i === "admin") intent = i;
      }
    } catch (_) {
      // ignore URL parsing issues
    }

    // Fetch all documents for this accountId (we only need status)
    const { documents } = await database.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", current.$id), Query.select(["status"])],
    );

    const hasAdmin = documents.some((d) => d.status === "admin");
    const hasUser = documents.some((d) => d.status === "user");

    // If no doc exists at all, create a user doc by default
    if (!hasAdmin && !hasUser) {
      await storeUserData("user");
      return redirect("/home");
    }

    // Honor intent if provided.
    if (intent === "user") {
      // If a user-profile doc doesn't exist yet, create it now.
      if (!hasUser) {
        await storeUserData("user");
      }
      return redirect("/home");
    }

    if (intent === "admin") {
      // Never auto-create admin. Only redirect if admin doc exists.
      if (hasAdmin) return redirect("/dashboard");
      return redirect("/home");
    }

    // Fallback (no intent): redirect based on existing roles
    if (hasAdmin) return redirect("/dashboard");
    return redirect("/home");
  } catch (e) {
    console.error("Auth callback error:", e);
    return redirect("/sign-in");
  }
}

export default function AuthCallback() {
  // Show a spinner while the clientLoader performs redirects
  return (
    <main className="min-h-screen grid place-items-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-primary-500" />
        <p className="text-gray-600">Signing you in…</p>
      </div>
    </main>
  );
}
