import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white p-6">
      <div className="text-center space-y-6 max-w-md">
        <Image src="/squirrel-logo.png" alt="Écureuil Noisette" width={56} height={56} className="mx-auto" priority />
        <span className="text-6xl">🌰</span>
        <h1 className="text-3xl font-bold">Noisette</h1>
        <p className="text-slate-400">
          Les finances de votre foyer, simplement : comptes, dépenses, budget, épargne et
          factures récurrentes, au même endroit.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-green-600 hover:bg-green-700 px-6 py-2.5 font-semibold transition"
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className="rounded-lg border border-slate-700 hover:border-slate-500 px-6 py-2.5 font-semibold transition"
          >
            Créer un foyer
          </Link>
        </div>
      </div>
    </main>
  );
}
