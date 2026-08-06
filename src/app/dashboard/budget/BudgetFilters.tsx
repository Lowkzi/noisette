"use client";

type Account = { id: string; name: string };

export function BudgetFilters({
  month,
  accountId,
  accounts,
}: {
  month: string;
  accountId: string;
  accounts: Account[];
}) {
  return (
    <form method="get" className="flex items-center gap-2">
      {accounts.length > 1 && (
        <select
          name="accountId"
          defaultValue={accountId}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      )}
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
