import { prisma } from "@/lib/prisma";
import { getHouseholdId } from "@/lib/dal";
import { BudgetForm } from "./BudgetForm";
import { DeleteBudgetButton } from "./DeleteBudgetButton";
import { MonthPicker } from "./MonthPicker";

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

  const [categories, budgets, transactions] = await Promise.all([
    prisma.category.findMany({ where: { householdId, kind: "EXPENSE" }, orderBy: { name: "asc" } }),
    prisma.budget.findMany({
      where: { householdId, month: monthStart },
      include: { category: true },
    }),
    prisma.transaction.findMany({
      where: { householdId, type: { in: ["EXPENSE", "DIRECT_DEBIT"] }, date: { gte: monthStart, lt: monthEnd } },
      select: { amount: true, categoryId: true },
    }),
  ]);

  const spentByCategory = new Map<string, number>();
  for (const t of transactions) {
    if (!t.categoryId) continue;
    spentByCategory.set(t.categoryId, (spentByCategory.get(t.categoryId) ?? 0) + t.amount);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Budget</h1>
        <MonthPicker month={month} />
      </div>

      <BudgetForm categories={categories} month={month} />

      <div className="space-y-3">
        {budgets.map((b) => {
          const spent = spentByCategory.get(b.categoryId) ?? 0;
          const pct = b.plannedAmount > 0 ? Math.min(100, (spent / b.plannedAmount) * 100) : 0;
          const over = spent > b.plannedAmount;
          return (
            <div key={b.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{b.category.name}</span>
                <span className={over ? "text-red-400" : "text-slate-300"}>
                  {spent.toFixed(2)} € / {b.plannedAmount.toFixed(2)} €
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className={`h-full ${over ? "bg-red-500" : "bg-green-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-end">
                <DeleteBudgetButton budgetId={b.id} />
              </div>
            </div>
          );
        })}
        {budgets.length === 0 && (
          <p className="text-slate-500 text-sm">Aucun budget défini pour ce mois.</p>
        )}
      </div>
    </div>
  );
}
