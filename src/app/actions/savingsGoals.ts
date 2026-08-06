"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getHouseholdId } from "@/lib/dal";
import { SavingsGoalFormSchema, SavingsGoalFormState } from "@/lib/definitions";

export async function createSavingsGoal(
  state: SavingsGoalFormState,
  formData: FormData
): Promise<SavingsGoalFormState> {
  const householdId = await getHouseholdId();
  if (!householdId) return { message: "Foyer introuvable." };

  const validatedFields = SavingsGoalFormSchema.safeParse({
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount"),
    currentAmount: formData.get("currentAmount"),
    targetDate: formData.get("targetDate"),
    monthlyContribution: formData.get("monthlyContribution"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, targetAmount, currentAmount, targetDate, monthlyContribution } = validatedFields.data;

  await prisma.savingsGoal.create({
    data: {
      householdId,
      name,
      targetAmount,
      currentAmount: currentAmount ?? 0,
      targetDate: targetDate ? new Date(targetDate) : null,
      monthlyContribution: monthlyContribution || null,
    },
  });

  revalidatePath("/dashboard/epargne");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateSavingsGoalAmount(goalId: string, formData: FormData) {
  const householdId = await getHouseholdId();
  if (!householdId) return;

  const currentAmount = Number(formData.get("currentAmount"));
  if (Number.isNaN(currentAmount) || currentAmount < 0) return;

  const rawMonthly = formData.get("monthlyContribution");
  const monthlyContribution = rawMonthly !== null && rawMonthly !== "" ? Number(rawMonthly) : null;
  if (monthlyContribution !== null && (Number.isNaN(monthlyContribution) || monthlyContribution < 0)) return;

  await prisma.savingsGoal.updateMany({
    where: { id: goalId, householdId },
    data: { currentAmount, monthlyContribution },
  });

  revalidatePath("/dashboard/epargne");
  revalidatePath("/dashboard");
}

export async function deleteSavingsGoal(goalId: string) {
  const householdId = await getHouseholdId();
  if (!householdId) return;

  await prisma.savingsGoal.deleteMany({ where: { id: goalId, householdId } });

  revalidatePath("/dashboard/epargne");
  revalidatePath("/dashboard");
}
