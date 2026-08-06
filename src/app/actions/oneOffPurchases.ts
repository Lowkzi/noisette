"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getHouseholdId } from "@/lib/dal";
import { OneOffPurchaseFormSchema, OneOffPurchaseFormState } from "@/lib/definitions";

export async function createOneOffPurchase(
  state: OneOffPurchaseFormState,
  formData: FormData
): Promise<OneOffPurchaseFormState> {
  const householdId = await getHouseholdId();
  if (!householdId) return { message: "Foyer introuvable." };

  const validatedFields = OneOffPurchaseFormSchema.safeParse({
    label: formData.get("label"),
    amount: formData.get("amount"),
    occasion: formData.get("occasion"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { label, amount, occasion } = validatedFields.data;

  await prisma.oneOffPurchase.create({
    data: { householdId, label, amount, occasion: occasion || null },
  });

  revalidatePath("/dashboard/achats");
  return { success: true };
}

export async function toggleOneOffPurchaseBought(purchaseId: string, isBought: boolean) {
  const householdId = await getHouseholdId();
  if (!householdId) return;

  await prisma.oneOffPurchase.updateMany({
    where: { id: purchaseId, householdId },
    data: { isBought },
  });

  revalidatePath("/dashboard/achats");
}

export async function deleteOneOffPurchase(purchaseId: string) {
  const householdId = await getHouseholdId();
  if (!householdId) return;

  await prisma.oneOffPurchase.deleteMany({ where: { id: purchaseId, householdId } });

  revalidatePath("/dashboard/achats");
}
