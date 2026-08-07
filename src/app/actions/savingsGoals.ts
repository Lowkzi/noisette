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
    isCushion: formData.get("isCushion"),
    accountId: formData.get("accountId"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, targetAmount, currentAmount, targetDate, monthlyContribution, isCushion, accountId } =
    validatedFields.data;

  if (accountId) {
    const account = await prisma.account.findFirst({ where: { id: accountId, householdId } });
    if (!account) return { errors: { accountId: ["Compte introuvable."] } };
  }

  await prisma.savingsGoal.create({
    data: {
      householdId,
      name,
      targetAmount,
      currentAmount: isCushion ? 0 : currentAmount ?? 0,
      targetDate: targetDate ? new Date(targetDate) : null,
      monthlyContribution: monthlyContribution || null,
      isCushion: !!isCushion,
      accountId: accountId || null,
    },
  });

  revalidatePath("/dashboard/epargne");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateSavingsGoal(
  goalId: string,
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
    isCushion: formData.get("isCushion"),
    accountId: formData.get("accountId"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, targetAmount, currentAmount, targetDate, monthlyContribution, isCushion, accountId } =
    validatedFields.data;

  if (accountId) {
    const account = await prisma.account.findFirst({ where: { id: accountId, householdId } });
    if (!account) return { errors: { accountId: ["Compte introuvable."] } };
  }

  await prisma.savingsGoal.updateMany({
    where: { id: goalId, householdId },
    data: {
      name,
      targetAmount,
      currentAmount: isCushion ? 0 : currentAmount ?? 0,
      targetDate: targetDate ? new Date(targetDate) : null,
      monthlyContribution: monthlyContribution || null,
      isCushion: !!isCushion,
      accountId: accountId || null,
    },
  });

  revalidatePath("/dashboard/epargne");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/budget");
  return { success: true };
}

export async function deleteSavingsGoal(goalId: string) {
  const householdId = await getHouseholdId();
  if (!householdId) return;

  await prisma.savingsGoal.deleteMany({ where: { id: goalId, householdId } });

  revalidatePath("/dashboard/epargne");
  revalidatePath("/dashboard");
}
