import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserCompany } from "@/lib/getCurrentUserCompany";
import BackButton from "@/components/BackButton";

export default async function UsersPage() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("rs_user_id");

  if (!userCookie) {
    redirect("/login");
  }

  const userCompany = await getCurrentUserCompany(userCookie.value);

  if (!userCompany) {
    redirect("/login");
  }

  const companyId = userCompany.companyId;

  const users = await prisma.userCompany.findMany({
    where: {
      companyId,
    },
    include: {
      user: true,
      roles: {
        include: {
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
  <BackButton fallback="/dashboard" label="← Dashboard" />
</div>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Utilisateurs
            </h1>
            <p className="text-sm text-slate-500">
              Gestion des comptes de l’entreprise {userCompany.company.name}
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-white"
            >
              ← Dashboard
            </Link>

            <Link
              href="/users/new"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-white text-sm font-medium hover:bg-emerald-700"
            >
              + Nouvel utilisateur
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr className="text-left">
                <th className="p-4">Nom</th>
                <th className="p-4">Email</th>
                <th className="p-4">Poste</th>
                <th className="p-4">Rôles</th>
                <th className="p-4">Statut</th>
              </tr>
            </thead>

            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    Aucun utilisateur pour le moment.
                  </td>
                </tr>
              ) : (
                users.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-4 font-medium text-slate-900">
                      {item.user.firstName} {item.user.lastName}
                    </td>

                    <td className="p-4">{item.user.email}</td>

                    <td className="p-4">{item.jobTitle || "-"}</td>

                    <td className="p-4">
                      {item.roles.length === 0
                        ? "-"
                        : item.roles.map((r) => r.role.name).join(", ")}
                    </td>

                    <td className="p-4">
                      {item.isActive && item.user.isActive ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">
                          Actif
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">
                          Inactif
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}