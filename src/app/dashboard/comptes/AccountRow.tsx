"use client";

import { useActionState, useState } from "react";
import { updateAccount } from "@/app/actions/accounts";
import { DeleteAccountButton } from "./DeleteAccountButton";
import { TYPE_LABELS } from "./AccountForm";

type Member = { id: string; name: string | null; email: string };
type Account = {
  id: string;
  name: string;
  type: string;
  ownership: string;
  currentBalance: number;
  members: Member[];
};

export function AccountRow({ account, members }: { account: Account; members: Member[] }) {
  const [editing, setEditing] = useState(false);
  const boundUpdate = updateAccount.bind(null, account.id);
  const [state, action, pending] = useActionState(boundUpdate, undefined);
  const [ownership, setOwnership] = useState<"INDIVIDUAL" | "JOINT">(
    account.ownership as "INDIVIDUAL" | "JOINT"
  );
  const [selectedMembers, setSelectedMembers] = useState<string[]>(account.members.map((m) => m.id));

  function toggleMember(id: string) {
    setSelectedMembers((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  }

  if (!editing) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold">{account.name}</p>
            <span
              className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
                account.ownership === "JOINT" ? "bg-sky-500/15 text-sky-400" : "bg-slate-700/50 text-slate-400"
              }`}
            >
              {account.ownership === "JOINT" ? "Joint" : "Individuel"}
            </span>
          </div>
          <p className="text-xs text-slate-400">{TYPE_LABELS[account.type]}</p>
          {account.ownership === "JOINT" && account.members.length > 0 && (
            <p className="text-xs text-slate-500 mt-1">{account.members.map((m) => m.name ?? m.email).join(", ")}</p>
          )}
        </div>
        <div className="text-right space-y-1 shrink-0">
          <p className={`font-semibold ${account.currentBalance < 0 ? "text-red-400" : "text-emerald-400"}`}>
            {account.currentBalance.toFixed(2)} €
          </p>
          <div className="flex items-center gap-2 justify-end">
            <button onClick={() => setEditing(true)} className="text-xs text-slate-400 hover:text-white">
              Modifier
            </button>
            <DeleteAccountButton accountId={account.id} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Nom</label>
          <input
            name="name"
            defaultValue={account.name}
            required
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {state?.errors?.name && <p className="text-xs text-red-400 mt-1">{state.errors.name[0]}</p>}
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Type</label>
          <select
            name="type"
            defaultValue={account.type}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Solde actuel (€)</label>
          <input
            name="currentBalance"
            type="number"
            step="0.01"
            defaultValue={account.currentBalance}
            required
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {state?.errors?.currentBalance && (
            <p className="text-xs text-red-400 mt-1">{state.errors.currentBalance[0]}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1">Propriété</label>
        <div className="flex gap-2">
          {(["INDIVIDUAL", "JOINT"] as const).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOwnership(o)}
              className={`flex-1 sm:flex-none sm:w-40 rounded-lg px-3 py-2 text-sm font-medium transition ${
                ownership === o
                  ? "bg-green-600 text-white"
                  : "bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              {o === "INDIVIDUAL" ? "Individuel" : "Joint"}
            </button>
          ))}
          <input type="hidden" name="ownership" value={ownership} />
        </div>
      </div>

      {ownership === "JOINT" && members.length > 0 && (
        <div>
          <label className="block text-xs text-slate-400 mb-1">Membres affiliés</label>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMember(m.id)}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  selectedMembers.includes(m.id)
                    ? "bg-sky-600 text-white"
                    : "bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                {m.name ?? m.email}
              </button>
            ))}
          </div>
          <input type="hidden" name="memberIds" value={JSON.stringify(selectedMembers)} />
        </div>
      )}

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
