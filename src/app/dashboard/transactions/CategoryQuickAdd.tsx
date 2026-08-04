"use client";

import { useActionState } from "react";
import { createCategory } from "@/app/actions/categories";

export function CategoryQuickAdd() {
  const [state, action, pending] = useActionState(createCategory, undefined);

  return (
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
  );
}
