"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getHouseholdId } from "@/lib/dal";
import { RecurringBillFormSchema, RecurringBillFormState } from "@/lib/definitions";

export async function createRecurringBill(
  state: RecurringBillFormState,
  formData: FormData
): Promise<RecurringBillFormState> {
  const householdId = await getHouseholdId();
  if (!householdId) return { message: "Foyer introuvable." };

  const validatedFields = RecurringBillFormSchema.safeParse({
    label: formData.get("label"),
    amount: formData.get("amount"),
    dueDayOfMonth: formData.get("dueDayOfMonth"),
    categoryId: formData.get("categoryId"),
    accountId: formData.get("accountId"),
    reminderDaysBefore: formData.get("reminderDaysBefore"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { label, amount, dueDayOfMonth, categoryId, accountId, reminderDaysBefore } =
    validatedFields.data;

  await prisma.recurringBill.create({
    data: {
      householdId,
      label,
      amount,
      dueDayOfMonth,
      categoryId: categoryId || null,
      accountId: accountId || null,
      reminderDaysBefore: reminderDaysBefore ?? 3,
    },
  });

  revalidatePath("/dashboard/factures");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateRecurringBill(
  billId: string,
  state: RecurringBillFormState,
  formData: FormData
): Promise<RecurringBillFormState> {
  const householdId = await getHouseholdId();
  if (!householdId) return { message: "Foyer introuvable." };

  const validatedFields = RecurringBillFormSchema.safeParse({
    label: formData.get("label"),
    amount: formData.get("amount"),
    dueDayOfMonth: formData.get("dueDayOfMonth"),
    categoryId: formData.get("categoryId"),
    accountId: formData.get("accountId"),
    reminderDaysBefore: formData.get("reminderDaysBefore"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { label, amount, dueDayOfMonth, categoryId, accountId, reminderDaysBefore } =
    validatedFields.data;

  await prisma.recurringBill.updateMany({
    where: { id: billId, householdId },
    data: {
      label,
      amount,
      dueDayOfMonth,
      categoryId: categoryId || null,
      accountId: accountId || null,
      reminderDaysBefore: reminderDaysBefore ?? 3,
    },
  });

  revalidatePath("/dashboard/factures");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleRecurringBillActive(billId: string, isActive: boolean) {
  const householdId = await getHouseholdId();
  if (!householdId) return;

  await prisma.recurringBill.updateMany({
    where: { id: billId, householdId },
    data: { isActive },
  });

  revalidatePath("/dashboard/factures");
  revalidatePath("/dashboard");
}

export async function deleteRecurringBill(billId: string) {
  const householdId = await getHouseholdId();
  if (!householdId) return;

  await prisma.recurringBill.deleteMany({ where: { id: billId, householdId } });

  revalidatePath("/dashboard/factures");
  revalidatePath("/dashboard");
}
