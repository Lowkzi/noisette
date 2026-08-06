import { prisma } from "@/lib/prisma";
import { getHouseholdId } from "@/lib/dal";
import { SavingsGoalForm } from "./SavingsGoalForm";
import { SavingsGoalRow } from "./SavingsGoalRow";

export default async function EpargnePage() {
  const householdId = await getHouseholdId();
  if (!householdId) return <p className="text-slate-500">Foyer introuvable.</p>;

  const [goals, accounts] = await Promise.all([
    prisma.savingsGoal.findMany({
      where: { householdId },
      include: { account: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.account.findMany({ where: { householdId }, orderBy: { name: "asc" } }),
  ]);

  const totalMonthly = goals.reduce((s, g) => s + (g.monthlyContribution ?? 0), 0);
  const cushionGoals = goals.filter((g) => g.isCushion);
  const regularGoals = goals.filter((g) => !g.isCushion);
  const cushionsBelow = cushionGoals.filter((g) => g.account && g.account.currentBalance < g.targetAmount);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Épargne</h1>

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

      {totalMonthly > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm text-slate-400">Épargne mensuelle totale projetée</span>
          <span className="font-semibold text-sky-400">
            {totalMonthly.toFixed(2)} €/mois · {(totalMonthly * 12).toFixed(2)} €/an
          </span>
        </div>
      )}

      <SavingsGoalForm accounts={accounts} />

      {cushionGoals.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-sm text-slate-400">Coussins financiers</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {cushionGoals.map((goal) => (
              <SavingsGoalRow
                key={goal.id}
                goal={{ ...goal, targetDate: goal.targetDate ? goal.targetDate.toISOString() : null }}
                accounts={accounts}
              />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        {cushionGoals.length > 0 && <h2 className="font-semibold text-sm text-slate-400">Objectifs d&apos;épargne</h2>}
        <div className="grid sm:grid-cols-2 gap-3">
          {regularGoals.map((goal) => (
            <SavingsGoalRow
              key={goal.id}
              goal={{ ...goal, targetDate: goal.targetDate ? goal.targetDate.toISOString() : null }}
              accounts={accounts}
            />
          ))}
          {goals.length === 0 && <p className="text-slate-500 text-sm">Aucun objectif pour l&apos;instant.</p>}
        </div>
      </section>
    </div>
  );
}
