"use client";

import { useActionState } from "react";
import { createCategory } from "@/app/actions/categories";
import { DeleteCategoryButton } from "./DeleteCategoryButton";

type Category = { id: string; name: string; kind: string; color: string | null };

export function CategoryQuickAdd({ categories }: { categories: Category[] }) {
  const [state, action, pending] = useActionState(createCategory, undefined);

  const expenses = categories.filter((c) => c.kind === "EXPENSE");
  const incomes = categories.filter((c) => c.kind === "INCOME");

  return (
    <div className="space-y-3">
      <h2 className="font-semibold">Catégories</h2>

      {categories.length > 0 && (
        <div className="space-y-2">
          {expenses.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {expenses.map((c) => (
                <span
                  key={c.id}
                  className="flex items-center gap-1.5 rounded-full bg-slate-800 border border-slate-700 pl-3 pr-2 py-1 text-sm"
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color ?? "#94a3b8" }} />
                  {c.name}
                  <DeleteCategoryButton categoryId={c.id} />
                </span>
              ))}
            </div>
          )}
          {incomes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {incomes.map((c) => (
                <span
                  key={c.id}
                  className="flex items-center gap-1.5 rounded-full bg-slate-800 border border-slate-700 pl-3 pr-2 py-1 text-sm"
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color ?? "#94a3b8" }} />
                  {c.name}
                  <DeleteCategoryButton categoryId={c.id} />
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <form action={action} className="flex flex-wrap items-end gap-2 text-sm">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Nouvelle catégorie</label>
          <input
            name="name"
            required
            placeholder="Courses, Loyer..."
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <select
          name="kind"
          defaultValue="EXPENSE"
          className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="EXPENSE">Dépense</option>
          <option value="INCOME">Revenu</option>
        </select>
        <button
          disabled={pending}
          type="submit"
          className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm py-1.5 px-3 rounded-lg transition"
        >
          {pending ? "..." : "Ajouter"}
        </button>
        {state?.message && <span className="text-red-400 text-xs">{state.message}</span>}
      </form>
    </div>
  );
}
