"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";

export default function NewUserPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const payload = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      password: formData.get("password"),
      jobTitle: formData.get("jobTitle"),
      roleCode: formData.get("roleCode"),
    };

    const response = await fetch("/api/users", {
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

    router.push("/users");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="mb-4">
  <BackButton fallback="/users" label="← Retour utilisateurs" />
</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Créer un utilisateur
        </h1>

        <p className="text-sm text-slate-500 mb-6">
          Ajouter un compte employé, manager ou responsable HSE.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-2">Prénom</label>
              <input
                name="firstName"
                required
                className="w-full rounded-xl border px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nom</label>
              <input
                name="lastName"
                required
                className="w-full rounded-xl border px-4 py-3 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-xl border px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Mot de passe temporaire
            </label>
            <input
              name="password"
              type="password"
              required
              defaultValue="Password123!"
              className="w-full rounded-xl border px-4 py-3 text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">
              L’utilisateur pourra le changer plus tard.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Poste</label>
            <input
              name="jobTitle"
              placeholder="Ex : Manager production"
              className="w-full rounded-xl border px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Rôle</label>
            <select
              name="roleCode"
              defaultValue="EMPLOYEE"
              className="w-full rounded-xl border px-4 py-3 text-sm"
            >
              <option value="EMPLOYEE">Employé</option>
              <option value="MANAGER">Manager</option>
              <option value="HSE_MANAGER">Responsable HSE</option>
              <option value="COMPANY_ADMIN">Admin entreprise</option>
            </select>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => router.push("/users")}
              className="rounded-xl border px-4 py-2 text-sm"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-white text-sm font-medium disabled:opacity-60"
            >
              {loading ? "Création..." : "Créer utilisateur"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}