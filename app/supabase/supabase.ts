import { createClient } from "@supabase/supabase-js";
import type { Provider } from "@supabase/supabase-js";
import { redirect } from "react-router";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const supabase = createClient(supabaseUrl, supabaseKey);

// Fetch an existing user row by Supabase auth user id
export const getExistingUser = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("accountId", id)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  } catch (error) {
    console.error("Supabase: Error fetching user", error);
    return null;
  }
};

// Internal helper: fetch a Google profile photo using People API
const getGooglePicture = async (accessToken: string) => {
  try {
    const response = await fetch(
      "https://people.googleapis.com/v1/people/me?personFields=photos",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!response.ok) throw new Error("Failed to fetch Google profile picture");
    const { photos } = await response.json();
    return photos?.[0]?.url || null;
  } catch (error) {
    console.error("Supabase: Error fetching Google picture", error);
    return null;
  }
};

// Create the user row after OAuth if it doesn't exist yet
export type UserRole = "admin" | "user";

export const storeUserData = async (desiredStatus: UserRole) => {
  try {
    const { data: authData, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;

    const user = authData?.user;
    if (!user) throw new Error("User not found");

    // Try to get provider access token and avatar
    const { data: sessionData } = await supabase.auth.getSession();
    const providerToken = sessionData?.session?.provider_token as
      | string
      | undefined;

    let profilePicture: string | null = null;
    if (providerToken) {
      // profilePicture = await getGooglePicture(providerToken);
    }
    profilePicture ||= user.user_metadata?.avatar_url ?? null;

    const payload = {
      accountId: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email,
      imageUrl: profilePicture,
      joinedAt: new Date().toISOString(),
      status: desiredStatus,
    };

    // ✅ 1. Check if user already exists
    const { data: existing, error: selectError } = await supabase
      .from("users")
      .select("accountId")
      .eq("accountId", user.id)
      .maybeSingle();

    if (selectError) throw selectError;

    if (existing) {
      // ✅ 2. Update only if status changed
      const { data: updated, error: updateError } = await supabase
        .from("users")
        .update({ status: desiredStatus })
        .eq("accountId", user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return updated;
    }
    if (!existing) {
      // ✅ 3. Insert only if not found
      const { data: inserted, error: insertError } = await supabase
        .from("users")
        .insert(payload)
        .select()
        .single();

      if (insertError) throw insertError;

      return inserted;
    }
  } catch (error) {
    console.error("Supabase: Error storing user data", error);
    return null;
  }
};

// Start a Google OAuth session (generic)
export const loginWithGoogleSupa = async (role: "admin" | "user" = "user") => {
  try {
    if (typeof window === "undefined") return;
    await supabase.auth.signInWithOAuth({
      provider: "google" as Provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?role=${role}`,
        queryParams: {
          // Ask for basic profile so we can fetch avatar via People API if needed
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  } catch (error) {
    console.error("Supabase: Error during OAuth sign-in", error);
  }
};

// Start Google OAuth with explicit intent for UX (admin/client)
// export const loginWithGoogleAsSupa = async (
//   intent: "admin" | "user" = "user",
// ) => {
//   try {
//     if (typeof window === "undefined") return;
//     const normalized = intent === "user" ? "user" : intent;
//     const successUrl = `${window.location.origin}/auth/callback?intent=${encodeURIComponent(
//       normalized,
//     )}`;
//     await supabase.auth.signInWithOAuth({
//       provider: "google" as Provider,
//       options: {
//         redirectTo: successUrl,
//         queryParams: {
//           access_type: "offline",
//           prompt: "consent",
//         },
//       },
//     });
//   } catch (error) {
//     console.error("Supabase: Error during OAuth sign-in (with intent)", error);
//   }
// };

export const logoutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error("Supabase: Error during logout", error);
  }
};

export const getUser = async () => {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) return redirect("/sign-in");

    const { data, error } = await supabase
      .from("users")
      .select("name, email, imageUrl, joinedAt, accountId, status")
      .eq("accountId", user.id)
      .single();

    if (error) throw error;
    return data ?? redirect("/sign-in");
  } catch (error) {
    console.error("Supabase: Error fetching user", error);
    return null;
  }
};

export const getUsersSupabase = async (limit: number, offset: number) => {
  try {
    const start = offset;
    const end = offset + Math.max(0, limit) - 1;
    const { data, error, count } = await supabase
      .from("users")
      .select("*", { count: "exact" })
      .range(start, end);

    if (error) throw error;
    return { users: data ?? [], total: count ?? 0 };
  } catch (error) {
    console.error("Supabase: Error fetching users", error);
    return { users: [] as any[], total: 0 };
  }
};
export const getAllTrips = async (limit: number, offset: number) => {
  const { data, count, error } = await supabase
    .from("trips") // replace with your actual table name
    .select("*", { count: "exact" })
    .range(offset, offset + limit - 1) // Supabase uses range(start, end)
    .order("createdAt", { ascending: false }); // optional: order by latest

  if (error) {
    console.error("Error fetching trips:", error);
    return { allTrips: [], total: 0 };
  }

  if (!data || data.length === 0) {
    console.log("No trips found");
    return { allTrips: [], total: 0 };
  }

  // Correct keys
  const allTrips = data;
  const total = count || 0;

  return { allTrips, total };
};
export const getTripById = async (tripId: string) => {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .single(); // returns a single row

  if (error) {
    console.log("Error fetching trip:", error.message);
    return null;
  }

  if (!data) {
    console.log("Trip not found");
    return null;
  }

  return data;
};

export default supabase;
