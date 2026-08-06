import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getHouseholdId } from "@/lib/dal";

export default async function DashboardPage() {
  const householdId = await getHouseholdId();
  if (!householdId) return <p className="text-slate-500">Foyer introuvable.</p>;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const today = now.getDate();

  const [accounts, budgets, spentThisMonth, savingsGoals, bills] = await Promise.all([
    prisma.account.findMany({ where: { householdId } }),
    prisma.budget.findMany({ where: { householdId, month: monthStart } }),
    prisma.transaction.findMany({
      where: { householdId, type: { in: ["EXPENSE", "DIRECT_DEBIT"] }, date: { gte: monthStart, lt: monthEnd } },
      select: { amount: true },
    }),
    prisma.savingsGoal.findMany({ where: { householdId }, orderBy: { createdAt: "asc" }, take: 3 }),
    prisma.recurringBill.findMany({
      where: { householdId, isActive: true },
      include: { account: true },
    }),
  ]);

  const totalBalance = accounts.reduce((s, a) => s + a.currentBalance, 0);
  const totalPlanned = budgets.reduce((s, b) => s + b.plannedAmount, 0);
  const totalSpent = spentThisMonth.reduce((s, t) => s + t.amount, 0);

  // Une couleur stable par compte (basée sur sa position), pour les badges de la section factures.
  const ACCOUNT_COLORS = ["#22c55e", "#0ea5e9", "#f59e0b", "#a78bfa", "#f43f5e", "#38bdf8"];
  const accountColor = new Map(accounts.map((a, i) => [a.id, ACCOUNT_COLORS[i % ACCOUNT_COLORS.length]]));

  const upcomingBills = bills
    .map((b) => {
      let daysUntil = b.dueDayOfMonth - today;
      if (daysUntil < 0) daysUntil += new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      return { ...b, daysUntil };
    })
    .filter((b) => b.daysUntil <= b.reminderDaysBefore || b.daysUntil <= 7)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);

  if (accounts.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold">Bienvenue sur Noisette 👋</h1>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4 max-w-md">
          <p className="text-slate-300">
            Pour commencer, crée ton premier compte (courant, épargne, espèces...). Tu pourras ensuite
            enregistrer tes dépenses et revenus.
          </p>
          <Link
            href="/dashboard/comptes"
            className="inline-block bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition"
          >
            Créer mon premier compte
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">Tableau de bord</h1>

      <div className="grid sm:grid-cols-3 gap-4">
        <Link
          href="/dashboard/comptes"
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-slate-500 transition"
        >
          <p className="text-xs text-slate-400">Solde total</p>
          <p className={`text-2xl font-bold ${totalBalance < 0 ? "text-red-400" : "text-emerald-400"}`}>
            {totalBalance.toFixed(2)} €
          </p>
          <p className="text-xs text-slate-500 mt-1">{accounts.length} compte(s)</p>
        </Link>

        <Link
          href="/dashboard/budget"
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-slate-500 transition"
        >
          <p className="text-xs text-slate-400">Dépenses du mois</p>
          <p className="text-2xl font-bold">
            {totalSpent.toFixed(2)} € {totalPlanned > 0 && <span className="text-sm text-slate-500">/ {totalPlanned.toFixed(2)} €</span>}
          </p>
          {totalPlanned > 0 && (
            <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden mt-2">
              <div
                className={`h-full ${totalSpent > totalPlanned ? "bg-red-500" : "bg-green-500"}`}
                style={{ width: `${Math.min(100, (totalSpent / totalPlanned) * 100)}%` }}
              />
            </div>
          )}
        </Link>

        <Link
          href="/dashboard/epargne"
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-slate-500 transition"
        >
          <p className="text-xs text-slate-400">Objectifs d&apos;épargne</p>
          <p className="text-2xl font-bold">{savingsGoals.length}</p>
          <p className="text-xs text-slate-500 mt-1">Voir le détail →</p>
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Factures à venir</h2>
        {upcomingBills.length === 0 ? (
          <p className="text-slate-500 text-sm">Aucune facture à venir prochainement.</p>
        ) : (
          <div className="space-y-2">
            {upcomingBills.map((b) => (
              <div
                key={b.id}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate">{b.label}</span>
                  {b.account && (
                    <span
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${accountColor.get(b.account.id)}22`,
                        color: accountColor.get(b.account.id),
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: accountColor.get(b.account.id) }}
                      />
                      {b.account.name}
                    </span>
                  )}
                </div>
                <span className="text-slate-400 text-sm shrink-0">
                  {b.amount.toFixed(2)} € · dans {b.daysUntil} j.
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Objectifs d&apos;épargne</h2>
        {savingsGoals.length === 0 ? (
          <p className="text-slate-500 text-sm">Aucun objectif pour l&apos;instant.</p>
        ) : (
          <div className="grid sm:grid-cols-3 gap-3">
            {savingsGoals.map((g) => {
              const pct = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
              return (
                <div key={g.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2">
                  <p className="font-medium">{g.name}</p>
                  <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-400">
                    {g.currentAmount.toFixed(2)} € / {g.targetAmount.toFixed(2)} €
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
