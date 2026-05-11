"use client";

import { useRouter } from "next/navigation";

type Props = {
  fallback?: string;
  label?: string;
};

export default function BackButton({
  fallback = "/dashboard",
  label = "← Retour",
}: Props) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-white"
    >
      {label}
    </button>
  );
}
