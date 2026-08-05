import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/admin-auth";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }

  return <AdminDashboard />;
}
