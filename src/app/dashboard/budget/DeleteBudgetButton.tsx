"use client";

import { deleteBudget } from "@/app/actions/budgets";

export function DeleteBudgetButton({ budgetId, label = "Supprimer" }: { budgetId: string; label?: string }) {
  return (
    <form action={async () => deleteBudget(budgetId)}>
      <button type="submit" className="text-xs text-red-400 hover:text-red-300">
        {label}
      </button>
    </form>
  );
}
