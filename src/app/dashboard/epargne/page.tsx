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

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Épargne</h1>
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
