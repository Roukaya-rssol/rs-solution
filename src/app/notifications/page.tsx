export const dynamic = "force-dynamic";

import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserCompany } from "@/lib/getCurrentUserCompany";
import BackButton from "@/components/BackButton";

export default async function NotificationsPage() {
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

  const notifications = await prisma.notification.findMany({
    where: {
      companyId,
      userId: userCookie.value,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
  <BackButton fallback="/dashboard" label="← Dashboard" />
</div>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Notifications
            </h1>
            <p className="text-sm text-slate-500">
              Notifications de {userCompany.company.name}
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-white"
          >
            ← Dashboard
          </Link>
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-500">
              Aucune notification pour le moment.
            </div>
          ) : (
            notifications.map((notification) => (
              <Link
                key={notification.id}
                href={notification.link || "/dashboard"}
                className="block bg-white rounded-2xl border border-slate-200 p-5 hover:border-emerald-300 transition"
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      {notification.title}
                    </h2>

                    <p className="text-sm text-slate-600 mt-1">
                      {notification.message}
                    </p>

                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(notification.createdAt).toLocaleString("fr-FR")}
                    </p>
                  </div>

                  {notification.status === "UNREAD" && (
                    <span className="h-3 w-3 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}