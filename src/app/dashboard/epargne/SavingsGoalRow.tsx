"use client";

import { useActionState, useEffect, useState } from "react";
import { updateSavingsGoal, deleteSavingsGoal } from "@/app/actions/savingsGoals";

type Account = { id: string; name: string };
type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  monthlyContribution: number | null;
  isCushion: boolean;
  account: { id: string; name: string; currentBalance: number } | null;
};

export function SavingsGoalRow({ goal, accounts }: { goal: Goal; accounts: Account[] }) {
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState(false);
  const boundUpdate = updateSavingsGoal.bind(null, goal.id);
  const [state, action, formPending] = useActionState(boundUpdate, undefined);
  const [isCushion, setIsCushion] = useState(goal.isCushion);

  useEffect(() => {
    if (state?.success) setEditing(false);
  }, [state]);

  async function handleDelete() {
    setPending(true);
    await deleteSavingsGoal(goal.id);
    setPending(false);
  }

  if (editing) {
    return (
      <form action={action} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
        {accounts.length > 0 && (
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              name="isCushion"
              checked={isCushion}
              onChange={(e) => setIsCushion(e.target.checked)}
            />
            Coussin financier (alerte si un compte descend sous un seuil)
          </label>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div>
            <label className="block text-[11px] text-slate-500 mb-0.5">Nom</label>
            <input
              name="name"
              defaultValue={goal.name}
              required
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
            />
            {state?.errors?.name && <p className="text-xs text-red-400 mt-1">{state.errors.name[0]}</p>}
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 mb-0.5">
              {isCushion ? "Seuil plancher (€)" : "Montant cible (€)"}
            </label>
            <input
              name="targetAmount"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={goal.targetAmount}
              required
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
            />
          </div>

          {isCushion ? (
            <div>
              <label className="block text-[11px] text-slate-500 mb-0.5">Compte à surveiller</label>
              <select
                name="accountId"
                defaultValue={goal.account?.id ?? ""}
                required
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] text-slate-500 mb-0.5">Montant actuel (€)</label>
              <input
                name="currentAmount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={goal.currentAmount}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
              />
            </div>
          )}

          {!isCushion && (
            <>
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Date cible</label>
                <input
                  name="targetDate"
                  type="date"
                  defaultValue={goal.targetDate ? goal.targetDate.slice(0, 10) : ""}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">€/mois</label>
                <input
                  name="monthlyContribution"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="—"
                  defaultValue={goal.monthlyContribution ?? ""}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
                />
              </div>
              {accounts.length > 0 && (
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Compte</label>
                  <select
                    name="accountId"
                    defaultValue={goal.account?.id ?? ""}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
                  >
                    <option value="">Aucun</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>

        {state?.message && <p className="text-sm text-red-400">{state.message}</p>}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={formPending}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold py-1.5 px-4 rounded-lg transition"
          >
            {formPending ? "Enregistrement..." : "Enregistrer"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-sm text-slate-400 hover:text-white py-1.5 px-4"
          >
            Annuler
          </button>
        </div>
      </form>
    );
  }

  if (goal.isCushion && goal.account) {
    const balance = goal.account.currentBalance;
    const below = balance < goal.targetAmount;
    const pct = goal.targetAmount > 0 ? Math.min(100, (balance / goal.targetAmount) * 100) : 100;

    return (
      <div
        className={`border rounded-xl p-4 space-y-2 ${
          below ? "bg-red-950/30 border-red-800" : "bg-slate-800/50 border-slate-700"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium flex items-center gap-1.5">
              {below ? <span>⚠️</span> : <span className="text-emerald-400">✓</span>} {goal.name}
            </p>
            <p className="text-xs text-slate-400">Coussin financier · {goal.account.name}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => setEditing(true)} className="text-xs text-slate-400 hover:text-white">
              Modifier
            </button>
            <button onClick={handleDelete} disabled={pending} className="text-xs text-red-400 hover:text-red-300">
              Supprimer
            </button>
          </div>
        </div>
        <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
          <div className={`h-full ${below ? "bg-red-500" : "bg-green-500"}`} style={{ width: `${pct}%` }} />
        </div>
        <p className={`text-sm ${below ? "text-red-400 font-medium" : "text-slate-400"}`}>
          {balance.toFixed(2)} € {below ? "— en dessous du seuil de" : "/ seuil"} {goal.targetAmount.toFixed(2)} €
        </p>
      </div>
    );
  }

  const pct = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{goal.name}</p>
          {goal.targetDate && (
            <p className="text-xs text-slate-400">
              Échéance : {new Date(goal.targetDate).toLocaleDateString("fr-FR")}
            </p>
          )}
          {goal.monthlyContribution && goal.monthlyContribution > 0 && (
            <p className="text-xs text-sky-400">
              {goal.monthlyContribution.toFixed(2)} €/mois · {(goal.monthlyContribution * 12).toFixed(2)} €/an projeté
            </p>
          )}
          {goal.account && <p className="text-xs text-slate-500">Stocké sur : {goal.account.name}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => setEditing(true)} className="text-xs text-slate-400 hover:text-white">
            Modifier
          </button>
          <button onClick={handleDelete} disabled={pending} className="text-xs text-red-400 hover:text-red-300">
            Supprimer
          </button>
        </div>
      </div>
      <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
        <div className="h-full bg-green-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-sm text-slate-400">
        {goal.currentAmount.toFixed(2)} € / {goal.targetAmount.toFixed(2)} € ({pct.toFixed(0)}%)
      </p>
    </div>
  );
}
