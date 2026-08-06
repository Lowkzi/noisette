"use client";

import { useState } from "react";
import { upsertBudgetWeek } from "@/app/actions/budgets";

export function WeeklyBreakdown({
  weeks,
  plannedWeeks,
  budgetId,
}: {
  weeks: number[];
  plannedWeeks: number[];
  budgetId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(plannedWeeks);
  const [saving, setSaving] = useState<number | null>(null);
  const total = weeks.reduce((s, w) => s + w, 0);
  const totalPlanned = plannedWeeks.reduce((s, w) => s + w, 0);
  if (total === 0 && totalPlanned === 0 && !budgetId) return null;

  const max = Math.max(1, ...weeks, ...values);

  async function handleBlur(i: number) {
    if (!budgetId) return;
    if (values[i] === plannedWeeks[i]) return;
    setSaving(i);
    await upsertBudgetWeek(budgetId, i, values[i]);
    setSaving(null);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-slate-500 hover:text-slate-300 transition"
      >
        {open ? "− Masquer le détail par semaine" : "+ Détail par semaine"}
      </button>
      {open && (
        <div className="flex items-end gap-2 mt-2">
          {[0, 1, 2, 3, 4].map((i) =>
            weeks[i] === 0 && values[i] === 0 && i >= 4 ? null : (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div className="w-full flex items-end justify-center h-10">
                  <div
                    className="w-full max-w-6 bg-sky-500 rounded-t"
                    style={{ height: `${(weeks[i] / max) * 100}%` }}
                    title={`Semaine ${i + 1} : ${weeks[i].toFixed(2)} €`}
                  />
                </div>
                <span className="text-[10px] text-slate-500">S{i + 1}</span>
                <span className="text-[10px] text-slate-400">{weeks[i].toFixed(0)}€</span>
                {budgetId && (
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={values[i] || ""}
                    placeholder="0"
                    onChange={(e) =>
                      setValues((v) => v.map((x, idx) => (idx === i ? Number(e.target.value) || 0 : x)))
                    }
                    onBlur={() => handleBlur(i)}
                    disabled={saving === i}
                    className="w-12 text-center text-[10px] rounded bg-slate-800 border border-slate-700 px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                )}
              </div>
            )
          )}
        </div>
      )}
      {open && budgetId && (
        <p className="text-[10px] text-slate-500 mt-1">Cible par semaine (€) — modifiable, s&apos;enregistre au clic ailleurs.</p>
      )}
    </div>
  );
}
