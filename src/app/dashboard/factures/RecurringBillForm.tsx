"use client";

import { useActionState } from "react";
import { createRecurringBill } from "@/app/actions/recurringBills";

type Category = { id: string; name: string };
type Account = { id: string; name: string };

export function RecurringBillForm({ categories, accounts }: { categories: Category[]; accounts: Account[] }) {
  const [state, action, pending] = useActionState(createRecurringBill, undefined);

  return (
    <form action={action} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
      <h2 className="font-semibold">Nouvelle facture récurrente</h2>
      <div className="grid sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Libellé</label>
          <input
            name="label"
            required
            placeholder="Loyer, Internet, Abonnement..."
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
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Jour d&apos;échéance</label>
          <input
            name="dueDayOfMonth"
            type="number"
            min="1"
            max="31"
            required
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {state?.errors?.dueDayOfMonth && (
            <p className="text-xs text-red-400 mt-1">{state.errors.dueDayOfMonth[0]}</p>
          )}
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Rappel (jours avant)</label>
          <input
            name="reminderDaysBefore"
            type="number"
            min="0"
            max="30"
            defaultValue="3"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Catégorie (optionnel)</label>
          <select
            name="categoryId"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Compte de prélèvement (optionnel)</label>
          <select
            name="accountId"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">—</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
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
