import { prisma } from "@/lib/prisma";
import { getHouseholdId } from "@/lib/dal";
import { OneOffPurchaseForm } from "./OneOffPurchaseForm";
import { OneOffPurchaseRow } from "./OneOffPurchaseRow";

export default async function AchatsPage() {
  const householdId = await getHouseholdId();
  if (!householdId) return <p className="text-slate-500">Foyer introuvable.</p>;

  const purchases = await prisma.oneOffPurchase.findMany({
    where: { householdId },
    orderBy: { createdAt: "asc" },
  });

  const occasions = [...new Set(purchases.map((p) => p.occasion).filter((o): o is string => !!o))];

  const groups = new Map<string, typeof purchases>();
  for (const p of purchases) {
    const key = p.occasion ?? "Sans liste";
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }

  const grandTotal = purchases.reduce((s, p) => s + p.amount, 0);
  const grandTotalRemaining = purchases.filter((p) => !p.isBought).reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold">Achats ponctuels</h1>
        <span className="text-slate-400 text-sm">
          Total : <span className="text-white font-semibold">{grandTotal.toFixed(2)} €</span>
          {grandTotalRemaining !== grandTotal && (
            <span className="text-slate-500"> · reste {grandTotalRemaining.toFixed(2)} €</span>
          )}
        </span>
      </div>
      <p className="text-sm text-slate-400 max-w-lg">
        Dépenses ponctuelles hors budget récurrent (cadeaux, achats exceptionnels...), regroupées par
        occasion.
      </p>

      <OneOffPurchaseForm occasions={occasions} />

      <div className="space-y-6">
        {[...groups.entries()].map(([occasion, items]) => {
          const total = items.reduce((s, p) => s + p.amount, 0);
          return (
            <div key={occasion} className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm">{occasion}</h2>
                <span className="text-sm text-slate-400">{total.toFixed(2)} €</span>
              </div>
              <div className="space-y-1">
                {items.map((p) => (
                  <OneOffPurchaseRow key={p.id} purchase={p} />
                ))}
              </div>
            </div>
          );
        })}
        {purchases.length === 0 && <p className="text-slate-500 text-sm">Aucun achat pour l&apos;instant.</p>}
      </div>
    </div>
  );
}
