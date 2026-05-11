import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/LogoutButton";
import { getCurrentUserCompany } from "@/lib/getCurrentUserCompany";
import { getUserRoles, hasRole } from "@/lib/permissions";

export default async function DashboardPage() {
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

  const isSuperAdmin = hasRole(roles, ["SUPER_ADMIN"]);
  const isCompanyAdmin = hasRole(roles, ["COMPANY_ADMIN"]);

  if (isSuperAdmin) {
    const companiesCount = await prisma.company.count({
      where: {
        slug: {
          not: "rs-system",
        },
      },
    });

    const usersCount = await prisma.user.count();

    const latestCompanies = await prisma.company.findMany({
      where: {
        slug: {
          not: "rs-system",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    return (
      <main className="min-h-screen bg-slate-100">
        <div className="flex">
          <aside className="hidden md:flex w-64 min-h-screen bg-slate-900 text-white flex-col p-5">
            <div className="flex items-center gap-3 mb-10">
              <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center font-bold">
                RS
              </div>
              <div>
                <h1 className="font-bold">RS Solution</h1>
                <p className="text-xs text-slate-400">SuperAdmin</p>
              </div>
            </div>

            <nav className="space-y-2 text-sm">
              <Link
                href="/dashboard"
                className="block rounded-xl bg-emerald-600 px-4 py-3"
              >
                Dashboard SaaS
              </Link>

              <Link
                href="/admin"
                className="block rounded-xl px-4 py-3 hover:bg-slate-800"
              >
                + Créer entreprise
              </Link>
            </nav>
          </aside>

          <section className="flex-1">
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Dashboard SuperAdmin
                </h2>
                <p className="text-sm text-slate-500">
                  Gestion SaaS : entreprises clientes, comptes et abonnements
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden md:inline text-sm text-slate-600">
                  {userCompany.user.firstName} {userCompany.user.lastName}
                </span>
                <LogoutButton />
              </div>
            </header>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <p className="text-sm text-slate-500">Entreprises clientes</p>
                  <p className="text-3xl font-bold text-slate-900 mt-3">
                    {companiesCount}
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <p className="text-sm text-slate-500">Utilisateurs totaux</p>
                  <p className="text-3xl font-bold text-slate-900 mt-3">
                    {usersCount}
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <p className="text-sm text-slate-500">Abonnements</p>
                  <p className="text-3xl font-bold text-slate-900 mt-3">
                    MVP
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Dernières entreprises créées
                    </h3>
                    <p className="text-sm text-slate-500">
                      Liste des clients SaaS récents
                    </p>
                  </div>

                  <Link
                    href="/admin"
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-white text-sm font-medium"
                  >
                    + Créer entreprise
                  </Link>
                </div>

                {latestCompanies.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Aucune entreprise cliente pour le moment.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b text-slate-500">
                        <th className="py-3">Entreprise</th>
                        <th>Statut</th>
                        <th>Date création</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestCompanies.map((company) => (
                        <tr key={company.id} className="border-b">
                          <td className="py-3 font-medium">{company.name}</td>
                          <td>{company.status}</td>
                          <td>
                            {new Date(company.createdAt).toLocaleDateString(
                              "fr-FR"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const companyId = userCompany.companyId;

  const [
    totalEvents,
    openEvents,
    totalActions,
    overdueActions,
    validatedActions,
    latestEvents,
    latestActions,
    unreadNotifications,
  ] = await Promise.all([
    prisma.event.count({ where: { companyId } }),

    prisma.event.count({
      where: {
        companyId,
        status: { not: "CLOSED" },
      },
    }),

    prisma.actionItem.count({ where: { companyId } }),

    prisma.actionItem.count({
      where: {
        companyId,
        dueDate: { lt: new Date() },
        status: {
          notIn: ["DONE", "VALIDATED", "CANCELLED"],
        },
      },
    }),

    prisma.actionItem.count({
      where: {
        companyId,
        status: "VALIDATED",
      },
    }),

    prisma.event.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),

    prisma.actionItem.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        event: true,
        responsible: true,
      },
    }),

    prisma.notification.count({
      where: {
        companyId,
        userId: userCookie.value,
        status: "UNREAD",
      },
    }),
  ]);

  const stats = [
    {
      title: "Total événements",
      value: totalEvents,
      description: "Tous modules HSE",
    },
    {
      title: "Événements ouverts",
      value: openEvents,
      description: "À traiter ou en cours",
    },
    {
      title: "Actions en retard",
      value: overdueActions,
      description: "Échéance dépassée",
    },
    {
      title: "Actions validées",
      value: validatedActions,
      description: `${totalActions} actions au total`,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <aside className="hidden md:flex w-64 min-h-screen bg-slate-900 text-white flex-col p-5">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center font-bold">
              RS
            </div>
            <div>
              <h1 className="font-bold">RS Solution</h1>
              <p className="text-xs text-slate-400">HSE SaaS</p>
            </div>
          </div>

          <nav className="space-y-2 text-sm">
            <Link
              href="/dashboard"
              className="block rounded-xl bg-emerald-600 px-4 py-3"
            >
              Dashboard
            </Link>

            <Link
              href="/events"
              className="block rounded-xl px-4 py-3 hover:bg-slate-800"
            >
              Événements
            </Link>

            <Link
              href="/actions"
              className="block rounded-xl px-4 py-3 hover:bg-slate-800"
            >
              Actions
            </Link>

            {isCompanyAdmin && (
              <Link
                href="/users"
                className="block rounded-xl px-4 py-3 hover:bg-slate-800"
              >
                Utilisateurs
              </Link>
            )}

            <Link
              href="/notifications"
              className="block rounded-xl px-4 py-3 hover:bg-slate-800"
            >
              Notifications
              {unreadNotifications > 0 && (
                <span className="ml-2 rounded-full bg-emerald-500 px-2 py-0.5 text-xs">
                  {unreadNotifications}
                </span>
              )}
            </Link>
          </nav>
        </aside>

        <section className="flex-1">
          <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Dashboard HSE
              </h2>
              <p className="text-sm text-slate-500">
                {userCompany.company.name} · Indicateurs HSE
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden md:inline text-sm text-slate-600">
                {userCompany.user.firstName} {userCompany.user.lastName}
              </span>
              <LogoutButton />
            </div>
          </header>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {stats.map((item) => (
                <div
                  key={item.title}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5"
                >
                  <p className="text-sm text-slate-500">{item.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-3">
                    {item.value}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Derniers événements
                    </h3>
                    <p className="text-sm text-slate-500">
                      Les dernières déclarations HSE
                    </p>
                  </div>

                  <Link
                    href="/events/new"
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-white text-sm font-medium"
                  >
                    + Déclarer
                  </Link>
                </div>

                <table className="w-full text-sm">
                  <tbody>
                    {latestEvents.length === 0 ? (
                      <tr>
                        <td className="py-6 text-center text-slate-500">
                          Aucun événement.
                        </td>
                      </tr>
                    ) : (
                      latestEvents.map((event) => (
                        <tr key={event.id} className="border-b">
                          <td className="py-3">
                            <Link
                              href={`/events/${event.id}`}
                              className="text-emerald-700 hover:underline"
                            >
                              {event.title}
                            </Link>
                            <p className="text-xs text-slate-400">
                              {event.eventNumber} · {event.status}
                            </p>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Dernières actions
                    </h3>
                    <p className="text-sm text-slate-500">
                      Actions récentes de l’entreprise
                    </p>
                  </div>

                  <Link
                    href="/actions"
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700"
                  >
                    Voir actions
                  </Link>
                </div>

                <table className="w-full text-sm">
                  <tbody>
                    {latestActions.length === 0 ? (
                      <tr>
                        <td className="py-6 text-center text-slate-500">
                          Aucune action.
                        </td>
                      </tr>
                    ) : (
                      latestActions.map((action) => (
                        <tr key={action.id} className="border-b">
                          <td className="py-3">
                            <Link
                              href={`/actions/${action.id}`}
                              className="text-emerald-700 hover:underline"
                            >
                              {action.title}
                            </Link>
                            <p className="text-xs text-slate-400">
                              {action.responsible.firstName}{" "}
                              {action.responsible.lastName} · {action.status}
                            </p>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {isCompanyAdmin && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Gestion des collaborateurs
                  </h3>
                  <p className="text-sm text-slate-500">
                    En tant que gérant, vous pouvez créer les comptes de votre
                    équipe.
                  </p>
                </div>

                <Link
                  href="/users"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-white text-sm font-medium"
                >
                  Gérer utilisateurs
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}