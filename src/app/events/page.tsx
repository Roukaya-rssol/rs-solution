import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserCompany } from "@/lib/getCurrentUserCompany";
import BackButton from "@/components/BackButton";

export default async function EventsPage() {
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

  const events = await prisma.event.findMany({
    where: {
      companyId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      site: true,
      department: true,
      reporter: true,
    },
  });

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
  <BackButton
    fallback="/dashboard"
    label="← Dashboard"
  />
</div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Événements HSE
            </h1>
            <p className="text-sm text-slate-500">
              Liste des événements déclarés pour {userCompany.company.name}
            </p>
          </div>

          <Link
            href="/events/new"
            className="rounded-xl bg-emerald-600 px-4 py-2 text-white text-sm font-medium hover:bg-emerald-700"
          >
            + Déclarer événement
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr className="text-left">
                <th className="p-4">N°</th>
                <th className="p-4">Titre</th>
                <th className="p-4">Module</th>
                <th className="p-4">Type</th>
                <th className="p-4">Gravité</th>
                <th className="p-4">Statut</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>

            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    Aucun événement pour le moment.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="border-t">
                    <td className="p-4 font-medium">{event.eventNumber}</td>

                    <td className="p-4">
                      <Link
                        href={`/events/${event.id}`}
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        {event.title}
                      </Link>
                    </td>

                    <td className="p-4">{event.module}</td>
                    <td className="p-4">{event.eventType}</td>
                    <td className="p-4">{event.severity || "-"}</td>
                    <td className="p-4">{event.status}</td>
                    <td className="p-4">
                      {new Date(event.eventDate).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <Link href="/dashboard" className="text-sm text-emerald-700">
            ← Retour dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}