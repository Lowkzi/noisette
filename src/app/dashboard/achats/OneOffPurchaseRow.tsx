"use client";

import { toggleOneOffPurchaseBought, deleteOneOffPurchase } from "@/app/actions/oneOffPurchases";

type Purchase = { id: string; label: string; amount: number; isBought: boolean };

export function OneOffPurchaseRow({ purchase }: { purchase: Purchase }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 px-3 bg-slate-800/30 rounded-lg">
      <label className="flex items-center gap-2 min-w-0 cursor-pointer">
        <input
          type="checkbox"
          checked={purchase.isBought}
          onChange={(e) => toggleOneOffPurchaseBought(purchase.id, e.target.checked)}
        />
        <span className={`truncate ${purchase.isBought ? "line-through text-slate-500" : ""}`}>
          {purchase.label}
        </span>
      </label>
      <div className="flex items-center gap-3 shrink-0">
        <span className={purchase.isBought ? "text-slate-500" : "text-slate-200"}>
          {purchase.amount.toFixed(2)} €
        </span>
        <button
          onClick={() => deleteOneOffPurchase(purchase.id)}
          className="text-xs text-red-400 hover:text-red-300"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}
