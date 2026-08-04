"use client";

import { deleteTransaction } from "@/app/actions/transactions";

export function DeleteTransactionButton({ transactionId }: { transactionId: string }) {
  return (
    <form
      action={async () => {
        await deleteTransaction(transactionId);
      }}
    >
      <button type="submit" className="text-xs text-red-400 hover:text-red-300">
        Supprimer
      </button>
    </form>
  );
}
