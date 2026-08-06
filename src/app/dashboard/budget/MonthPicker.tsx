"use client";

export function MonthPicker({ month }: { month: string }) {
  return (
    <form method="get">
      <input
        type="month"
        name="month"
        defaultValue={month}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm"
      />
    </form>
  );
}
