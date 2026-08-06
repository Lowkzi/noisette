import { prisma } from "@/lib/prisma";
import { getHouseholdId } from "@/lib/dal";
import { RecurringBillForm } from "./RecurringBillForm";
import { RecurringBillRow } from "./RecurringBillRow";

export default async function FacturesPage() {
  const householdId = await getHouseholdId();
  if (!householdId) return <p className="text-slate-500">Foyer introuvable.</p>;

  const [bills, categories, accounts] = await Promise.all([
    prisma.recurringBill.findMany({
      where: { householdId },
      include: { category: true, account: true },
      orderBy: { dueDayOfMonth: "asc" },
    }),
    prisma.category.findMany({ where: { householdId }, orderBy: { name: "asc" } }),
    prisma.account.findMany({ where: { householdId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Factures récurrentes</h1>
      <RecurringBillForm categories={categories} accounts={accounts} />
      <div className="space-y-2">
        {bills.map((bill) => (
          <RecurringBillRow key={bill.id} bill={bill} />
        ))}
        {bills.length === 0 && <p className="text-slate-500 text-sm">Aucune facture récurrente.</p>}
      </div>
    </div>
  );
}
