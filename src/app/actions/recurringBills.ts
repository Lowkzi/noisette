"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getHouseholdId, getUser } from "@/lib/dal";
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
    kind: formData.get("kind"),
    dueDayOfMonth: formData.get("dueDayOfMonth"),
    categoryId: formData.get("categoryId"),
    accountId: formData.get("accountId"),
    reminderDaysBefore: formData.get("reminderDaysBefore"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { label, amount, kind, dueDayOfMonth, categoryId, accountId, reminderDaysBefore } =
    validatedFields.data;

  await prisma.recurringBill.create({
    data: {
      householdId,
      label,
      amount,
      kind: kind ?? "EXPENSE",
      dueDayOfMonth,
      categoryId: categoryId || null,
      accountId: accountId || null,
      reminderDaysBefore: reminderDaysBefore ?? 3,
    },
  });

  revalidatePath("/dashboard/factures");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/budget");
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
    kind: formData.get("kind"),
    dueDayOfMonth: formData.get("dueDayOfMonth"),
    categoryId: formData.get("categoryId"),
    accountId: formData.get("accountId"),
    reminderDaysBefore: formData.get("reminderDaysBefore"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { label, amount, kind, dueDayOfMonth, categoryId, accountId, reminderDaysBefore } =
    validatedFields.data;

  await prisma.recurringBill.updateMany({
    where: { id: billId, householdId },
    data: {
      label,
      amount,
      kind: kind ?? "EXPENSE",
      dueDayOfMonth,
      categoryId: categoryId || null,
      accountId: accountId || null,
      reminderDaysBefore: reminderDaysBefore ?? 3,
    },
  });

  revalidatePath("/dashboard/factures");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/budget");
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

// Crée la transaction réelle correspondant à l'échéance courante (dépense ou revenu) et met à
// jour le solde du compte associé, via un bouton "Marquer comme payée/reçue" (pas d'automatisation
// par tâche planifiée).
export async function payRecurringBill(billId: string): Promise<{ error?: string }> {
  const householdId = await getHouseholdId();
  const user = await getUser();
  if (!householdId || !user) return { error: "Foyer introuvable." };

  const bill = await prisma.recurringBill.findFirst({ where: { id: billId, householdId } });
  if (!bill) return { error: "Introuvable." };
  if (!bill.accountId) return { error: "Choisis d'abord un compte pour cette échéance." };

  const now = new Date();
  if (bill.lastPaidAt) {
    const paid = new Date(bill.lastPaidAt);
    if (paid.getFullYear() === now.getFullYear() && paid.getMonth() === now.getMonth()) {
      return { error: "Déjà marqué comme réglé ce mois-ci." };
    }
  }

  const isIncome = bill.kind === "INCOME";

  await prisma.$transaction(async (tx) => {
    await tx.transaction.create({
      data: {
        householdId,
        accountId: bill.accountId!,
        categoryId: bill.categoryId,
        amount: bill.amount,
        date: now,
        label: bill.label,
        type: isIncome ? "INCOME" : "DIRECT_DEBIT",
        createdById: user.id,
      },
    });
    await tx.account.update({
      where: { id: bill.accountId! },
      data: { currentBalance: isIncome ? { increment: bill.amount } : { decrement: bill.amount } },
    });
    await tx.recurringBill.update({ where: { id: billId }, data: { lastPaidAt: now } });
  });

  revalidatePath("/dashboard/factures");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/comptes");
  revalidatePath("/dashboard/budget");
  return {};
}

export async function deleteRecurringBill(billId: string) {
  const householdId = await getHouseholdId();
  if (!householdId) return;

  await prisma.recurringBill.deleteMany({ where: { id: billId, householdId } });

  revalidatePath("/dashboard/factures");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/budget");
}
