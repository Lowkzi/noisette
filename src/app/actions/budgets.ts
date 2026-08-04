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
    month: formData.get("month"),
    plannedAmount: formData.get("plannedAmount"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { categoryId, month, plannedAmount } = validatedFields.data;

  const category = await prisma.category.findFirst({ where: { id: categoryId, householdId } });
  if (!category) return { message: "Catégorie introuvable." };

  // Le mois est toujours normalisé au 1er du mois, comme CmgEntry dans le projet modèle.
  const [year, monthNum] = month.split("-").map(Number);
  const normalizedMonth = new Date(Date.UTC(year, monthNum - 1, 1));

  await prisma.budget.upsert({
    where: { categoryId_month: { categoryId, month: normalizedMonth } },
    create: { householdId, categoryId, month: normalizedMonth, plannedAmount },
    update: { plannedAmount },
  });

  revalidatePath("/dashboard/budget");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteBudget(budgetId: string) {
  const householdId = await getHouseholdId();
  if (!householdId) return;

  await prisma.budget.deleteMany({ where: { id: budgetId, householdId } });

  revalidatePath("/dashboard/budget");
  revalidatePath("/dashboard");
}
