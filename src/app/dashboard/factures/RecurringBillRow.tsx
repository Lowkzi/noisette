"use client";

import { useActionState, useState } from "react";
import {
  toggleRecurringBillActive,
  deleteRecurringBill,
  updateRecurringBill,
  payRecurringBill,
} from "@/app/actions/recurringBills";

type Category = { id: string; name: string };
type Account = { id: string; name: string };
type Bill = {
  id: string;
  label: string;
  amount: number;
  dueDayOfMonth: number;
  reminderDaysBefore: number;
  isActive: boolean;
  categoryId: string | null;
  accountId: string | null;
  lastPaidAt: Date | null;
  category: { id: string; name: string } | null;
  account: { id: string; name: string } | null;
};

function isPaidThisMonth(lastPaidAt: Date | null) {
  if (!lastPaidAt) return false;
  const paid = new Date(lastPaidAt);
  const now = new Date();
  return paid.getFullYear() === now.getFullYear() && paid.getMonth() === now.getMonth();
}

export function RecurringBillRow({
  bill,
  categories,
  accounts,
}: {
  bill: Bill;
  categories: Category[];
  accounts: Account[];
}) {
  const [editing, setEditing] = useState(false);
  const [paying, setPaying] = useState(false);
  const boundUpdate = updateRecurringBill.bind(null, bill.id);
  const [state, action, pending] = useActionState(boundUpdate, undefined);
  const paid = isPaidThisMonth(bill.lastPaidAt);

  async function handlePay() {
    setPaying(true);
    const result = await payRecurringBill(bill.id);
    setPaying(false);
    if (result.error) alert(result.error);
  }

  if (!editing) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className={`font-medium ${!bill.isActive ? "line-through text-slate-500" : ""}`}>{bill.label}</p>
          <p className="text-xs text-slate-400">
            Le {bill.dueDayOfMonth} de chaque mois
            {bill.category ? ` · ${bill.category.name}` : ""}
            {bill.account ? ` · ${bill.account.name}` : ""}
            {paid && <span className="text-emerald-400"> · Payée ce mois-ci</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="font-semibold">{bill.amount.toFixed(2)} €</p>
          {bill.isActive && (
            <button
              onClick={handlePay}
              disabled={paying || paid}
              className={`text-xs font-medium rounded-lg px-2 py-1 border transition ${
                paid
                  ? "text-emerald-400 border-emerald-800 cursor-default"
                  : "text-white bg-green-600 hover:bg-green-700 border-green-600 disabled:opacity-50"
              }`}
            >
              {paid ? "Payée ✓" : paying ? "..." : "Marquer comme payée"}
            </button>
          )}
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-slate-400 hover:text-white"
          >
            Modifier
          </button>
          <button
            onClick={() => toggleRecurringBillActive(bill.id, !bill.isActive)}
            className="text-xs text-slate-400 hover:text-white border border-slate-700 rounded-lg px-2 py-1"
          >
            {bill.isActive ? "Désactiver" : "Activer"}
          </button>
          <button
            onClick={() => deleteRecurringBill(bill.id)}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Supprimer
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
      <div className="grid sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Libellé</label>
          <input
            name="label"
            defaultValue={bill.label}
            required
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
            defaultValue={bill.amount}
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
            defaultValue={bill.dueDayOfMonth}
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
            defaultValue={bill.reminderDaysBefore}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Catégorie (optionnel)</label>
          <select
            name="categoryId"
            defaultValue={bill.categoryId ?? ""}
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
            defaultValue={bill.accountId ?? ""}
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
