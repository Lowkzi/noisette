"use client";

import { useActionState, useState } from "react";
import { createAccount } from "@/app/actions/accounts";

const TYPE_LABELS: Record<string, string> = {
  CHECKING: "Compte courant",
  SAVINGS: "Épargne",
  CASH: "Espèces",
  OTHER: "Autre",
};

type Member = { id: string; name: string | null; email: string };

export function AccountForm({ members }: { members: Member[] }) {
  const [state, action, pending] = useActionState(createAccount, undefined);
  const [ownership, setOwnership] = useState<"INDIVIDUAL" | "JOINT">("INDIVIDUAL");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const memberIdsJson = JSON.stringify(selectedMembers);

  function toggleMember(id: string) {
    setSelectedMembers((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  }

  return (
    <form action={action} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
      <h2 className="font-semibold">Ajouter un compte</h2>
      <div className="grid sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Nom</label>
          <input
            name="name"
            required
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {state?.errors?.name && <p className="text-xs text-red-400 mt-1">{state.errors.name[0]}</p>}
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Banque (optionnel)</label>
          <input
            name="bank"
            placeholder="Crédit Mutuel, BoursoBank..."
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Type</label>
          <select
            name="type"
            defaultValue="CHECKING"
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
            defaultValue="0"
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

      {members.length > 0 && (
        <div>
          <label className="block text-xs text-slate-400 mb-1">Membres liés à ce compte</label>
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
          <input type="hidden" name="memberIds" value={memberIdsJson} />
        </div>
      )}

      {state?.message && <p className="text-sm text-red-400">{state.message}</p>}
      <button
        disabled={pending}
        type="submit"
        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold py-2 px-4 rounded-lg transition"
      >
        {pending ? "Ajout..." : "Ajouter"}
      </button>
    </form>
  );
}

export { TYPE_LABELS };
