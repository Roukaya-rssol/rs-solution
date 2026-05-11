import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserCompany } from "@/lib/getCurrentUserCompany";
import { getUserRoles, hasRole } from "@/lib/permissions";

import EventCommentForm from "@/components/EventCommentForm";
import EventActionForm from "@/components/EventActionForm";
import EventStatusButtons from "@/components/EventStatusButtons";
import EventAttachmentForm from "@/components/EventAttachmentForm";
import EventInvestigationForm from "@/components/EventInvestigationForm";
import BackButton from "@/components/BackButton";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EventDetailPage({ params }: PageProps) {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("rs_user_id");

  if (!userCookie) {
    redirect("/login");
  }

  const { id } = await params;

  const userCompany = await getCurrentUserCompany(userCookie.value);

  if (!userCompany) {
    redirect("/login");
  }

  const companyId = userCompany.companyId;

  // 🔐 rôles
  const roles = await getUserRoles(userCookie.value, companyId);

  const canManageInvestigation = hasRole(roles, [
    "HSE_MANAGER",
    "COMPANY_ADMIN",
    "SUPER_ADMIN",
  ]);

  const canCreateAction = hasRole(roles, [
    "MANAGER",
    "HSE_MANAGER",
    "COMPANY_ADMIN",
    "SUPER_ADMIN",
  ]);

  const canManageWorkflow = hasRole(roles, [
    "HSE_MANAGER",
    "COMPANY_ADMIN",
    "SUPER_ADMIN",
  ]);

  // 🔥 récupération event avec isolation entreprise
  const event = await prisma.event.findFirst({
    where: {
      id,
      companyId,
    },
    include: {
      reporter: true,
      assignee: true,
      site: true,
      department: true,
      zone: true,
      investigation: true,
      actions: {
        orderBy: { createdAt: "desc" },
        include: {
          responsible: true,
        },
      },
      attachments: {
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: true,
        },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        include: {
          author: true,
        },
      },
    },
  });

  if (!event) {
    notFound();
  }

  const companyUsers = await prisma.userCompany.findMany({
    where: {
      companyId,
      isActive: true,
    },
    include: {
      user: true,
    },
  });

  const responsibleUsers = companyUsers.map((item) => ({
    id: item.user.id,
    name: `${item.user.firstName} ${item.user.lastName}`,
  }));

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
<div className="mb-2">
  <BackButton
    fallback="/events"
    label="← Retour aux événements"
  />
</div>
        {/* HEADER */}
        <div className="flex justify-between">
          <div>
            <Link href="/events" className="text-sm text-emerald-700">
              ← Retour
            </Link>

            <h1 className="text-2xl font-bold mt-2">
              {event.title}
            </h1>

            <p className="text-sm text-slate-500">
              {event.eventNumber}
            </p>
          </div>

          <div className="flex gap-2">
            <span className="px-3 py-1 rounded bg-slate-200 text-sm">
              {event.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">

            {/* DESCRIPTION */}
            <div className="bg-white p-6 rounded-xl">
              <h2 className="font-bold mb-2">Description</h2>
              <p>{event.description}</p>
            </div>

            {/* INVESTIGATION */}
            <div className="bg-white p-6 rounded-xl">
              <h2 className="font-bold mb-4">Investigation</h2>

              <EventInvestigationForm
                eventId={event.id}
                existingInvestigation={event.investigation}
                canManageInvestigation={canManageInvestigation}
              />
            </div>

            {/* ACTIONS */}
            <div className="bg-white p-6 rounded-xl">
              <h2 className="font-bold mb-4">Actions</h2>

              <EventActionForm
                eventId={event.id}
                users={responsibleUsers}
                canCreateAction={canCreateAction}
              />

              <div className="mt-4 space-y-3">
                {event.actions.map((action) => (
                  <div key={action.id} className="border p-3 rounded">
                    <Link href={`/actions/${action.id}`}>
                      {action.title}
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* FILES */}
            <div className="bg-white p-6 rounded-xl">
              <h2 className="font-bold mb-4">Fichiers</h2>

              <EventAttachmentForm eventId={event.id} />

              <div className="mt-4 space-y-2">
                {event.attachments.map((file) => (
                  <a
                    key={file.id}
                    href={file.fileUrl}
                    target="_blank"
                    className="block text-emerald-700"
                  >
                    {file.fileName}
                  </a>
                ))}
              </div>
            </div>

            {/* COMMENTS */}
            <div className="bg-white p-6 rounded-xl">
              <h2 className="font-bold mb-4">Commentaires</h2>

              <EventCommentForm eventId={event.id} />

              <div className="mt-4 space-y-3">
                {event.comments.map((c) => (
                  <div key={c.id} className="bg-slate-50 p-3 rounded">
                    <p>{c.content}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT */}
          <aside className="space-y-6">

            <div className="bg-white p-6 rounded-xl">
              <h2 className="font-bold mb-4">Workflow</h2>

              <EventStatusButtons
                eventId={event.id}
                currentStatus={event.status}
                canManageWorkflow={canManageWorkflow}
              />
            </div>

          </aside>

        </div>
      </div>
    </main>
  );
}