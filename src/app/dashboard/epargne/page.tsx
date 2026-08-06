import { prisma } from "@/lib/prisma";
import { getHouseholdId } from "@/lib/dal";
import { SavingsGoalForm } from "./SavingsGoalForm";
import { SavingsGoalRow } from "./SavingsGoalRow";

export default async function EpargnePage() {
  const householdId = await getHouseholdId();
  if (!householdId) return <p className="text-slate-500">Foyer introuvable.</p>;

  const goals = await prisma.savingsGoal.findMany({
    where: { householdId },
    orderBy: { createdAt: "asc" },
  });

  const totalMonthly = goals.reduce((s, g) => s + (g.monthlyContribution ?? 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Épargne</h1>

      {totalMonthly > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm text-slate-400">Épargne mensuelle totale projetée</span>
          <span className="font-semibold text-sky-400">
            {totalMonthly.toFixed(2)} €/mois · {(totalMonthly * 12).toFixed(2)} €/an
          </span>
        </div>
      )}

      <SavingsGoalForm />
      <div className="grid sm:grid-cols-2 gap-3">
        {goals.map((goal) => (
          <SavingsGoalRow
            key={goal.id}
            goal={{ ...goal, targetDate: goal.targetDate ? goal.targetDate.toISOString() : null }}
          />
        ))}
        {goals.length === 0 && <p className="text-slate-500 text-sm">Aucun objectif pour l&apos;instant.</p>}
      </div>
    </div>
  );
}
