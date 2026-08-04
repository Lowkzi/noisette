"use client";

import { useActionState } from "react";
import { createAccount } from "@/app/actions/accounts";

const TYPE_LABELS: Record<string, string> = {
  CHECKING: "Compte courant",
  SAVINGS: "Épargne",
  CASH: "Espèces",
  OTHER: "Autre",
};

export function AccountForm() {
  const [state, action, pending] = useActionState(createAccount, undefined);

  return (
    <form action={action} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
      <h2 className="font-semibold">Ajouter un compte</h2>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Nom</label>
          <input
            name="name"
            required
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {state?.errors?.name && <p className="text-xs text-red-400 mt-1">{state.errors.name[0]}</p>}
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Type</label>
          <select
            name="type"
            defaultValue="CHECKING"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Solde actuel (€)</label>
          <input
            name="currentBalance"
            type="number"
            step="0.01"
            defaultValue="0"
            required
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {state?.errors?.currentBalance && (
            <p className="text-xs text-red-400 mt-1">{state.errors.currentBalance[0]}</p>
          )}
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

export { TYPE_LABELS };
