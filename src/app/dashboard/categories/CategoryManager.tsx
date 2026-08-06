"use client";

import { useActionState, useState } from "react";
import { createCategory } from "@/app/actions/categories";
import { DeleteCategoryButton } from "../transactions/DeleteCategoryButton";

type Category = { id: string; name: string; kind: string; color: string | null };

const COLORS = [
  "#22c55e",
  "#0ea5e9",
  "#f59e0b",
  "#f97316",
  "#a78bfa",
  "#f43f5e",
  "#38bdf8",
  "#eab308",
  "#94a3b8",
];

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [state, action, pending] = useActionState(createCategory, undefined);
  const [kind, setKind] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [color, setColor] = useState(COLORS[0]);

  const expenses = categories.filter((c) => c.kind === "EXPENSE");
  const incomes = categories.filter((c) => c.kind === "INCOME");

  return (
    <div className="space-y-6 max-w-lg">
      <form action={action} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">Nouvelle catégorie</h2>

        <div className="flex gap-2">
          {(["EXPENSE", "INCOME"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                kind === k
                  ? "bg-green-600 text-white"
                  : "bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              {k === "EXPENSE" ? "Dépense" : "Revenu"}
            </button>
          ))}
          <input type="hidden" name="kind" value={kind} />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Nom</label>
          <input
            name="name"
            required
            autoFocus
            placeholder="Courses, Loyer..."
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {state?.errors?.name && <p className="text-xs text-red-400 mt-1">{state.errors.name[0]}</p>}
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Couleur</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition ${
                  color === c ? "ring-2 ring-offset-2 ring-offset-slate-900 ring-white" : ""
                }`}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
            <input type="hidden" name="color" value={color} />
          </div>
        </div>

        {state?.message && <p className="text-sm text-red-400">{state.message}</p>}
        <button
          disabled={pending}
          type="submit"
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold py-2 px-4 rounded-lg transition"
        >
          {pending ? "Ajout..." : "Ajouter"}
        </button>
      </form>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-2">Dépenses</h3>
          {expenses.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune catégorie de dépense.</p>
          ) : (
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
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-2">Revenus</h3>
          {incomes.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune catégorie de revenu.</p>
          ) : (
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
      </div>
    </div>
  );
}
