"use client";

import { useState } from "react";
import { payRecurringBill, unmarkRecurringBillPaid } from "@/app/actions/recurringBills";

export function PayBillButton({
  billId,
  paid,
  overdue = false,
}: {
  billId: string;
  paid: boolean;
  overdue?: boolean;
}) {
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
          : overdue
            ? "text-white bg-amber-600 hover:bg-amber-700 border-amber-600"
            : "text-white bg-green-600 hover:bg-green-700 border-green-600"
      }`}
      title={paid ? "Cliquer pour annuler" : overdue ? "Confirmer que le prélèvement/versement a bien eu lieu" : undefined}
    >
      {pending ? "..." : paid ? "✓ Annuler" : overdue ? "Valider" : "Marquer payée"}
    </button>
  );
}
