import { prisma } from "@/lib/prisma";
import { getHouseholdId } from "@/lib/dal";
import { AccountForm } from "./AccountForm";
import { AccountRow } from "./AccountRow";

export default async function ComptesPage() {
  const householdId = await getHouseholdId();

  const [accounts, members] = householdId
    ? await Promise.all([
        prisma.account.findMany({
          where: { householdId },
          include: { members: true },
          orderBy: { createdAt: "asc" },
        }),
        prisma.user.findMany({
          where: { householdId },
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        }),
      ])
    : [[], []];

  const total = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Comptes</h1>
        <span className="text-slate-400 text-sm">
          Solde total : <span className="text-white font-semibold">{total.toFixed(2)} €</span>
        </span>
      </div>

      <AccountForm members={members} />

      <div className="grid sm:grid-cols-2 gap-3">
        {accounts.map((account) => (
          <AccountRow key={account.id} account={account} members={members} />
        ))}
        {accounts.length === 0 && (
          <p className="text-slate-500 text-sm">Aucun compte pour l&apos;instant.</p>
        )}
      </div>
    </div>
  );
}
