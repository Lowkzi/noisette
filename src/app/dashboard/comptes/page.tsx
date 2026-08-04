import { prisma } from "@/lib/prisma";
import { getHouseholdId } from "@/lib/dal";
import { AccountForm, TYPE_LABELS } from "./AccountForm";
import { DeleteAccountButton } from "./DeleteAccountButton";

export default async function ComptesPage() {
  const householdId = await getHouseholdId();

  const accounts = householdId
    ? await prisma.account.findMany({
        where: { householdId },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const total = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Comptes</h1>
        <span className="text-slate-400 text-sm">
          Solde total : <span className="text-white font-semibold">{total.toFixed(2)} €</span>
        </span>
      </div>

      <AccountForm />

      <div className="grid sm:grid-cols-2 gap-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-semibold">{account.name}</p>
              <p className="text-xs text-slate-400">{TYPE_LABELS[account.type]}</p>
            </div>
            <div className="text-right space-y-1">
              <p
                className={`font-semibold ${account.currentBalance < 0 ? "text-red-400" : "text-emerald-400"}`}
              >
                {account.currentBalance.toFixed(2)} €
              </p>
              <DeleteAccountButton accountId={account.id} />
            </div>
          </div>
        ))}
        {accounts.length === 0 && (
          <p className="text-slate-500 text-sm">Aucun compte pour l&apos;instant.</p>
        )}
      </div>
    </div>
  );
}
