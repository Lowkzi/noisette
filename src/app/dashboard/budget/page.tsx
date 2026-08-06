import { prisma } from "@/lib/prisma";
import { getHouseholdId } from "@/lib/dal";
import { BudgetForm } from "./BudgetForm";
import { DeleteBudgetButton } from "./DeleteBudgetButton";
import { MonthPicker } from "./MonthPicker";

function sumByCategory(transactions: { amount: number; categoryId: string | null }[]) {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (!t.categoryId) continue;
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
  }
  return map;
}

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const householdId = await getHouseholdId();
  const params = await searchParams;

  if (!householdId) return <p className="text-slate-500">Foyer introuvable.</p>;

  const now = new Date();
  const month = params.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, monthNum] = month.split("-").map(Number);
  const monthStart = new Date(year, monthNum - 1, 1);
  const monthEnd = new Date(year, monthNum, 1);
  const prevMonthStart = new Date(year, monthNum - 2, 1);

  const [categories, budgets, transactions, prevTransactions] = await Promise.all([
    prisma.category.findMany({ where: { householdId, kind: "EXPENSE" }, orderBy: { name: "asc" } }),
    prisma.budget.findMany({
      where: { householdId, month: monthStart },
      include: { category: true },
    }),
    prisma.transaction.findMany({
      where: { householdId, type: { in: ["EXPENSE", "DIRECT_DEBIT"] }, date: { gte: monthStart, lt: monthEnd } },
      select: { amount: true, categoryId: true },
    }),
    prisma.transaction.findMany({
      where: {
        householdId,
        type: { in: ["EXPENSE", "DIRECT_DEBIT"] },
        date: { gte: prevMonthStart, lt: monthStart },
      },
      select: { amount: true, categoryId: true },
    }),
  ]);

  const spentByCategory = sumByCategory(transactions);
  const spentByCategoryPrev = sumByCategory(prevTransactions);
  const budgetByCategory = new Map(budgets.map((b) => [b.categoryId, b]));

  // Uniquement les catégories avec une activité ce mois-ci, le mois précédent, ou un objectif défini.
  const rows = categories
    .map((c) => ({
      category: c,
      spent: spentByCategory.get(c.id) ?? 0,
      spentPrev: spentByCategoryPrev.get(c.id) ?? 0,
      budget: budgetByCategory.get(c.id) ?? null,
    }))
    .filter((r) => r.spent > 0 || r.spentPrev > 0 || r.budget);

  const totals = rows.reduce(
    (acc, r) => ({
      spent: acc.spent + r.spent,
      spentPrev: acc.spentPrev + r.spentPrev,
      planned: acc.planned + (r.budget?.plannedAmount ?? 0),
    }),
    { spent: 0, spentPrev: 0, planned: 0 }
  );

  const monthLabel = monthStart.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const prevMonthLabel = prevMonthStart.toLocaleDateString("fr-FR", { month: "long" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Budget</h1>
        <MonthPicker month={month} />
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <p className="text-xs text-slate-400 mb-3 capitalize">{monthLabel} vs {prevMonthLabel}</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-slate-500 mb-1 capitalize">{prevMonthLabel}</p>
            <p className="text-lg font-semibold text-slate-300">{totals.spentPrev.toFixed(2)} €</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Ce mois-ci</p>
            <p
              className={`text-lg font-semibold ${
                totals.planned > 0 && totals.spent > totals.planned ? "text-red-400" : "text-white"
              }`}
            >
              {totals.spent.toFixed(2)} €
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Objectif</p>
            <p className="text-lg font-semibold text-slate-300">
              {totals.planned > 0 ? `${totals.planned.toFixed(2)} €` : "—"}
            </p>
          </div>
        </div>
      </div>

      <BudgetForm categories={categories} month={month} />

      <div className="space-y-3">
        {rows.map(({ category, spent, spentPrev, budget }) => {
          const planned = budget?.plannedAmount ?? 0;
          const pct = planned > 0 ? Math.min(100, (spent / planned) * 100) : 0;
          const over = planned > 0 && spent > planned;
          const deltaPct = spentPrev > 0 ? ((spent - spentPrev) / spentPrev) * 100 : spent > 0 ? 100 : 0;
          const deltaUp = spent > spentPrev;

          return (
            <div key={category.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-sm flex-wrap gap-1">
                <span className="font-medium">{category.name}</span>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>M-1 : {spentPrev.toFixed(2)} €</span>
                  {(spentPrev > 0 || spent > 0) && (
                    <span className={deltaUp ? "text-red-400" : "text-emerald-400"}>
                      {deltaUp ? "▲" : "▼"} {Math.abs(deltaPct).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className={over ? "text-red-400" : "text-slate-300"}>
                  {spent.toFixed(2)} € {planned > 0 && `/ ${planned.toFixed(2)} € (objectif)`}
                </span>
              </div>
              {planned > 0 && (
                <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div className={`h-full ${over ? "bg-red-500" : "bg-green-500"}`} style={{ width: `${pct}%` }} />
                </div>
              )}
              {budget && (
                <div className="flex justify-end">
                  <DeleteBudgetButton budgetId={budget.id} />
                </div>
              )}
            </div>
          );
        })}
        {rows.length === 0 && (
          <p className="text-slate-500 text-sm">Aucune dépense ni objectif pour ce mois ou le précédent.</p>
        )}
      </div>
    </div>
  );
}
