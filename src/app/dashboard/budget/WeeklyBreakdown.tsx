"use client";

import { useState } from "react";

export function WeeklyBreakdown({ weeks }: { weeks: number[] }) {
  const [open, setOpen] = useState(false);
  const total = weeks.reduce((s, w) => s + w, 0);
  if (total === 0) return null;

  const max = Math.max(1, ...weeks);

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
        <div className="flex items-end gap-2 mt-2 h-16">
          {weeks.map((amount, i) =>
            amount === 0 && i >= 4 ? null : (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div className="w-full flex items-end justify-center h-10">
                  <div
                    className="w-full max-w-6 bg-sky-500 rounded-t"
                    style={{ height: `${(amount / max) * 100}%` }}
                    title={`Semaine ${i + 1} : ${amount.toFixed(2)} €`}
                  />
                </div>
                <span className="text-[10px] text-slate-500">S{i + 1}</span>
                <span className="text-[10px] text-slate-400">{amount.toFixed(0)}€</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
