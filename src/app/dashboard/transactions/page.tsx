import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getHouseholdId } from "@/lib/dal";
import { TransactionForm } from "./TransactionForm";
import { DeleteTransactionButton } from "./DeleteTransactionButton";

const TYPE_LABELS: Record<string, string> = {
  EXPENSE: "Dépense",
  INCOME: "Revenu",
  TRANSFER: "Virement",
  DIRECT_DEBIT: "Prélèvement",
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; accountId?: string; categoryId?: string }>;
}) {
  const householdId = await getHouseholdId();
  const params = await searchParams;

  if (!householdId) {
    return <p className="text-slate-500">Foyer introuvable.</p>;
  }

  const [accounts, categories, members] = await Promise.all([
    prisma.account.findMany({ where: { householdId }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { householdId }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { householdId }, select: { id: true, name: true, email: true } }),
  ]);

  const now = new Date();
  const month = params.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, monthNum] = month.split("-").map(Number);
  const monthStart = new Date(year, monthNum - 1, 1);
  const monthEnd = new Date(year, monthNum, 1);

  const transactions = await prisma.transaction.findMany({
    where: {
      householdId,
      date: { gte: monthStart, lt: monthEnd },
      ...(params.accountId ? { accountId: params.accountId } : {}),
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
    },
    include: { account: true, category: true, splits: { include: { user: true } } },
    orderBy: { date: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Dépenses & revenus</h1>

      {accounts.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2">
          <p className="font-semibold">Ajoute d&apos;abord un compte</p>
          <p className="text-sm text-slate-400">
            Il faut au moins un compte (courant, épargne, espèces...) avant de pouvoir enregistrer une
            transaction.
          </p>
          <Link
            href="/dashboard/comptes"
            className="inline-block bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition"
          >
            Créer un compte
          </Link>
        </div>
      ) : (
        <TransactionForm accounts={accounts} categories={categories} members={members} />
      )}

      <form className="flex flex-wrap gap-3 items-end text-sm" method="get">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Mois</label>
          <input
            type="month"
            name="month"
            defaultValue={month}
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Compte</label>
          <select
            name="accountId"
            defaultValue={params.accountId ?? ""}
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm"
          >
            <option value="">Tous</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Catégorie</label>
          <select
            name="categoryId"
            defaultValue={params.categoryId ?? ""}
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm"
          >
            <option value="">Toutes</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="bg-slate-700 hover:bg-slate-600 text-sm py-1.5 px-3 rounded-lg">
          Filtrer
        </button>
        <Link href="/dashboard/categories" className="text-slate-400 hover:text-white text-sm py-1.5 transition">
          Gérer les catégories →
        </Link>
      </form>

      <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
        {transactions.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-3 p-3 bg-slate-800/30">
            <div className="min-w-0">
              <p className="font-medium truncate">{t.label}</p>
              <p className="text-xs text-slate-400">
                {new Date(t.date).toLocaleDateString("fr-FR")} · {t.account.name}
                {t.category ? ` · ${t.category.name}` : ""} · {TYPE_LABELS[t.type]}
                {t.isShared && t.splits.length > 0 && (
                  <>
                    {" "}
                    · partagé:{" "}
                    {t.splits
                      .map((s) => `${s.user.name ?? s.user.email} ${s.shareAmount.toFixed(2)}€`)
                      .join(", ")}
                  </>
                )}
              </p>
            </div>
            <div className="text-right shrink-0 space-y-1">
              <p
                className={`font-semibold ${
                  t.type === "INCOME"
                    ? "text-emerald-400"
                    : t.type === "EXPENSE" || t.type === "DIRECT_DEBIT"
                      ? "text-red-400"
                      : "text-slate-300"
                }`}
              >
                {t.type === "INCOME" ? "+" : t.type === "EXPENSE" || t.type === "DIRECT_DEBIT" ? "-" : ""}
                {t.amount.toFixed(2)} €
              </p>
              <DeleteTransactionButton transactionId={t.id} />
            </div>
          </div>
        ))}
        {transactions.length === 0 && (
          <p className="text-slate-500 text-sm p-4">Aucune transaction pour ce mois.</p>
        )}
      </div>
    </div>
  );
}
