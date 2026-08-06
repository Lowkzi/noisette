"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getHouseholdId } from "@/lib/dal";
import { BudgetFormSchema, BudgetFormState } from "@/lib/definitions";

export async function upsertBudget(state: BudgetFormState, formData: FormData): Promise<BudgetFormState> {
  const householdId = await getHouseholdId();
  if (!householdId) return { message: "Foyer introuvable." };

  const validatedFields = BudgetFormSchema.safeParse({
    categoryId: formData.get("categoryId"),
    accountId: formData.get("accountId"),
    month: formData.get("month"),
    plannedAmount: formData.get("plannedAmount"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { categoryId, accountId, month, plannedAmount } = validatedFields.data;

  const category = await prisma.category.findFirst({ where: { id: categoryId, householdId } });
  if (!category) return { message: "Catégorie introuvable." };

  const account = await prisma.account.findFirst({ where: { id: accountId, householdId } });
  if (!account) return { message: "Compte introuvable." };

  // Le mois est toujours normalisé au 1er du mois en heure locale, pour matcher exactement le
  // "monthStart" utilisé par la page Budget lors de la lecture (sinon écart UTC vs local en été).
  const [year, monthNum] = month.split("-").map(Number);
  const normalizedMonth = new Date(year, monthNum - 1, 1);

  await prisma.budget.upsert({
    where: { categoryId_accountId_month: { categoryId, accountId, month: normalizedMonth } },
    create: { householdId, categoryId, accountId, month: normalizedMonth, plannedAmount },
    update: { plannedAmount },
  });

  revalidatePath("/dashboard/budget");
  revalidatePath("/dashboard");
  return { success: true };
}

// Définit/ajuste la cible d'une semaine calendaire donnée (0 = semaine 1) pour un objectif de
// budget déjà existant, sans toucher au montant mensuel global.
export async function upsertBudgetWeek(budgetId: string, weekIndex: number, plannedAmount: number) {
  const householdId = await getHouseholdId();
  if (!householdId) return;
  if (Number.isNaN(plannedAmount) || plannedAmount < 0) return;
  if (weekIndex < 0 || weekIndex > 4) return;

  const budget = await prisma.budget.findFirst({ where: { id: budgetId, householdId } });
  if (!budget) return;

  await prisma.budgetWeek.upsert({
    where: { budgetId_weekIndex: { budgetId, weekIndex } },
    create: { budgetId, weekIndex, plannedAmount },
    update: { plannedAmount },
  });

  revalidatePath("/dashboard/budget");
}

export async function deleteBudget(budgetId: string) {
  const householdId = await getHouseholdId();
  if (!householdId) return;

  await prisma.budget.deleteMany({ where: { id: budgetId, householdId } });

  revalidatePath("/dashboard/budget");
  revalidatePath("/dashboard");
}
