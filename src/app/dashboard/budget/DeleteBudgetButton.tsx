"use client";

import { deleteBudget } from "@/app/actions/budgets";

export function DeleteBudgetButton({ budgetId }: { budgetId: string }) {
  return (
    <form action={async () => deleteBudget(budgetId)}>
      <button type="submit" className="text-xs text-red-400 hover:text-red-300">
        Supprimer
      </button>
    </form>
  );
}
