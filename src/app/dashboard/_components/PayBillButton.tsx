"use client";

import { useState } from "react";
import { payRecurringBill, unmarkRecurringBillPaid } from "@/app/actions/recurringBills";

export function PayBillButton({ billId, paid }: { billId: string; paid: boolean }) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const result = paid ? await unmarkRecurringBillPaid(billId) : await payRecurringBill(billId);
    setPending(false);
    if (result.error) alert(result.error);
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={`text-xs font-medium rounded-lg px-2 py-1 border transition shrink-0 disabled:opacity-50 ${
        paid
          ? "text-emerald-400 border-emerald-800 hover:text-red-400 hover:border-red-800"
          : "text-white bg-green-600 hover:bg-green-700 border-green-600"
      }`}
      title={paid ? "Cliquer pour annuler" : undefined}
    >
      {pending ? "..." : paid ? "✓ Annuler" : "Marquer payée"}
    </button>
  );
}
