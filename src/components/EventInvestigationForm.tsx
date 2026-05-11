"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  eventId: string;
  canManageInvestigation: boolean;
  existingInvestigation?: {
    summary: string | null;
    rootCause: string | null;
    method: string | null;
    correctiveSummary: string | null;
    preventiveSummary: string | null;
  } | null;
};

export default function EventInvestigationForm({
  eventId,
  existingInvestigation,
  canManageInvestigation,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!canManageInvestigation) {
    return (
      <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-500">
        Vous n’avez pas l’autorisation de modifier l’investigation.
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const payload = {
      summary: formData.get("summary"),
      rootCause: formData.get("rootCause"),
      method: formData.get("method"),
      correctiveSummary: formData.get("correctiveSummary"),
      preventiveSummary: formData.get("preventiveSummary"),
    };

    const response = await fetch(`/api/events/${eventId}/investigation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Erreur lors de l’enregistrement.");
      setLoading(false);
      return;
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Méthode d’analyse
        </label>
        <select
          name="method"
          defaultValue={existingInvestigation?.method || "5 WHY"}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
        >
          <option value="5 WHY">5 Why</option>
          <option value="ISHIKAWA">Ishikawa</option>
          <option value="RCA">RCA</option>
          <option value="OTHER">Autre</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Résumé de l’investigation
        </label>
        <textarea
          name="summary"
          rows={4}
          defaultValue={existingInvestigation?.summary || ""}
          placeholder="Décrire les faits, le contexte, les constats..."
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Cause racine
        </label>
        <textarea
          name="rootCause"
          rows={3}
          defaultValue={existingInvestigation?.rootCause || ""}
          placeholder="Ex : absence de procédure, défaut de formation, équipement non conforme..."
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Synthèse corrective
        </label>
        <textarea
          name="correctiveSummary"
          rows={3}
          defaultValue={existingInvestigation?.correctiveSummary || ""}
          placeholder="Actions correctives proposées..."
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Synthèse préventive
        </label>
        <textarea
          name="preventiveSummary"
          rows={3}
          defaultValue={existingInvestigation?.preventiveSummary || ""}
          placeholder="Actions préventives proposées..."
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
        />
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-emerald-600 px-4 py-2 text-white text-sm font-medium disabled:opacity-60"
      >
        {loading ? "Enregistrement..." : "Enregistrer investigation"}
      </button>
    </form>
  );
}