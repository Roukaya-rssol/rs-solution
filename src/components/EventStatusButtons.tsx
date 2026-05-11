"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  eventId: string;
  currentStatus: string;
  canManageWorkflow: boolean;
};

const buttonClass =
  "w-full rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60";

const greenButtonClass =
  "w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60";

export default function EventStatusButtons({
  eventId,
  currentStatus,
  canManageWorkflow,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (!canManageWorkflow) {
    return (
      <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-500">
        Vous n’avez pas l’autorisation de modifier le workflow.
      </div>
    );
  }

  async function updateStatus(status: string) {
    setLoading(status);
    setError("");

    const res = await fetch(`/api/events/${eventId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Impossible de changer le statut.");
      setLoading(null);
      return;
    }

    setLoading(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {currentStatus === "REPORTED" && (
        <button
          onClick={() => updateStatus("UNDER_INVESTIGATION")}
          disabled={loading !== null}
          className={buttonClass}
        >
          {loading === "UNDER_INVESTIGATION"
            ? "Mise à jour..."
            : "Démarrer investigation"}
        </button>
      )}

      {currentStatus === "UNDER_INVESTIGATION" && (
        <button
          onClick={() => updateStatus("ACTION_PLAN_CREATED")}
          disabled={loading !== null}
          className={buttonClass}
        >
          {loading === "ACTION_PLAN_CREATED"
            ? "Mise à jour..."
            : "Créer plan d’action"}
        </button>
      )}

      {currentStatus === "ACTION_PLAN_CREATED" && (
        <button
          onClick={() => updateStatus("IN_PROGRESS")}
          disabled={loading !== null}
          className={buttonClass}
        >
          {loading === "IN_PROGRESS" ? "Mise à jour..." : "Mettre en cours"}
        </button>
      )}

      {currentStatus === "IN_PROGRESS" && (
        <button
          onClick={() => updateStatus("CLOSED")}
          disabled={loading !== null}
          className={greenButtonClass}
        >
          {loading === "CLOSED" ? "Clôture..." : "Clôturer événement"}
        </button>
      )}

      {currentStatus === "CLOSED" && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          Événement clôturé
        </div>
      )}
    </div>
  );
}