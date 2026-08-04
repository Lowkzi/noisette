"use client";

import { useActionState, useState } from "react";
import { createTransaction } from "@/app/actions/transactions";

type Account = { id: string; name: string };
type Category = { id: string; name: string; kind: string };
type Member = { id: string; name: string | null; email: string };

export function TransactionForm({
  accounts,
  categories,
  members,
}: {
  accounts: Account[];
  categories: Category[];
  members: Member[];
}) {
  const [state, action, pending] = useActionState(createTransaction, undefined);
  const [type, setType] = useState<"EXPENSE" | "INCOME" | "TRANSFER">("EXPENSE");
  const [isShared, setIsShared] = useState(false);
  const [shares, setShares] = useState<Record<string, string>>({});

  const filteredCategories = categories.filter((c) =>
    type === "INCOME" ? c.kind === "INCOME" : c.kind === "EXPENSE"
  );

  const splitsJson = JSON.stringify(
    Object.entries(shares)
      .filter(([, v]) => v && Number(v) > 0)
      .map(([userId, shareAmount]) => ({ userId, shareAmount: Number(shareAmount) }))
  );

  return (
    <form action={action} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
      <h2 className="font-semibold">Ajouter une transaction</h2>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Type</label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="EXPENSE">Dépense</option>
            <option value="INCOME">Revenu</option>
            <option value="TRANSFER">Virement</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Compte</label>
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
        <div>
          <label className="block text-xs text-slate-400 mb-1">Catégorie</label>
          <select
            name="categoryId"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">—</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
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
          <label className="block text-xs text-slate-400 mb-1">Date</label>
          <input
            name="date"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            required
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Libellé</label>
          <input
            name="label"
            required
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {state?.errors?.label && <p className="text-xs text-red-400 mt-1">{state.errors.label[0]}</p>}
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1">Note (optionnel)</label>
        <input
          name="note"
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {members.length > 1 && (
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              name="isShared"
              checked={isShared}
              onChange={(e) => setIsShared(e.target.checked)}
            />
            Dépense partagée entre membres du foyer
          </label>
          {isShared && (
            <div className="grid sm:grid-cols-2 gap-2 bg-slate-900/50 rounded-lg p-3">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-slate-400">{m.name ?? m.email}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={shares[m.id] ?? ""}
                    onChange={(e) => setShares((s) => ({ ...s, [m.id]: e.target.value }))}
                    className="w-24 rounded-lg bg-slate-800 border border-slate-700 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}
              <input type="hidden" name="splits" value={splitsJson} />
            </div>
          )}
        </div>
      )}

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
