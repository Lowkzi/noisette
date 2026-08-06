"use client";

import { useState } from "react";
import { updateSavingsGoalAmount, deleteSavingsGoal } from "@/app/actions/savingsGoals";

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

export function SavingsGoalRow({ goal }: { goal: Goal }) {
  const [pending, setPending] = useState(false);

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
              {below && <span>⚠️</span>} {goal.name}
            </p>
            <p className="text-xs text-slate-400">Coussin financier · {goal.account.name}</p>
          </div>
          <button
            onClick={async () => {
              setPending(true);
              await deleteSavingsGoal(goal.id);
              setPending(false);
            }}
            disabled={pending}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Supprimer
          </button>
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
        </div>
        <button
          onClick={async () => {
            setPending(true);
            await deleteSavingsGoal(goal.id);
            setPending(false);
          }}
          disabled={pending}
          className="text-xs text-red-400 hover:text-red-300"
        >
          Supprimer
        </button>
      </div>
      <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
        <div className="h-full bg-green-500" style={{ width: `${pct}%` }} />
      </div>
      <form
        action={async (formData) => {
          setPending(true);
          await updateSavingsGoalAmount(goal.id, formData);
          setPending(false);
        }}
        className="flex items-center gap-2 text-sm"
      >
        <span className="text-slate-400">
          {goal.currentAmount.toFixed(2)} € / {goal.targetAmount.toFixed(2)} € ({pct.toFixed(0)}%)
        </span>
        <input
          name="currentAmount"
          type="number"
          step="0.01"
          min="0"
          defaultValue={goal.currentAmount}
          className="w-24 rounded-lg bg-slate-800 border border-slate-700 px-2 py-1 text-sm"
        />
        <input
          name="monthlyContribution"
          type="number"
          step="0.01"
          min="0"
          placeholder="€/mois"
          defaultValue={goal.monthlyContribution ?? ""}
          className="w-24 rounded-lg bg-slate-800 border border-slate-700 px-2 py-1 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-xs py-1 px-2 rounded-lg"
        >
          Mettre à jour
        </button>
      </form>
    </div>
  );
}
