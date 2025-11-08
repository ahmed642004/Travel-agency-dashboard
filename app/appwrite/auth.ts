import { ID, OAuthProvider, Query } from "appwrite";
import { account, database, appwriteConfig } from "~/appwrite/client";
import { redirect } from "react-router";

// Fetch an existing user document by Appwrite accountId
export const getExistingUser = async (id: string) => {
  try {
    const { documents, total } = await database.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", id)],
    );
    return total > 0 ? documents[0] : null;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};

// Create the user document after OAuth if it doesn't exist yet
export const storeUserData = async (
  desiredStatus: "user" | "admin" = "user",
) => {
  try {
    const user = await account.get();
    if (!user) throw new Error("User not found");

    // If a document for this account and status already exists, do nothing
    const existing = await database.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [
        Query.equal("accountId", user.$id),
        Query.equal("status", desiredStatus),
      ],
    );
    if (existing.total > 0) return existing.documents[0];

    const { providerAccessToken } = (await account.getSession("current")) || {};
    const profilePicture = providerAccessToken
      ? await getGooglePicture(providerAccessToken)
      : null;

    const createdUser = await database.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      {
        accountId: user.$id,
        email: user.email,
        name: user.name,
        imageUrl: profilePicture,
        joinedAt: new Date().toISOString(),
        status: desiredStatus,
      },
    );

    if (!createdUser.$id) redirect("/sign-in");
    return createdUser;
  } catch (error) {
    console.error("Error storing user data:", error);
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
    console.error("Error fetching Google picture:", error);
    return null;
  }
};

// Start a Google OAuth session (generic)
export const loginWithGoogle = async () => {
  try {
    if (typeof window === "undefined") return;
    account.createOAuth2Session({
      provider: OAuthProvider.Google,
      success: `${window.location.origin}/auth/callback`, // role-based redirect handled in callback
      failure: `${window.location.origin}/404`,
    });
  } catch (error) {
    console.error("Error during OAuth2 session creation:", error);
  }
};

// Start Google OAuth with explicit intent for UX (admin/client)
export const loginWithGoogleAs = async (
  intent: "admin" | "client" | "user" = "user",
) => {
  try {
    if (typeof window === "undefined") return;
    const normalized = intent === "client" ? "user" : intent; // map client → user
    const successUrl = `${window.location.origin}/auth/callback?intent=${encodeURIComponent(
      normalized,
    )}`;
    account.createOAuth2Session({
      provider: OAuthProvider.Google,
      success: successUrl,
      failure: `${window.location.origin}/404`,
    });
  } catch (error) {
    console.error("Error during OAuth2 session creation (with intent):", error);
  }
};

export const logoutUser = async () => {
  try {
    await account.deleteSession("current");
  } catch (error) {
    console.error("Error during logout:", error);
  }
};

export const getUser = async () => {
  try {
    const user = await account.get();
    if (!user) return redirect("/sign-in");

    const { documents } = await database.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [
        Query.equal("accountId", user.$id),
        Query.select([
          "name",
          "email",
          "imageUrl",
          "joinedAt",
          "accountId",
          "status",
        ]),
      ],
    );

    return documents.length > 0 ? documents[0] : redirect("/sign-in");
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};

export const getUsers = async (limit: number, offset: number) => {
  try {
    const { documents: users, total } = await database.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.limit(limit), Query.offset(offset)],
    );
    if (total === 0) return { users: [], total };
    return { users, total };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { users: [] };
  }
};
