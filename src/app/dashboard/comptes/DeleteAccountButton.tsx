"use client";

import { deleteAccount } from "@/app/actions/accounts";

export function DeleteAccountButton({ accountId }: { accountId: string }) {
  return (
    <form
      action={async () => {
        if (confirm("Supprimer ce compte et toutes ses transactions ?")) {
          await deleteAccount(accountId);
        }
      }}
    >
      <button type="submit" className="text-xs text-red-400 hover:text-red-300">
        Supprimer
      </button>
    </form>
  );
}
