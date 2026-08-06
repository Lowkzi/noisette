"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getHouseholdId } from "@/lib/dal";
import { AccountFormSchema, AccountFormState } from "@/lib/definitions";

function parseMemberIds(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export async function createAccount(state: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const householdId = await getHouseholdId();
  if (!householdId) return { message: "Foyer introuvable." };

  const validatedFields = AccountFormSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    ownership: formData.get("ownership"),
    currentBalance: formData.get("currentBalance"),
    memberIds: formData.get("memberIds"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, type, ownership, currentBalance, memberIds } = validatedFields.data;
  const parsedMemberIds = ownership === "JOINT" ? parseMemberIds(memberIds) : [];

  await prisma.account.create({
    data: {
      householdId,
      name,
      type,
      ownership,
      currentBalance,
      members: parsedMemberIds.length > 0 ? { connect: parsedMemberIds.map((id) => ({ id })) } : undefined,
    },
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
    ownership: formData.get("ownership"),
    currentBalance: formData.get("currentBalance"),
    memberIds: formData.get("memberIds"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, type, ownership, currentBalance, memberIds } = validatedFields.data;
  const parsedMemberIds = ownership === "JOINT" ? parseMemberIds(memberIds) : [];

  const account = await prisma.account.findFirst({ where: { id: accountId, householdId } });
  if (!account) return { message: "Compte introuvable." };

  await prisma.account.update({
    where: { id: accountId },
    data: {
      name,
      type,
      ownership,
      currentBalance,
      members: { set: parsedMemberIds.map((id) => ({ id })) },
    },
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
