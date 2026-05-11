"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type EventCommentFormProps = {
  eventId: string;
};

export default function EventCommentForm({ eventId }: EventCommentFormProps) {
  const router = useRouter();

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!content.trim()) {
      setError("Le commentaire est obligatoire.");
      return;
    }

    setLoading(true);
    setError("");

    const response = await fetch(`/api/events/${eventId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Erreur lors de l’ajout du commentaire.");
      setLoading(false);
      return;
    }

    setContent("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mb-5">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="Ajouter un commentaire..."
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />

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
        {loading ? "Ajout..." : "Ajouter commentaire"}
      </button>
    </form>
  );
}