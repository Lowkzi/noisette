"use client";

import { useActionState, useState } from "react";
import { updateTransaction } from "@/app/actions/transactions";
import { DeleteTransactionButton } from "./DeleteTransactionButton";

const TYPE_LABELS: Record<string, string> = {
  EXPENSE: "Dépense",
  INCOME: "Revenu",
  TRANSFER: "Virement",
  DIRECT_DEBIT: "Prélèvement",
};

type Account = { id: string; name: string };
type Category = { id: string; name: string; kind: string };
type Split = { user: { name: string | null; email: string }; shareAmount: number };
type Transaction = {
  id: string;
  label: string;
  amount: number;
  date: Date;
  note: string | null;
  type: string;
  isShared: boolean;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  account: Account;
  toAccount: Account | null;
  category: { id: string; name: string } | null;
  splits: Split[];
};

export function TransactionRow({
  transaction: t,
  accounts,
  categories,
  viewAccountId,
}: {
  transaction: Transaction;
  accounts: Account[];
  categories: Category[];
  viewAccountId?: string;
}) {
  const [editing, setEditing] = useState(false);
  const boundUpdate = updateTransaction.bind(null, t.id);
  const [state, action, pending] = useActionState(boundUpdate, undefined);
  const [type, setType] = useState(t.type);
  const [accountId, setAccountId] = useState(t.accountId);

  const filteredCategories = categories.filter((c) =>
    type === "INCOME" ? c.kind === "INCOME" : c.kind === "EXPENSE"
  );
  const destinationAccounts = accounts.filter((a) => a.id !== accountId);

  // Un virement est un crédit (vert, +) quand on regarde le compte de destination, un débit
  // (rouge, −) quand on regarde le compte source ou en vue "Tous les comptes".
  const isCreditView = t.type === "INCOME" || (t.type === "TRANSFER" && viewAccountId === t.toAccountId);
  const isDebitView = t.type === "EXPENSE" || t.type === "DIRECT_DEBIT" || (t.type === "TRANSFER" && viewAccountId === t.accountId);

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 bg-slate-800/30">
        <div className="min-w-0">
          <p className="font-medium truncate">{t.label}</p>
          <p className="text-xs text-slate-400">
            {new Date(t.date).toLocaleDateString("fr-FR")} · {t.account.name}
            {t.type === "TRANSFER" && t.toAccount ? ` → ${t.toAccount.name}` : ""}
            {t.category ? ` · ${t.category.name}` : ""} · {TYPE_LABELS[t.type]}
            {t.isShared && t.splits.length > 0 && (
              <>
                {" "}
                · partagé:{" "}
                {t.splits.map((s) => `${s.user.name ?? s.user.email} ${s.shareAmount.toFixed(2)}€`).join(", ")}
              </>
            )}
          </p>
        </div>
        <div className="text-right shrink-0 space-y-1">
          <p
            className={`font-semibold ${
              isCreditView ? "text-emerald-400" : isDebitView ? "text-red-400" : "text-slate-300"
            }`}
          >
            {isCreditView ? "+" : isDebitView ? "-" : ""}
            {t.amount.toFixed(2)} €
          </p>
          <div className="flex items-center gap-2 justify-end">
            <button onClick={() => setEditing(true)} className="text-xs text-slate-400 hover:text-white">
              Modifier
            </button>
            <DeleteTransactionButton transactionId={t.id} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="p-3 bg-slate-800/30 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(["EXPENSE", "INCOME", "TRANSFER", "DIRECT_DEBIT"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setType(opt)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              type === opt
                ? "bg-green-600 text-white"
                : "bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
            }`}
          >
            {TYPE_LABELS[opt]}
          </button>
        ))}
        <input type="hidden" name="type" value={type} />
      </div>

      <div className="grid sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Montant (€)</label>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={t.amount}
            required
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {state?.errors?.amount && <p className="text-xs text-red-400 mt-1">{state.errors.amount[0]}</p>}
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Libellé</label>
          <input
            name="label"
            defaultValue={t.label}
            required
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {state?.errors?.label && <p className="text-xs text-red-400 mt-1">{state.errors.label[0]}</p>}
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            {type === "TRANSFER" ? "Compte débité" : "Compte"}
          </label>
          <select
            name="accountId"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        {type === "TRANSFER" ? (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Compte crédité</label>
            <select
              name="toAccountId"
              defaultValue={t.toAccountId ?? ""}
              required
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {destinationAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            {state?.errors?.toAccountId && (
              <p className="text-xs text-red-400 mt-1">{state.errors.toAccountId[0]}</p>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Catégorie</label>
            <select
              name="categoryId"
              defaultValue={t.categoryId ?? ""}
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
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Date</label>
          <input
            name="date"
            type="date"
            defaultValue={new Date(t.date).toISOString().slice(0, 10)}
            required
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Note (optionnel)</label>
          <input
            name="note"
            defaultValue={t.note ?? ""}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {state?.message && <p className="text-sm text-red-400">{state.message}</p>}
      <div className="flex items-center gap-2">
        <button
          disabled={pending}
          type="submit"
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold py-2 px-4 rounded-lg transition"
        >
          {pending ? "Enregistrement..." : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-sm text-slate-400 hover:text-white py-2 px-4"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
