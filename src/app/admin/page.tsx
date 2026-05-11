export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUserCompany } from "@/lib/getCurrentUserCompany";
import { getUserRoles, hasRole } from "@/lib/permissions";
import AdminCreateCompanyForm from "@/components/AdminCreateCompanyForm";
import BackButton from "@/components/BackButton";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("rs_user_id");

  if (!userCookie) {
    redirect("/login");
  }

  const userCompany = await getCurrentUserCompany(userCookie.value);

  if (!userCompany) {
    redirect("/login");
  }

  const roles = await getUserRoles(userCookie.value, userCompany.companyId);

  if (!hasRole(roles, ["SUPER_ADMIN"])) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="mb-4">
  <BackButton fallback="/dashboard" label="← Dashboard" />
</div>
        <h1 className="text-2xl font-bold mb-2 text-slate-900">
          SuperAdmin — Créer une entreprise
        </h1>

        <p className="text-sm text-slate-500 mb-6">
          Créer une entreprise cliente et son gérant/admin entreprise.
        </p>

        <AdminCreateCompanyForm />
      </div>
    </main>
  );
}