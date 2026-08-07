"use client";

import { useState } from "react";
import { payRecurringBill, unmarkRecurringBillPaid } from "@/app/actions/recurringBills";

export function PayBillButton({
  billId,
  amount,
  paid,
  overdue = false,
}: {
  billId: string;
  amount: number;
  paid: boolean;
  overdue?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(amount.toString());

  async function handleUnmark() {
    setPending(true);
    const result = await unmarkRecurringBillPaid(billId);
    setPending(false);
    if (result.error) alert(result.error);
  }

  async function handleConfirm() {
    setPending(true);
    const result = await payRecurringBill(billId, Number(value));
    setPending(false);
    if (result.error) alert(result.error);
    else setEditing(false);
  }

  if (paid) {
    return (
      <button
        onClick={handleUnmark}
        disabled={pending}
        className="text-xs font-medium rounded-lg px-2 py-1 border transition shrink-0 disabled:opacity-50 text-emerald-400 border-emerald-800 hover:text-red-400 hover:border-red-800"
        title="Cliquer pour annuler"
      >
        {pending ? "..." : "✓ Annuler"}
      </button>
    );
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1 shrink-0">
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          className="w-20 text-xs rounded-lg bg-slate-800 border border-slate-700 px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        <button
          onClick={handleConfirm}
          disabled={pending}
          className="text-xs font-medium rounded-lg px-2 py-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
        >
          {pending ? "..." : "OK"}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="text-xs text-slate-400 hover:text-white px-1"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`text-xs font-medium rounded-lg px-2 py-1 border transition shrink-0 ${
        overdue
          ? "text-white bg-amber-600 hover:bg-amber-700 border-amber-600"
          : "text-white bg-green-600 hover:bg-green-700 border-green-600"
      }`}
      title={overdue ? "Confirmer que le prélèvement/versement a bien eu lieu" : undefined}
    >
      {overdue ? "Valider" : "Marquer payée"}
    </button>
  );
}
