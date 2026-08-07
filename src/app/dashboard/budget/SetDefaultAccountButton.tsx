"use client";

import { useState } from "react";
import { setDefaultAccount } from "@/app/actions/accounts";

export function SetDefaultAccountButton({ accountId, isDefault }: { accountId: string; isDefault: boolean }) {
  const [pending, setPending] = useState(false);

  if (isDefault) {
    return <span className="text-xs text-slate-500 px-2">★ Compte par défaut</span>;
  }

  return (
    <button
      onClick={async () => {
        setPending(true);
        await setDefaultAccount(accountId);
        setPending(false);
      }}
      disabled={pending}
      className="text-xs text-slate-500 hover:text-white transition disabled:opacity-50 px-2"
    >
      ☆ Définir par défaut
    </button>
  );
}
