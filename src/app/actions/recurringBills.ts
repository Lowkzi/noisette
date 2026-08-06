"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getHouseholdId, getUser } from "@/lib/dal";
import { RecurringBillFormSchema, RecurringBillFormState } from "@/lib/definitions";
import { applyBalanceEffect } from "@/lib/balance";

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
  const type = isIncome ? "INCOME" : "DIRECT_DEBIT";

  await prisma.$transaction(async (tx) => {
    await tx.transaction.create({
      data: {
        householdId,
        accountId: bill.accountId!,
        categoryId: bill.categoryId,
        amount: bill.amount,
        date: now,
        label: bill.label,
        type,
        createdById: user.id,
        sourceRecurringBillId: billId,
      },
    });
    await applyBalanceEffect(tx, { accountId: bill.accountId!, toAccountId: null, amount: bill.amount, type }, 1);
    await tx.recurringBill.update({ where: { id: billId }, data: { lastPaidAt: now } });
  });

  revalidatePath("/dashboard/factures");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/comptes");
  revalidatePath("/dashboard/budget");
  return {};
}

// Annule un "Marquer comme payée/reçue" : supprime la transaction générée, restaure le solde,
// et efface le statut "réglé ce mois-ci" pour permettre de le remarquer plus tard si besoin.
export async function unmarkRecurringBillPaid(billId: string): Promise<{ error?: string }> {
  const householdId = await getHouseholdId();
  if (!householdId) return { error: "Foyer introuvable." };

  const bill = await prisma.recurringBill.findFirst({ where: { id: billId, householdId } });
  if (!bill) return { error: "Introuvable." };

  let transaction = await prisma.transaction.findFirst({
    where: { sourceRecurringBillId: billId, householdId },
    orderBy: { date: "desc" },
  });

  // Filet de sécurité pour les paiements marqués avant l'ajout du lien direct : on retrouve la
  // transaction correspondante par ressemblance (compte, montant, type, libellé, mois de paiement).
  if (!transaction && bill.accountId && bill.lastPaidAt) {
    const paidAt = new Date(bill.lastPaidAt);
    const monthStart = new Date(paidAt.getFullYear(), paidAt.getMonth(), 1);
    const monthEnd = new Date(paidAt.getFullYear(), paidAt.getMonth() + 1, 1);
    transaction = await prisma.transaction.findFirst({
      where: {
        householdId,
        accountId: bill.accountId,
        amount: bill.amount,
        label: bill.label,
        type: bill.kind === "INCOME" ? "INCOME" : "DIRECT_DEBIT",
        date: { gte: monthStart, lt: monthEnd },
      },
      orderBy: { date: "desc" },
    });
  }

  await prisma.$transaction(async (tx) => {
    if (transaction) {
      await applyBalanceEffect(
        tx,
        { accountId: transaction.accountId, toAccountId: transaction.toAccountId, amount: transaction.amount, type: transaction.type },
        -1
      );
      await tx.transaction.delete({ where: { id: transaction.id } });
    }
    await tx.recurringBill.update({ where: { id: billId }, data: { lastPaidAt: null } });
  });

  revalidatePath("/dashboard/factures");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/comptes");
  revalidatePath("/dashboard/budget");

  if (!transaction) {
    return {
      error:
        "Statut « payée » annulé. Aucune transaction correspondante n'a été retrouvée automatiquement (paiement antérieur à cette fonctionnalité) — vérifie le solde du compte et supprime-la manuellement si besoin.",
    };
  }
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
