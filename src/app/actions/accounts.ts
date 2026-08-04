"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getHouseholdId } from "@/lib/dal";
import { AccountFormSchema, AccountFormState } from "@/lib/definitions";

export async function createAccount(state: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const householdId = await getHouseholdId();
  if (!householdId) return { message: "Foyer introuvable." };

  const validatedFields = AccountFormSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    currentBalance: formData.get("currentBalance"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, type, currentBalance } = validatedFields.data;

  await prisma.account.create({
    data: { householdId, name, type, currentBalance },
  });

  revalidatePath("/dashboard/comptes");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateAccount(
  accountId: string,
  state: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const householdId = await getHouseholdId();
  if (!householdId) return { message: "Foyer introuvable." };

  const validatedFields = AccountFormSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    currentBalance: formData.get("currentBalance"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, type, currentBalance } = validatedFields.data;

  await prisma.account.updateMany({
    where: { id: accountId, householdId },
    data: { name, type, currentBalance },
  });

  revalidatePath("/dashboard/comptes");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteAccount(accountId: string) {
  const householdId = await getHouseholdId();
  if (!householdId) return;

  await prisma.account.deleteMany({ where: { id: accountId, householdId } });

  revalidatePath("/dashboard/comptes");
  revalidatePath("/dashboard");
}
