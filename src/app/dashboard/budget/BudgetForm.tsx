"use client";

import { useActionState } from "react";
import { upsertBudget } from "@/app/actions/budgets";

type Category = { id: string; name: string };

export function BudgetForm({ categories, month }: { categories: Category[]; month: string }) {
  const [state, action, pending] = useActionState(upsertBudget, undefined);

  return (
    <form action={action} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
      <h2 className="font-semibold">Définir un objectif</h2>
      <p className="text-xs text-slate-400 -mt-2">
        L&apos;objectif se reporte automatiquement les mois suivants. Choisis un mois précis pour
        l&apos;ajuster à partir de cette date seulement.
      </p>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Catégorie</label>
          <select
            name="categoryId"
            required
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {state?.errors?.categoryId && (
            <p className="text-xs text-red-400 mt-1">{state.errors.categoryId[0]}</p>
          )}
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Mois</label>
          <input
            type="month"
            name="month"
            defaultValue={month}
            required
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Montant prévu (€)</label>
          <input
            name="plannedAmount"
            type="number"
            step="0.01"
            min="0"
            required
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {state?.errors?.plannedAmount && (
            <p className="text-xs text-red-400 mt-1">{state.errors.plannedAmount[0]}</p>
          )}
        </div>
      </div>
      {state?.message && <p className="text-sm text-red-400">{state.message}</p>}
      <button
        disabled={pending}
        type="submit"
        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold py-2 px-4 rounded-lg transition"
      >
        {pending ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
