import { redirect } from "react-router";
import { account, database, appwriteConfig } from "~/appwrite/client";
import { Query } from "appwrite";

export async function clientLoader() {
  try {
    // If no authenticated Appwrite account, send to sign-in
    const current = await account.get();
    if (!current?.$id) return redirect("/sign-in");

    // Fetch user role documents for this account
    const { documents } = await database.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", current.$id), Query.select(["status"])],
    );

    const hasAdmin = documents.some((d) => d.status === "admin");

    // Redirect based on role
    if (hasAdmin) return redirect("/dashboard");
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
