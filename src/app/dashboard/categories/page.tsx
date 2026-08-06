import { prisma } from "@/lib/prisma";
import { getHouseholdId } from "@/lib/dal";
import { CategoryManager } from "./CategoryManager";

export default async function CategoriesPage() {
  const householdId = await getHouseholdId();
  if (!householdId) return <p className="text-slate-500">Foyer introuvable.</p>;

  const categories = await prisma.category.findMany({
    where: { householdId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Catégories</h1>
      <p className="text-sm text-slate-400 max-w-lg">
        Utilisées pour classer tes dépenses et revenus et suivre ton budget par poste.
      </p>
      <CategoryManager categories={categories} />
    </div>
  );
}
