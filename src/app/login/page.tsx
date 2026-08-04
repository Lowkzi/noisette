"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Image src="/squirrel-logo.png" alt="Écureuil Noisette" width={44} height={44} className="mx-auto" priority />
          <h1 className="text-2xl font-bold">Connexion à Noisette</h1>
        </div>

        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-slate-400 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          {state?.errors?.email && <p className="text-sm text-red-400">{state.errors.email[0]}</p>}

          <div>
            <label htmlFor="password" className="block text-sm text-slate-400 mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          {state?.errors?.password && (
            <p className="text-sm text-red-400">{state.errors.password[0]}</p>
          )}

          {state?.message && <p className="text-sm text-red-400">{state.message}</p>}

          <button
            disabled={pending}
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2 px-6 rounded-lg transition duration-200 shadow-lg shadow-green-600/20"
          >
            {pending ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Pas encore de foyer ?{" "}
          <Link href="/signup" className="text-green-400 hover:text-green-300">
            Créer un compte
          </Link>
        </p>
      </div>
    </main>
  );
}
