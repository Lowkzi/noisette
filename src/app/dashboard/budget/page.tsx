import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getHouseholdId } from "@/lib/dal";
import { buildPieSlices } from "@/lib/pie";
import { BudgetForm } from "./BudgetForm";
import { DeleteBudgetButton } from "./DeleteBudgetButton";
import { BudgetFilters } from "./BudgetFilters";
import { WeeklyBreakdown } from "./WeeklyBreakdown";

function sumByCategory(transactions: { amount: number; categoryId: string | null }[]) {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (!t.categoryId) continue;
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
  }
  return map;
}

// Regroupe les dépenses d'une catégorie par semaine calendaire du mois (semaine 1 = jours 1-7, etc).
function weeklyTotalsByCategory(transactions: { amount: number; categoryId: string | null; date: Date }[]) {
  const map = new Map<string, number[]>();
  for (const t of transactions) {
    if (!t.categoryId) continue;
    const week = Math.min(4, Math.floor((t.date.getDate() - 1) / 7));
    const weeks = map.get(t.categoryId) ?? [0, 0, 0, 0, 0];
    weeks[week] += t.amount;
    map.set(t.categoryId, weeks);
  }
  return map;
}

function isReceivedThisMonth(lastPaidAt: Date | null, now: Date) {
  if (!lastPaidAt) return false;
  return lastPaidAt.getFullYear() === now.getFullYear() && lastPaidAt.getMonth() === now.getMonth();
}

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; accountId?: string }>;
}) {
  const householdId = await getHouseholdId();
  const params = await searchParams;

  if (!householdId) return <p className="text-slate-500">Foyer introuvable.</p>;

  const accounts = await prisma.account.findMany({ where: { householdId }, orderBy: { name: "asc" } });

  if (accounts.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold">Budget</h1>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2">
          <p className="font-semibold">Ajoute d&apos;abord un compte</p>
          <p className="text-sm text-slate-400">
            Un objectif de budget est toujours rattaché à un compte précis.
          </p>
          <Link
            href="/dashboard/comptes"
            className="inline-block bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    );
  }

  const accountId = accounts.some((a) => a.id === params.accountId) ? params.accountId! : accounts[0].id;
  const selectedAccount = accounts.find((a) => a.id === accountId)!;

  const now = new Date();
  const month = params.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, monthNum] = month.split("-").map(Number);
  const monthStart = new Date(year, monthNum - 1, 1);
  const monthEnd = new Date(year, monthNum, 1);
  const prevMonthStart = new Date(year, monthNum - 2, 1);
  const isCurrentMonth = now >= monthStart && now < monthEnd;

  const [categories, budgets, transactions, prevTransactions, incomeTransactions, incomeBills] =
    await Promise.all([
      prisma.category.findMany({ where: { householdId, kind: "EXPENSE" }, orderBy: { name: "asc" } }),
      // Tous les objectifs définis jusqu'à ce mois inclus, pour ce compte : le plus récent par
      // catégorie fait foi pour ce mois (report automatique), sauf override explicite sur ce mois.
      prisma.budget.findMany({
        where: { householdId, accountId, month: { lte: monthStart } },
        include: { category: true, weeks: true },
        orderBy: { month: "asc" },
      }),
      prisma.transaction.findMany({
        where: {
          householdId,
          accountId,
          type: { in: ["EXPENSE", "DIRECT_DEBIT"] },
          date: { gte: monthStart, lt: monthEnd },
        },
        select: { amount: true, categoryId: true, date: true },
      }),
      prisma.transaction.findMany({
        where: {
          householdId,
          accountId,
          type: { in: ["EXPENSE", "DIRECT_DEBIT"] },
          date: { gte: prevMonthStart, lt: monthStart },
        },
        select: { amount: true, categoryId: true },
      }),
      prisma.transaction.findMany({
        where: { householdId, accountId, type: "INCOME", date: { gte: monthStart, lt: monthEnd } },
        select: { amount: true, label: true },
      }),
      prisma.recurringBill.findMany({
        where: { householdId, accountId, kind: "INCOME", isActive: true },
      }),
    ]);

  const spentByCategory = sumByCategory(transactions);
  const spentByCategoryPrev = sumByCategory(prevTransactions);
  const weeklyByCategory = weeklyTotalsByCategory(transactions);
  // budgets est trié par mois croissant : le dernier de la liste pour une catégorie donnée est
  // donc le plus récent applicable à ce mois (défini ce mois-ci, ou reporté d'un mois antérieur).
  const budgetByCategory = new Map(budgets.map((b) => [b.categoryId, b]));

  // Uniquement les catégories avec une activité ce mois-ci, le mois précédent, ou un objectif défini.
  const rows = categories
    .map((c) => {
      const budget = budgetByCategory.get(c.id) ?? null;
      return {
        category: c,
        spent: spentByCategory.get(c.id) ?? 0,
        spentPrev: spentByCategoryPrev.get(c.id) ?? 0,
        budget,
        isInherited: !!budget && budget.month.getTime() !== monthStart.getTime(),
      };
    })
    .filter((r) => r.spent > 0 || r.spentPrev > 0 || r.budget);

  const totals = rows.reduce(
    (acc, r) => ({
      spent: acc.spent + r.spent,
      spentPrev: acc.spentPrev + r.spentPrev,
      planned: acc.planned + (r.budget?.plannedAmount ?? 0),
    }),
    { spent: 0, spentPrev: 0, planned: 0 }
  );

  const totalIncome = incomeTransactions.reduce((s, t) => s + t.amount, 0);
  // Revenus récurrents attendus ce mois-ci mais pas encore marqués comme reçus (seulement pertinent
  // pour le mois en cours ; un mois passé/futur n'a pas de statut "reçu" à afficher).
  const expectedIncome = isCurrentMonth
    ? incomeBills.filter((b) => !isReceivedThisMonth(b.lastPaidAt, now))
    : [];
  const netBalance = totalIncome - totals.spent;

  const pieSlices = buildPieSlices(rows.map((r) => ({ name: r.category.name, amount: r.spent })));

  const monthLabel = monthStart.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const prevMonthLabel = prevMonthStart.toLocaleDateString("fr-FR", { month: "long" });

  // Aucun objectif défini pour ce compte, jamais (même dans un mois antérieur) : première
  // utilisation, on invite explicitement à saisir les objectifs plutôt que de cacher le formulaire.
  const hasAnyBudgetForAccount = await prisma.budget.count({ where: { householdId, accountId } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold">Budget</h1>
        <BudgetFilters month={month} accountId={accountId} accounts={accounts} />
      </div>
      {accounts.length > 1 && (
        <p className="text-xs text-slate-500 -mt-4">
          Objectifs propres au compte <span className="text-slate-300">{selectedAccount.name}</span>.
        </p>
      )}

      {/* Entrées / Sorties d'argent, comme le récapitulatif en tête de l'ancien fichier Excel. */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Entrées d&apos;argent</p>
          {incomeTransactions.length === 0 && expectedIncome.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun revenu enregistré ce mois-ci.</p>
          ) : (
            <div className="space-y-1 text-sm">
              {incomeTransactions.map((t, i) => (
                <div key={i} className="flex items-center justify-between text-slate-300">
                  <span>{t.label}</span>
                  <span>{t.amount.toFixed(2)} €</span>
                </div>
              ))}
              {expectedIncome.map((b) => (
                <div key={b.id} className="flex items-center justify-between text-slate-500 italic">
                  <span>{b.label} (attendu)</span>
                  <span>{b.amount.toFixed(2)} €</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between text-sm font-semibold pt-2 border-t border-slate-700">
            <span>TOTAL</span>
            <span className="text-emerald-400">{totalIncome.toFixed(2)} €</span>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">Sorties d&apos;argent</p>
          {rows.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune dépense ce mois-ci.</p>
          ) : (
            <div className="space-y-1 text-sm">
              {rows.map(({ category, spent }) => (
                <div key={category.id} className="flex items-center justify-between text-slate-300">
                  <span>{category.name}</span>
                  <span>{spent.toFixed(2)} €</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between text-sm font-semibold pt-2 border-t border-slate-700">
            <span>DÉPENSES TOTALES</span>
            <span className="text-red-400">{totals.spent.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
        <span className="text-sm text-slate-400">Solde net du mois</span>
        <span className={`text-lg font-bold ${netBalance < 0 ? "text-red-400" : "text-emerald-400"}`}>
          {netBalance.toFixed(2)} €
        </span>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <p className="text-xs text-slate-400 mb-3 capitalize">{monthLabel} vs {prevMonthLabel}</p>
        <div className="grid sm:grid-cols-2 gap-6 items-center">
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

          {pieSlices.length > 0 && pieSlices[0].total > 0 && (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <svg viewBox="0 0 200 200" className="w-32 h-32 shrink-0">
                {pieSlices.map((s) => (
                  <path key={s.name} d={s.path} fill={s.color} />
                ))}
              </svg>
              <ul className="space-y-1 text-xs">
                {pieSlices.map((s) => (
                  <li key={s.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-slate-300">{s.name}</span>
                    <span className="text-slate-500">
                      {s.total > 0 ? ((s.amount / s.total) * 100).toFixed(0) : 0}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {hasAnyBudgetForAccount === 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-slate-300">
            Aucun objectif défini pour <span className="font-medium">{selectedAccount.name}</span> — indique
            combien tu comptes dépenser dans chaque catégorie ce mois-ci.
          </p>
          <BudgetForm categories={categories} accounts={accounts} month={month} defaultAccountId={accountId} invite />
        </div>
      ) : (
        <BudgetForm categories={categories} accounts={accounts} month={month} defaultAccountId={accountId} />
      )}

      <div className="space-y-3">
        {rows.map(({ category, spent, spentPrev, budget, isInherited }) => {
          const planned = budget?.plannedAmount ?? 0;
          const pct = planned > 0 ? Math.min(100, (spent / planned) * 100) : 0;
          const over = planned > 0 && spent > planned;
          const deltaPct = spentPrev > 0 ? ((spent - spentPrev) / spentPrev) * 100 : spent > 0 ? 100 : 0;
          const deltaUp = spent > spentPrev;
          const plannedWeeks = [0, 0, 0, 0, 0];
          if (budget) {
            for (const w of budget.weeks) plannedWeeks[w.weekIndex] = w.plannedAmount;
          }

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
              <div className="flex items-center justify-between text-sm flex-wrap gap-1">
                <span className={over ? "text-red-400" : "text-slate-300"}>
                  {spent.toFixed(2)} € {planned > 0 && `/ ${planned.toFixed(2)} € (objectif)`}
                </span>
                {isInherited && planned > 0 && (
                  <span className="text-xs text-slate-500">
                    reporté depuis {budget!.month.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                  </span>
                )}
              </div>
              {planned > 0 && (
                <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div className={`h-full ${over ? "bg-red-500" : "bg-green-500"}`} style={{ width: `${pct}%` }} />
                </div>
              )}
              <WeeklyBreakdown
                weeks={weeklyByCategory.get(category.id) ?? [0, 0, 0, 0, 0]}
                plannedWeeks={plannedWeeks}
                budgetId={budget?.id ?? null}
              />
              {budget && (
                <div className="flex justify-end">
                  <DeleteBudgetButton
                    budgetId={budget.id}
                    label={isInherited ? "Arrêter cet objectif récurrent" : "Supprimer"}
                  />
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
