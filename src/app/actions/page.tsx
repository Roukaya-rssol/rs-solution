export const dynamic = "force-dynamic";

import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserCompany } from "@/lib/getCurrentUserCompany";

type Props = {
  searchParams: Promise<{
    filter?: string;
  }>;
};

export default async function ActionsPage({ searchParams }: Props) {
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
  const { filter } = await searchParams;

  const whereClause: Prisma.ActionItemWhereInput = {
    companyId,
  };

  if (filter === "mine") {
    whereClause.responsibleId = userCookie.value;
  }

  if (filter === "done") {
    whereClause.status = "VALIDATED";
  }

  if (filter === "overdue") {
    whereClause.dueDate = {
      lt: new Date(),
    };
    whereClause.status = {
      notIn: ["DONE", "VALIDATED", "CANCELLED"],
    };
  }

  const actions = await prisma.actionItem.findMany({
    where: whereClause,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      event: true,
      responsible: true,
    },
  });

  function isActive(tab: string) {
    return filter === tab
      ? "bg-emerald-600 text-white"
      : "bg-white text-slate-700 border border-slate-300";
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Actions HSE</h1>
            <p className="text-sm text-slate-500">
              Suivi des actions de {userCompany.company.name}
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-white"
          >
            ← Dashboard
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href="/actions"
            className={`px-4 py-2 rounded-xl text-sm ${!filter ? "bg-emerald-600 text-white" : "bg-white text-slate-700 border border-slate-300"}`}
          >
            Toutes
          </Link>

          <Link
            href="/actions?filter=mine"
            className={`px-4 py-2 rounded-xl text-sm ${isActive("mine")}`}
          >
            Mes actions
          </Link>

          <Link
            href="/actions?filter=overdue"
            className={`px-4 py-2 rounded-xl text-sm ${isActive("overdue")}`}
          >
            En retard
          </Link>

          <Link
            href="/actions?filter=done"
            className={`px-4 py-2 rounded-xl text-sm ${isActive("done")}`}
          >
            Terminées
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr className="text-left">
                <th className="p-4">Action</th>
                <th className="p-4">Événement</th>
                <th className="p-4">Responsable</th>
                <th className="p-4">Échéance</th>
                <th className="p-4">Statut</th>
              </tr>
            </thead>

            <tbody>
              {actions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    Aucune action trouvée.
                  </td>
                </tr>
              ) : (
                actions.map((action) => {
                  const isOverdue =
                    action.dueDate &&
                    action.dueDate < new Date() &&
                    !["DONE", "VALIDATED", "CANCELLED"].includes(
                      action.status
                    );

                  return (
                    <tr key={action.id} className="border-t">
                      <td className="p-4">
                        <Link
                          href={`/actions/${action.id}`}
                          className="font-medium text-emerald-700 hover:underline"
                        >
                          {action.title}
                        </Link>

                        {action.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {action.description}
                          </p>
                        )}
                      </td>

                      <td className="p-4">
                        {action.event ? (
                          <Link
                            href={`/events/${action.event.id}`}
                            className="text-emerald-700 hover:underline"
                          >
                            {action.event.eventNumber}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="p-4">
                        {action.responsible.firstName}{" "}
                        {action.responsible.lastName}
                      </td>

                      <td className="p-4">
                        {action.dueDate ? (
                          <span
                            className={
                              isOverdue
                                ? "text-red-600 font-medium"
                                : "text-slate-700"
                            }
                          >
                            {new Date(action.dueDate).toLocaleDateString(
                              "fr-FR"
                            )}
                            {isOverdue ? " · En retard" : ""}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="p-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                          {action.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}