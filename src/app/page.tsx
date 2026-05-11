import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="max-w-xl text-center bg-white rounded-2xl shadow-lg p-10">
        <div className="mx-auto mb-5 h-16 w-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl">
          RS
        </div>

        <h1 className="text-3xl font-bold text-slate-900">
          Bienvenue sur RS Solution
        </h1>

        <p className="text-slate-500 mt-4">
          Plateforme SaaS moderne pour la gestion Hygiène, Sécurité et
          Environnement.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="rounded-xl bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700"
          >
            Se connecter
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-300 px-6 py-3 text-slate-700 font-semibold hover:bg-slate-50"
          >
            Voir dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}