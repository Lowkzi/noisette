import { prisma } from "@/lib/prisma";
import { getHouseholdId } from "@/lib/dal";

const PALETTE = ["#16a34a", "#38bdf8", "#a78bfa", "#f472b6", "#34d399", "#fb7185", "#facc15", "#60a5fa"];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

export default async function RapportsPage() {
  const householdId = await getHouseholdId();
  if (!householdId) return <p className="text-slate-500">Foyer introuvable.</p>;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const expenses = await prisma.transaction.findMany({
    where: { householdId, type: { in: ["EXPENSE", "DIRECT_DEBIT"] }, date: { gte: monthStart, lt: monthEnd } },
    include: { category: true },
  });

  const byCategory = new Map<string, number>();
  for (const t of expenses) {
    const key = t.category?.name ?? "Sans catégorie";
    byCategory.set(key, (byCategory.get(key) ?? 0) + t.amount);
  }
  const total = [...byCategory.values()].reduce((a, b) => a + b, 0);

  let cumulativeAngle = 0;
  const slices = [...byCategory.entries()].map(([name, amount], i) => {
    const angle = total > 0 ? (amount / total) * 360 : 0;
    const path = arcPath(100, 100, 90, cumulativeAngle, cumulativeAngle + angle);
    cumulativeAngle += angle;
    return { name, amount, path, color: PALETTE[i % PALETTE.length] };
  });

  // 6 derniers mois : revenus vs dépenses
  const monthsBack = 6;
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);
  const recentTransactions = await prisma.transaction.findMany({
    where: {
      householdId,
      type: { in: ["EXPENSE", "INCOME", "DIRECT_DEBIT"] },
      date: { gte: sixMonthsAgo, lt: monthEnd },
    },
    select: { amount: true, type: true, date: true },
  });

  const monthly: { label: string; income: number; expense: number }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const income = recentTransactions
      .filter((t) => t.type === "INCOME" && t.date >= d && t.date < nd)
      .reduce((s, t) => s + t.amount, 0);
    const expense = recentTransactions
      .filter((t) => (t.type === "EXPENSE" || t.type === "DIRECT_DEBIT") && t.date >= d && t.date < nd)
      .reduce((s, t) => s + t.amount, 0);
    monthly.push({ label: d.toLocaleDateString("fr-FR", { month: "short" }), income, expense });
  }
  const maxBar = Math.max(1, ...monthly.map((m) => Math.max(m.income, m.expense)));

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">Rapports</h1>

      <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-4">
        <h2 className="font-semibold">Dépenses par catégorie ce mois-ci</h2>
        {total > 0 ? (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <svg viewBox="0 0 200 200" className="w-48 h-48 shrink-0">
              {slices.map((s) => (
                <path key={s.name} d={s.path} fill={s.color} />
              ))}
            </svg>
            <ul className="space-y-1 text-sm">
              {slices.map((s) => (
                <li key={s.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-300">{s.name}</span>
                  <span className="text-slate-500">
                    {s.amount.toFixed(2)} € ({total > 0 ? ((s.amount / total) * 100).toFixed(0) : 0}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Aucune dépense ce mois-ci.</p>
        )}
      </section>

      <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-4">
        <h2 className="font-semibold">Revenus vs dépenses (6 derniers mois)</h2>
        <div className="flex items-end gap-4 h-48">
          {monthly.map((m) => (
            <div key={m.label} className="flex flex-col items-center gap-1 flex-1">
              <div className="flex items-end gap-1 h-40">
                <div
                  className="w-4 bg-emerald-500 rounded-t"
                  style={{ height: `${(m.income / maxBar) * 100}%` }}
                  title={`Revenus : ${m.income.toFixed(2)} €`}
                />
                <div
                  className="w-4 bg-red-500 rounded-t"
                  style={{ height: `${(m.expense / maxBar) * 100}%` }}
                  title={`Dépenses : ${m.expense.toFixed(2)} €`}
                />
              </div>
              <span className="text-xs text-slate-400 capitalize">{m.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-emerald-500 rounded-sm inline-block" /> Revenus
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-500 rounded-sm inline-block" /> Dépenses
          </span>
        </div>
      </section>
    </div>
  );
}
