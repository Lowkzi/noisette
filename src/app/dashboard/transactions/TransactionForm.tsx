"use client";

import { useActionState, useState } from "react";
import { createTransaction } from "@/app/actions/transactions";

type Account = { id: string; name: string };
type Category = { id: string; name: string; kind: string };
type Member = { id: string; name: string | null; email: string };

const TYPE_OPTIONS = [
  { value: "EXPENSE", label: "Dépense" },
  { value: "INCOME", label: "Revenu" },
  { value: "TRANSFER", label: "Virement" },
  { value: "DIRECT_DEBIT", label: "Prélèvement" },
] as const;

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
  const [type, setType] = useState<"EXPENSE" | "INCOME" | "TRANSFER" | "DIRECT_DEBIT">("EXPENSE");
  const [isShared, setIsShared] = useState(false);
  const [shares, setShares] = useState<Record<string, string>>({});

  const filteredCategories = categories.filter((c) =>
    type === "INCOME" ? c.kind === "INCOME" : c.kind === "EXPENSE"
  ); // DIRECT_DEBIT et TRANSFER se classent comme des dépenses côté catégories

  const splitsJson = JSON.stringify(
    Object.entries(shares)
      .filter(([, v]) => v && Number(v) > 0)
      .map(([userId, shareAmount]) => ({ userId, shareAmount: Number(shareAmount) }))
  );

  return (
    <form action={action} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
      <h2 className="font-semibold">Ajouter une transaction</h2>

      {/* Type : boutons segmentés, plus rapides qu'un select pour un geste répété au quotidien */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setType(opt.value)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              type === opt.value
                ? "bg-green-600 text-white"
                : "bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
            }`}
          >
            {opt.label}
          </button>
        ))}
        <input type="hidden" name="type" value={type} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Montant (€)</label>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            autoFocus
            placeholder="0,00"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {state?.errors?.amount && <p className="text-xs text-red-400 mt-1">{state.errors.amount[0]}</p>}
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Libellé</label>
          <input
            name="label"
            required
            placeholder="Courses, essence..."
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {state?.errors?.label && <p className="text-xs text-red-400 mt-1">{state.errors.label[0]}</p>}
        </div>
      </div>

      {/* Compte : masqué si un seul compte existe, pas besoin de choisir */}
      {accounts.length <= 1 && accounts[0] && (
        <input type="hidden" name="accountId" value={accounts[0].id} />
      )}

      <div className="grid sm:grid-cols-3 gap-3">
        {accounts.length > 1 && (
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
        )}
        {filteredCategories.length > 0 && (
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
        )}
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
        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold py-2 px-6 rounded-lg transition"
      >
        {pending ? "Ajout..." : "Ajouter"}
      </button>
    </form>
  );
}
