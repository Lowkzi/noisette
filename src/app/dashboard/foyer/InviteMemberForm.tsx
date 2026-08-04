"use client";

import { useActionState } from "react";
import { inviteMember } from "@/app/actions/household";

export function InviteMemberForm() {
  const [state, action, pending] = useActionState(inviteMember, undefined);

  return (
    <form action={action} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
      <h2 className="font-semibold">Inviter un membre</h2>
      <div className="flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="email@exemple.fr"
          className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          disabled={pending}
          type="submit"
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold py-2 px-4 rounded-lg transition"
        >
          {pending ? "Envoi..." : "Inviter"}
        </button>
      </div>
      {state?.errors?.email && <p className="text-xs text-red-400">{state.errors.email[0]}</p>}
      {state?.message && <p className="text-sm text-red-400">{state.message}</p>}
      {state?.inviteUrl && (
        <p className="text-sm text-emerald-400 break-all">
          Lien d&apos;invitation : <span className="text-slate-300">{state.inviteUrl}</span>
        </p>
      )}
    </form>
  );
}
