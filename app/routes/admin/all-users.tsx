import { Header } from "~/components";
import {
  ColumnDirective,
  ColumnsDirective,
  GridComponent,
} from "@syncfusion/ej2-react-grids";
import supabase, { getUsersSupabase } from "~/supabase/supabase";
import type { Route } from "./+types/all-users";
import { cn, formatDate } from "~/lib/utils";

// Interface for type safety (adjust fields based on your actual data)
interface UserData {
  id: string;
  accountId: string; // Assuming this exists in your data based on your handleApprove logic
  name: string;
  email: string;
  joinedAt: string;
  imageUrl: string;
  status: "user" | "admin" | "rejected";
  request_status?: "pending" | "approved" | "rejected";
}

export const loader = async () => {
  const { users, total } = await getUsersSupabase(10, 0);
  return { users, total };
};

export default function AllUsers({ loaderData }: Route.ComponentProps) {
  const { users, total } = loaderData;

  // --- APPROVE LOGIC ---
  const handleApprove = async (userId: string, accountId: string) => {
    const confirm = window.confirm("Are you sure you want to approve this user?");
    if (!confirm) return;

    try {
      // Update user status to admin
      const { error: userError } = await supabase
        .from("users")
        .update({ status: "admin", request_status: "approved" })
        .eq("id", userId);

      if (userError) throw userError;

      // Update admin request status
      const { error: requestError } = await supabase
        .from("admin_requests")
        .update({ reqStatus: "approved" })
        .eq("accountId", accountId);

      if (requestError) console.log("No admin request found to update");

      alert("User approved as admin!");
      window.location.reload();
    } catch (error: any) {
      console.error("Error approving user:", error);
      alert("Failed to approve user: " + error.message);
    }
  };

  // --- REJECT LOGIC ---
  const handleReject = async (userId: string, accountId: string) => {
    const confirm = window.confirm("Are you sure you want to reject this request?");
    if (!confirm) return;

    try {
      // Option A: Just update the request status to 'rejected'
      const { error: requestError } = await supabase
        .from("admin_requests")
        .update({ reqStatus: "rejected" })
        .eq("accountId", accountId);

      if (requestError) throw requestError;

      // Option B: You might also want to revert their user status if necessary
      // await supabase.from("users").update({ status: "user" }).eq("id", userId);

      alert("User request rejected.");
      window.location.reload();
    } catch (error: any) {
      console.error("Error rejecting user:", error);
      alert("Failed to reject user: " + error.message);
    }
  };

  return (
    <main className="all-users wrapper">
      <Header
        title="Manage Users"
        description="Filter, sort, and access detailed user profiles"
      />
      <GridComponent dataSource={users} gridLines="None">
        <ColumnsDirective>
          <ColumnDirective
            field="name"
            headerText="Name"
            width="200"
            textAlign="Left"
            template={(props: UserData) => (
              <div className="flex items-center gap-1.5 px-4">
                <img
                  src={props.imageUrl}
                  alt="User"
                  className="rounded-full size-8 aspect-square"
                  referrerPolicy="no-referrer"
                />
                <span>{props.name}</span>
              </div>
            )}
          />
          <ColumnDirective
            field="email"
            headerText="Email"
            width="200"
            textAlign="Left"
          />
          <ColumnDirective
            field="joinedAt"
            headerText="Date Joined"
            width="140"
            textAlign="Left"
            template={({ joinedAt }: { joinedAt: string }) =>
              formatDate(joinedAt)
            }
          />
          <ColumnDirective
            field="status"
            headerText="User Status"
            width="100"
            textAlign="Left"
            template={({ status }: UserData) => (
              <article
                className={cn(
                  "status-column",
                  status === "user" ? "bg-success-50" : "bg-light-300"
                )}
              >
                <div
                  className={cn(
                    "size-1.5 rounded-full",
                    status === "user" ? "bg-success-500" : "bg-gray-500"
                  )}
                />
                <h3
                  className={cn(
                    "font-inter text-xs font-medium",
                    status === "user" ? "text-success-700" : "text-gray-500"
                  )}
                >
                  {status}
                </h3>
              </article>
            )}
          />

          {/* --- NEW ACTIONS COLUMN --- */}
          <ColumnDirective
            headerText="Actions"
            width="180"
            textAlign="Center"
            template={(props: UserData) => (
              <div className="flex items-center justify-center gap-2">
                {/* Only show buttons if they are not already an admin */}
                {props.request_status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(props.id, props.accountId)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(props.id, props.accountId)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}
                {props.status === 'admin' && (
                  <span className="text-xs text-gray-400 italic">Approved</span>
                )}
              </div>
            )}
          />
        </ColumnsDirective>
      </GridComponent>
    </main>
  );
}