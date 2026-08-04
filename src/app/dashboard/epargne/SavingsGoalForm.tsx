"use client";

import { useActionState } from "react";
import { createSavingsGoal } from "@/app/actions/savingsGoals";

export function SavingsGoalForm() {
  const [state, action, pending] = useActionState(createSavingsGoal, undefined);

  return (
    <form action={action} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
      <h2 className="font-semibold">Nouvel objectif d&apos;épargne</h2>
      <div className="grid sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Nom</label>
          <input
            name="name"
            required
            placeholder="Vacances, Fonds d'urgence..."
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {state?.errors?.name && <p className="text-xs text-red-400 mt-1">{state.errors.name[0]}</p>}
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Montant cible (€)</label>
          <input
            name="targetAmount"
            type="number"
            step="0.01"
            min="0.01"
            required
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
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
        <div>
          <label className="block text-xs text-slate-400 mb-1">Date cible (optionnel)</label>
          <input
            name="targetDate"
            type="date"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
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
