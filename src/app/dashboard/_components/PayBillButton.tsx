"use client";

import { useState } from "react";
import { payRecurringBill } from "@/app/actions/recurringBills";

export function PayBillButton({ billId }: { billId: string }) {
  const [paying, setPaying] = useState(false);

  async function handlePay() {
    setPaying(true);
    const result = await payRecurringBill(billId);
    setPaying(false);
    if (result.error) alert(result.error);
  }

  return (
    <button
      onClick={handlePay}
      disabled={paying}
      className="text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg px-2 py-1 transition shrink-0"
    >
      {paying ? "..." : "Marquer payée"}
    </button>
  );
}
