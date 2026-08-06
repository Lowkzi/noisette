"use client";

import { useActionState, useState } from "react";
import { createSavingsGoal } from "@/app/actions/savingsGoals";

type Account = { id: string; name: string };

export function SavingsGoalForm({ accounts }: { accounts: Account[] }) {
  const [state, action, pending] = useActionState(createSavingsGoal, undefined);
  const [isCushion, setIsCushion] = useState(false);

  return (
    <form action={action} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
      <h2 className="font-semibold">Nouvel objectif d&apos;épargne</h2>

      {accounts.length > 0 && (
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            name="isCushion"
            checked={isCushion}
            onChange={(e) => setIsCushion(e.target.checked)}
          />
          Coussin financier (alerte si un compte descend sous un seuil)
        </label>
      )}

      <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Nom</label>
          <input
            name="name"
            required
            placeholder={isCushion ? "Coussin de sécurité" : "Vacances, Fonds d'urgence..."}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {state?.errors?.name && <p className="text-xs text-red-400 mt-1">{state.errors.name[0]}</p>}
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            {isCushion ? "Seuil plancher (€)" : "Montant cible (€)"}
          </label>
          <input
            name="targetAmount"
            type="number"
            step="0.01"
            min="0.01"
            required
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {isCushion ? (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Compte à surveiller</label>
            <select
              name="accountId"
              required
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            {state?.errors?.accountId && (
              <p className="text-xs text-red-400 mt-1">{state.errors.accountId[0]}</p>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Montant actuel (€)</label>
            <input
              name="currentAmount"
              type="number"
              step="0.01"
              min="0"
              defaultValue="0"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        )}

        {!isCushion && (
          <>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Date cible (optionnel)</label>
              <input
                name="targetDate"
                type="date"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Versement mensuel (optionnel)</label>
              <input
                name="monthlyContribution"
                type="number"
                step="0.01"
                min="0"
                placeholder="ex. 100"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </>
        )}
      </div>
      {state?.message && <p className="text-sm text-red-400">{state.message}</p>}
      <button
        disabled={pending}
        type="submit"
        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold py-2 px-4 rounded-lg transition"
      >
        {pending ? "Ajout..." : "Ajouter"}
      </button>
    </form>
  );
}
