"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  eventId: string;
};

export default function EventAttachmentForm({ eventId }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const currentForm = e.currentTarget;
    const formData = new FormData(currentForm);
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setError("Veuillez sélectionner un fichier.");
      return;
    }

    setLoading(true);
    setError("");

    const response = await fetch(`/api/events/${eventId}/attachments`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Erreur upload fichier.");
      setLoading(false);
      return;
    }

    setLoading(false);
    formRef.current?.reset();
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <input
        name="file"
        type="file"
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
      />

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-emerald-600 px-4 py-2 text-white text-sm disabled:opacity-60"
      >
        {loading ? "Upload..." : "Ajouter fichier"}
      </button>
    </form>
  );
}