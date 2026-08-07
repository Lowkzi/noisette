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
      include: { category: true, account: true, toAccount: true },
      orderBy: { dueDayOfMonth: "asc" },
    }),
    prisma.category.findMany({ where: { householdId }, orderBy: { name: "asc" } }),
    prisma.account.findMany({ where: { householdId }, orderBy: { name: "asc" } }),
  ]);

  const expenseBills = bills.filter((b) => b.kind === "EXPENSE");
  const incomeBills = bills.filter((b) => b.kind === "INCOME");
  const transferBills = bills.filter((b) => b.kind === "TRANSFER");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Factures, revenus & virements récurrents</h1>
      <RecurringBillForm categories={categories} accounts={accounts} />

      <div className="space-y-3">
        <h2 className="font-semibold text-sm text-slate-400">Revenus récurrents (salaire, primes...)</h2>
        {incomeBills.map((bill) => (
          <RecurringBillRow key={bill.id} bill={bill} categories={categories} accounts={accounts} />
        ))}
        {incomeBills.length === 0 && <p className="text-slate-500 text-sm">Aucun revenu récurrent.</p>}
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-sm text-slate-400">Charges récurrentes</h2>
        {expenseBills.map((bill) => (
          <RecurringBillRow key={bill.id} bill={bill} categories={categories} accounts={accounts} />
        ))}
        {expenseBills.length === 0 && <p className="text-slate-500 text-sm">Aucune facture récurrente.</p>}
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-sm text-slate-400">Virements récurrents (épargne...)</h2>
        {transferBills.map((bill) => (
          <RecurringBillRow key={bill.id} bill={bill} categories={categories} accounts={accounts} />
        ))}
        {transferBills.length === 0 && <p className="text-slate-500 text-sm">Aucun virement récurrent.</p>}
      </div>
    </div>
  );
}
