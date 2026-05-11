"use client";

import { useState } from "react";

export default function AdminCreateCompanyForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/admin/create-company", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        companyName: formData.get("companyName"),
        adminFirstName: formData.get("firstName"),
        adminLastName: formData.get("lastName"),
        adminEmail: formData.get("email"),
        adminPassword: formData.get("password"),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Erreur création.");
      setLoading(false);
      return;
    }

    setSuccess("Entreprise et gérant créés avec succès.");
    setLoading(false);
    (e.target as HTMLFormElement).reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        name="companyName"
        placeholder="Nom entreprise"
        required
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
      />

      <input
        name="firstName"
        placeholder="Prénom du gérant"
        required
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
      />

      <input
        name="lastName"
        placeholder="Nom du gérant"
        required
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
      />

      <input
        name="email"
        type="email"
        placeholder="Email du gérant"
        required
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
      />

      <input
        name="password"
        type="password"
        placeholder="Mot de passe temporaire"
        required
        defaultValue="Password123!"
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
      />

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <button
        disabled={loading}
        className="rounded-xl bg-emerald-600 px-5 py-2 text-white text-sm font-medium disabled:opacity-60"
      >
        {loading ? "Création..." : "Créer entreprise + gérant"}
      </button>
    </form>
  );
}