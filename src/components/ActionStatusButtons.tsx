"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ActionStatusButtonsProps = {
  actionId: string;
  currentStatus: string;
};

export default function ActionStatusButtons({
  actionId,
  currentStatus,
}: ActionStatusButtonsProps) {
  const router = useRouter();
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function updateStatus(status: string) {
    setLoadingStatus(status);
    setError("");

    const response = await fetch(`/api/actions/${actionId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Erreur lors du changement de statut.");
      setLoadingStatus(null);
      return;
    }

    setLoadingStatus(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2">
        {currentStatus !== "IN_PROGRESS" && (
          <button
            onClick={() => updateStatus("IN_PROGRESS")}
            disabled={loadingStatus !== null}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
          >
            {loadingStatus === "IN_PROGRESS"
              ? "Mise à jour..."
              : "Marquer en cours"}
          </button>
        )}

        {currentStatus !== "DONE" && currentStatus !== "VALIDATED" && (
          <button
            onClick={() => updateStatus("DONE")}
            disabled={loadingStatus !== null}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-white text-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            {loadingStatus === "DONE" ? "Mise à jour..." : "Marquer terminée"}
          </button>
        )}

        {currentStatus === "DONE" && (
          <button
            onClick={() => updateStatus("VALIDATED")}
            disabled={loadingStatus !== null}
            className="rounded-xl bg-slate-900 px-4 py-2 text-white text-sm hover:bg-slate-800 disabled:opacity-60"
          >
            {loadingStatus === "VALIDATED" ? "Validation..." : "Valider"}
          </button>
        )}

        {currentStatus !== "CANCELLED" && currentStatus !== "VALIDATED" && (
          <button
            onClick={() => updateStatus("CANCELLED")}
            disabled={loadingStatus !== null}
            className="rounded-xl border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {loadingStatus === "CANCELLED" ? "Annulation..." : "Annuler action"}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}