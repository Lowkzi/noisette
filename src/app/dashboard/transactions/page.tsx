import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getHouseholdId } from "@/lib/dal";
import { TransactionForm } from "./TransactionForm";
import { TransactionRow } from "./TransactionRow";
import { CategoryFilter } from "./CategoryFilter";

function buildHref(base: Record<string, string | undefined>, overrides: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  const merged = { ...base, ...overrides };
  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return `/dashboard/transactions${qs ? `?${qs}` : ""}`;
}

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
  const prevMonthDate = new Date(year, monthNum - 2, 1);
  const nextMonthDate = new Date(year, monthNum, 1);
  const fmtMonth = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = monthStart.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const transactions = await prisma.transaction.findMany({
    where: {
      householdId,
      date: { gte: monthStart, lt: monthEnd },
      ...(params.accountId ? { OR: [{ accountId: params.accountId }, { toAccountId: params.accountId }] } : {}),
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
    },
    include: { account: true, toAccount: true, category: true, splits: { include: { user: true } } },
    orderBy: { date: "desc" },
  });

  const base = { month: params.month, accountId: params.accountId, categoryId: params.categoryId };

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

      <div className="space-y-3">
        {/* Mois : flèches précédent/suivant, plus fiable que le sélecteur calendrier natif */}
        <div className="flex items-center gap-3">
          <Link
            href={buildHref(base, { month: fmtMonth(prevMonthDate) })}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition"
            aria-label="Mois précédent"
          >
            ‹
          </Link>
          <span className="text-sm font-medium capitalize min-w-[9rem] text-center">{monthLabel}</span>
          <Link
            href={buildHref(base, { month: fmtMonth(nextMonthDate) })}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition"
            aria-label="Mois suivant"
          >
            ›
          </Link>
        </div>

        {/* Compte : boutons en un clic plutôt qu'un menu déroulant + bouton Filtrer séparé */}
        <div className="flex flex-wrap gap-2">
          <Link
            href={buildHref(base, { accountId: undefined })}
            className={`text-sm px-3 py-1.5 rounded-lg border transition ${
              !params.accountId
                ? "bg-green-600 border-green-600 text-white"
                : "border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
            }`}
          >
            Tous les comptes
          </Link>
          {accounts.map((a) => (
            <Link
              key={a.id}
              href={buildHref(base, { accountId: a.id })}
              className={`text-sm px-3 py-1.5 rounded-lg border transition ${
                params.accountId === a.id
                  ? "bg-green-600 border-green-600 text-white"
                  : "border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
              }`}
            >
              {a.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <CategoryFilter categories={categories} categoryId={params.categoryId} />
          <Link href="/dashboard/categories" className="text-slate-400 hover:text-white text-sm transition">
            Gérer les catégories →
          </Link>
        </div>
      </div>

      <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
        {transactions.map((t) => (
          <TransactionRow
            key={t.id}
            transaction={t}
            accounts={accounts}
            categories={categories}
            viewAccountId={params.accountId}
          />
        ))}
        {transactions.length === 0 && (
          <p className="text-slate-500 text-sm p-4">Aucune transaction pour ce mois.</p>
        )}
      </div>
    </div>
  );
}
