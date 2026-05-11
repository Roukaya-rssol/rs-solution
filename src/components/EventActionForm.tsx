"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ResponsibleUser = {
  id: string;
  name: string;
};

type EventActionFormProps = {
  eventId: string;
  users: ResponsibleUser[];
  canCreateAction: boolean;
};

export default function EventActionForm({
  eventId,
  users,
  canCreateAction,
}: EventActionFormProps) {
const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const payload = {
      title: formData.get("title"),
      description: formData.get("description"),
      actionType: formData.get("actionType"),
      dueDate: formData.get("dueDate"),
      responsibleId: formData.get("responsibleId"),
    };

    const response = await fetch(`/api/events/${eventId}/actions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Erreur lors de la création de l’action.");
      setLoading(false);
      return;
    }

    setShowForm(false);
    setLoading(false);
    router.refresh();
  }

  if (!canCreateAction) {
  return null;
}
  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="rounded-xl bg-emerald-600 px-4 py-2 text-white text-sm"
      >
        + Ajouter action
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 mb-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Titre de l’action
          </label>
          <input
            name="title"
            required
            placeholder="Ex : Installer une protection machine"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            rows={3}
            placeholder="Décrire l’action à réaliser..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Responsable
          </label>
          <select
            name="responsibleId"
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Type d’action
            </label>
            <select
              name="actionType"
              defaultValue="CORRECTIVE"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            >
              <option value="CORRECTIVE">Corrective</option>
              <option value="PREVENTIVE">Préventive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Échéance
            </label>
            <input
              name="dueDate"
              type="date"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm"
          >
            Annuler
          </button>

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-white text-sm disabled:opacity-60"
          >
            {loading ? "Création..." : "Créer action"}
          </button>
        </div>
      </form>
    </div>
  );
}