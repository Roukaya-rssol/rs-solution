import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserCompany } from "@/lib/getCurrentUserCompany";
import ActionStatusButtons from "@/components/ActionStatusButtons";
import BackButton from "@/components/BackButton";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ActionDetailPage({ params }: PageProps) {
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

  const action = await prisma.actionItem.findFirst({
    where: {
      id,
      companyId,
    },
    include: {
      event: true,
      responsible: true,
      createdBy: true,
      validatedBy: true,
      comments: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          author: true,
        },
      },
      attachments: true,
    },
  });

  if (!action) {
    notFound();
  }

  const isOverdue =
    action.dueDate &&
    action.dueDate < new Date() &&
    !["DONE", "VALIDATED", "CANCELLED"].includes(action.status);

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <BackButton fallback="/actions" label="← Retour aux actions" />

          <h1 className="text-2xl font-bold text-slate-900 mt-3">
            {action.title}
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            {action.actionType} · {action.status}
          </p>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-bold text-slate-900 mb-4">
                Description de l’action
              </h2>

              <p className="text-sm text-slate-700 whitespace-pre-line">
                {action.description || "Aucune description renseignée."}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-bold text-slate-900 mb-4">
                Événement lié
              </h2>

              {action.event ? (
                <Link
                  href={`/events/${action.event.id}`}
                  className="text-emerald-700 font-medium hover:underline"
                >
                  {action.event.eventNumber} — {action.event.title}
                </Link>
              ) : (
                <p className="text-sm text-slate-500">
                  Aucune liaison événement.
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-bold text-slate-900 mb-4">Commentaires</h2>

              {action.comments.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Aucun commentaire pour cette action.
                </p>
              ) : (
                <div className="space-y-3">
                  {action.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-xl bg-slate-50 p-4"
                    >
                      <p className="text-sm text-slate-700">
                        {comment.content}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        {comment.author.firstName} {comment.author.lastName} ·{" "}
                        {new Date(comment.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-bold text-slate-900 mb-4">Suivi</h2>

              <div className="space-y-3 text-sm">
                <Info label="Statut" value={action.status} />
                <Info label="Type" value={action.actionType} />
                <Info
                  label="Échéance"
                  value={
                    action.dueDate
                      ? `${new Date(action.dueDate).toLocaleDateString(
                          "fr-FR"
                        )}${isOverdue ? " · En retard" : ""}`
                      : "Non renseignée"
                  }
                />
                <Info
                  label="Responsable"
                  value={`${action.responsible.firstName} ${action.responsible.lastName}`}
                />
                <Info
                  label="Créée par"
                  value={`${action.createdBy.firstName} ${action.createdBy.lastName}`}
                />
                <Info
                  label="Créée le"
                  value={new Date(action.createdAt).toLocaleString("fr-FR")}
                />
                <Info
                  label="Terminée le"
                  value={
                    action.completedAt
                      ? new Date(action.completedAt).toLocaleString("fr-FR")
                      : "Non terminée"
                  }
                />
                <Info
                  label="Validée par"
                  value={
                    action.validatedBy
                      ? `${action.validatedBy.firstName} ${action.validatedBy.lastName}`
                      : "Non validée"
                  }
                />
                <Info
                  label="Validée le"
                  value={
                    action.validatedAt
                      ? new Date(action.validatedAt).toLocaleString("fr-FR")
                      : "Non validée"
                  }
                />
              </div>

              <div className="mt-5 pt-5 border-t border-slate-100">
                <h3 className="font-semibold text-slate-900 mb-3">
                  Changer le statut
                </h3>

                <ActionStatusButtons
                  actionId={action.id}
                  currentStatus={action.status}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-bold text-slate-900 mb-4">Preuves</h2>

              {action.attachments.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune preuve jointe.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {action.attachments.map((file) => (
                    <li key={file.id}>
                      <a
                        href={file.fileUrl}
                        className="text-emerald-700 hover:underline"
                      >
                        {file.fileName}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800 text-right">{value}</span>
    </div>
  );
}