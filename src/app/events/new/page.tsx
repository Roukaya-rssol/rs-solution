"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";

export default function NewEventPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const payload = {
      module: formData.get("module"),
      eventType: formData.get("eventType"),
      title: formData.get("title"),
      description: formData.get("description"),
      eventDate: formData.get("eventDate"),
      severity: formData.get("severity"),
      priority: formData.get("priority"),
      workRelated: formData.get("workRelated") === "true",
      immediateActions: formData.get("immediateActions"),
    };

    const response = await fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Erreur lors de la création.");
      setLoading(false);
      return;
    }

    router.push("/events");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="mb-4">
  <BackButton
    fallback="/events"
    label="← Retour aux événements"
  />
</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Déclarer un événement HSE
        </h1>

        <p className="text-sm text-slate-500 mb-6">
          Formulaire unifié Hygiène, Sécurité et Environnement.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-2">Module</label>
              <select
                name="module"
                className="w-full rounded-xl border px-4 py-3 text-sm"
                defaultValue="SAFETY"
              >
                <option value="SAFETY">Sécurité</option>
                <option value="HYGIENE">Hygiène</option>
                <option value="ENVIRONMENT">Environnement</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Type d’événement
              </label>
              <select
                name="eventType"
                className="w-full rounded-xl border px-4 py-3 text-sm"
                defaultValue="ACCIDENT"
              >
                <option value="ACCIDENT">Accident</option>
                <option value="NEAR_MISS">Near miss</option>
                <option value="UNSAFE_ACT">Unsafe act</option>
                <option value="UNSAFE_CONDITION">Unsafe condition</option>
                <option value="INJURY">Injury</option>
                <option value="FIRE_EXPLOSION">Fire / explosion</option>
                <option value="PROPERTY_DAMAGE">Property damage</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Titre</label>
            <input
              name="title"
              required
              placeholder="Ex : Chute de plain-pied"
              className="w-full rounded-xl border px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              name="description"
              required
              rows={4}
              placeholder="Décrivez ce qui s’est passé..."
              className="w-full rounded-xl border px-4 py-3 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium mb-2">
                Date événement
              </label>
              <input
                name="eventDate"
                type="datetime-local"
                required
                className="w-full rounded-xl border px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Gravité</label>
              <select
                name="severity"
                className="w-full rounded-xl border px-4 py-3 text-sm"
                defaultValue="LOW"
              >
                <option value="LOW">Faible</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="HIGH">Élevée</option>
                <option value="CRITICAL">Critique</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Priorité</label>
              <select
                name="priority"
                className="w-full rounded-xl border px-4 py-3 text-sm"
                defaultValue="MEDIUM"
              >
                <option value="LOW">Basse</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="HIGH">Haute</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Work related ?
            </label>
            <select
              name="workRelated"
              className="w-full rounded-xl border px-4 py-3 text-sm"
              defaultValue="true"
            >
              <option value="true">Oui</option>
              <option value="false">Non</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Actions immédiates
            </label>
            <textarea
              name="immediateActions"
              rows={3}
              placeholder="Ex : zone sécurisée, personne prise en charge..."
              className="w-full rounded-xl border px-4 py-3 text-sm"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => router.push("/events")}
              className="rounded-xl border px-4 py-2 text-sm"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-white text-sm font-medium disabled:opacity-60"
            >
              {loading ? "Enregistrement..." : "Créer événement"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}