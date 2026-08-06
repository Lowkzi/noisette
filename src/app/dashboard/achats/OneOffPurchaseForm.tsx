"use client";

import { useActionState } from "react";
import { createOneOffPurchase } from "@/app/actions/oneOffPurchases";

export function OneOffPurchaseForm({ occasions }: { occasions: string[] }) {
  const [state, action, pending] = useActionState(createOneOffPurchase, undefined);

  return (
    <form action={action} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
      <h2 className="font-semibold">Ajouter un achat</h2>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Nom</label>
          <input
            name="label"
            required
            placeholder="Montre, chaussures..."
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {state?.errors?.label && <p className="text-xs text-red-400 mt-1">{state.errors.label[0]}</p>}
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Montant (€)</label>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {state?.errors?.amount && <p className="text-xs text-red-400 mt-1">{state.errors.amount[0]}</p>}
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Occasion / liste (optionnel)</label>
          <input
            name="occasion"
            list="occasions"
            placeholder="Cadeaux Noël, Anniversaire..."
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <datalist id="occasions">
            {occasions.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
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
