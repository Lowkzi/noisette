import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getHouseholdId } from "@/lib/dal";
import { PayBillButton } from "./_components/PayBillButton";

function isPaidThisMonth(lastPaidAt: Date | null) {
  if (!lastPaidAt) return false;
  const paid = new Date(lastPaidAt);
  const now = new Date();
  return paid.getFullYear() === now.getFullYear() && paid.getMonth() === now.getMonth();
}

function isOverdue(dueDayOfMonth: number) {
  return new Date().getDate() > dueDayOfMonth;
}

export default async function DashboardPage() {
  const householdId = await getHouseholdId();
  if (!householdId) return <p className="text-slate-500">Foyer introuvable.</p>;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const today = now.getDate();

  const [accounts, budgets, expenseTransactionsThisMonth, savingsGoals, cushions, bills] = await Promise.all([
    prisma.account.findMany({ where: { householdId } }),
    // Tous les objectifs jusqu'à ce mois inclus (report automatique par compte + catégorie),
    // pour construire les rappels d'objectifs affichés sur le tableau de bord.
    prisma.budget.findMany({
      where: { householdId, month: { lte: monthStart } },
      include: { category: true, account: true },
      orderBy: { month: "asc" },
    }),
    prisma.transaction.findMany({
      where: { householdId, type: { in: ["EXPENSE", "DIRECT_DEBIT"] }, date: { gte: monthStart, lt: monthEnd } },
      select: { amount: true, accountId: true, categoryId: true },
    }),
    prisma.savingsGoal.findMany({ where: { householdId }, orderBy: { createdAt: "asc" }, take: 3 }),
    prisma.savingsGoal.findMany({ where: { householdId, isCushion: true }, include: { account: true } }),
    prisma.recurringBill.findMany({
      where: { householdId, isActive: true },
      include: { account: true },
    }),
  ]);

  const totalSpent = expenseTransactionsThisMonth.reduce((s, t) => s + t.amount, 0);

  // Le dernier objectif par (compte, catégorie) dans la liste triée par mois croissant est celui
  // applicable à ce mois-ci (défini ce mois-ci, ou reporté d'un mois antérieur).
  const latestBudgetByAccountCategory = new Map<string, (typeof budgets)[number]>();
  for (const b of budgets) latestBudgetByAccountCategory.set(`${b.accountId}:${b.categoryId}`, b);
  const budgetReminders = [...latestBudgetByAccountCategory.values()];

  const spentByAccountCategory = new Map<string, number>();
  for (const t of expenseTransactionsThisMonth) {
    if (!t.categoryId) continue;
    const key = `${t.accountId}:${t.categoryId}`;
    spentByAccountCategory.set(key, (spentByAccountCategory.get(key) ?? 0) + t.amount);
  }

  const totalPlanned = budgetReminders.reduce((s, b) => s + b.plannedAmount, 0);

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

  const cushionsBelow = cushions.filter((g) => g.account && g.account.currentBalance < g.targetAmount);
  // "Presque entamé" : solde encore au-dessus du seuil mais à moins de 10% de celui-ci.
  const cushionsNear = cushions.filter(
    (g) => g.account && g.account.currentBalance >= g.targetAmount && g.account.currentBalance < g.targetAmount * 1.1
  );

  function tileStatus(groupAccounts: { id: string }[]) {
    if (groupAccounts.some((a) => cushionsBelow.some((g) => g.accountId === a.id))) return "breached" as const;
    if (groupAccounts.some((a) => cushionsNear.some((g) => g.accountId === a.id))) return "near" as const;
    return "ok" as const;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold">Tableau de bord</h1>
        <Link
          href="/dashboard/transactions"
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition"
        >
          + Ajouter une dépense
        </Link>
      </div>

      {cushionsBelow.length > 0 && (
        <div className="bg-red-950/30 border border-red-800 rounded-xl p-4 space-y-1">
          <p className="text-sm font-semibold text-red-400">⚠️ Coussin financier entamé</p>
          {cushionsBelow.map((g) => (
            <p key={g.id} className="text-sm text-red-300">
              {g.account!.name} : {g.account!.currentBalance.toFixed(2)} € (sous le seuil de{" "}
              {g.targetAmount.toFixed(2)} €)
            </p>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            key: "personal-checking",
            label: "Compte courant perso",
            accounts: accounts.filter((a) => a.ownership === "INDIVIDUAL" && a.type !== "SAVINGS"),
            baseClass: "border-sky-400/30 bg-sky-400/5",
          },
          {
            key: "personal-savings",
            label: "Épargne perso",
            accounts: accounts.filter((a) => a.ownership === "INDIVIDUAL" && a.type === "SAVINGS"),
            baseClass: "border-pink-400/30 bg-pink-400/5",
          },
          {
            key: "joint",
            label: "Compte joint",
            accounts: accounts.filter((a) => a.ownership === "JOINT"),
            baseClass: "border-violet-400/30 bg-violet-400/5",
          },
        ].map((group) => {
          if (group.accounts.length === 0) return null;
          const total = group.accounts.reduce((s, a) => s + a.currentBalance, 0);
          const status = tileStatus(group.accounts);
          const statusClass =
            status === "breached"
              ? "border-red-400/40 bg-red-400/10"
              : status === "near"
                ? "border-amber-400/40 bg-amber-400/10"
                : group.baseClass;
          return (
            <Link
              key={group.key}
              href="/dashboard/comptes"
              className={`border rounded-xl p-4 hover:border-slate-500 transition ${statusClass}`}
            >
              <p className="text-xs text-slate-400">
                {group.label}
                {status === "breached" && " ⚠️"}
                {status === "near" && " ⚡"}
              </p>
              <p className={`text-2xl font-bold ${total < 0 ? "text-red-400" : "text-emerald-400"}`}>
                {total.toFixed(2)} €
              </p>
              <div className="mt-2 pt-2 border-t border-slate-700/50 space-y-1">
                {group.accounts.map((a) => {
                  const cushionBreached = cushionsBelow.some((g) => g.accountId === a.id);
                  const cushionNear = cushionsNear.some((g) => g.accountId === a.id);
                  const isNegative = a.currentBalance < 0;
                  return (
                    <div key={a.id} className="flex items-center justify-between text-xs">
                      <span
                        className={`truncate ${
                          cushionBreached ? "text-red-400" : cushionNear ? "text-amber-400" : "text-slate-400"
                        }`}
                      >
                        {cushionBreached && "⚠️ "}
                        {cushionNear && "⚡ "}
                        {a.name}
                      </span>
                      <span
                        className={
                          cushionBreached || isNegative ? "text-red-400" : cushionNear ? "text-amber-400" : "text-slate-300"
                        }
                      >
                        {a.currentBalance.toFixed(2)} €
                      </span>
                    </div>
                  );
                })}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
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

      {budgetReminders.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Objectifs du mois</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {budgetReminders.map((b) => {
              const spent = spentByAccountCategory.get(`${b.accountId}:${b.categoryId}`) ?? 0;
              const pct = b.plannedAmount > 0 ? Math.min(100, (spent / b.plannedAmount) * 100) : 0;
              const over = spent > b.plannedAmount;
              return (
                <div key={b.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{b.category.name}</span>
                    <span
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${accountColor.get(b.accountId)}22`,
                        color: accountColor.get(b.accountId),
                      }}
                    >
                      {b.account.name}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div className={`h-full ${over ? "bg-red-500" : "bg-green-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className={`text-xs ${over ? "text-red-400" : "text-slate-400"}`}>
                    {spent.toFixed(2)} € / {b.plannedAmount.toFixed(2)} €
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

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
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-400 text-sm">
                    {b.amount.toFixed(2)} € · dans {b.daysUntil} j.
                  </span>
                  {b.accountId && (
                    <PayBillButton
                      billId={b.id}
                      amount={b.amount}
                      paid={isPaidThisMonth(b.lastPaidAt)}
                      overdue={isOverdue(b.dueDayOfMonth)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-semibold">Objectifs d&apos;épargne</h2>
          {totalPlanned > 0 && (
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                totalSpent > totalPlanned ? "bg-red-500/15 text-red-400" : "bg-green-500/15 text-green-400"
              }`}
            >
              {totalSpent > totalPlanned
                ? `Budget dépassé de ${(totalSpent - totalPlanned).toFixed(2)} €`
                : `Budget respecté (reste ${(totalPlanned - totalSpent).toFixed(2)} €)`}
            </span>
          )}
        </div>
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
