"use client";

import { toggleRecurringBillActive, deleteRecurringBill } from "@/app/actions/recurringBills";

type Bill = {
  id: string;
  label: string;
  amount: number;
  dueDayOfMonth: number;
  isActive: boolean;
  category: { name: string } | null;
  account: { name: string } | null;
};

export function RecurringBillRow({ bill }: { bill: Bill }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
      <div>
        <p className={`font-medium ${!bill.isActive ? "line-through text-slate-500" : ""}`}>{bill.label}</p>
        <p className="text-xs text-slate-400">
          Le {bill.dueDayOfMonth} de chaque mois
          {bill.category ? ` · ${bill.category.name}` : ""}
          {bill.account ? ` · ${bill.account.name}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <p className="font-semibold">{bill.amount.toFixed(2)} €</p>
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
