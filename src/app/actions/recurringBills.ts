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
    toAccountId: formData.get("toAccountId"),
    reminderDaysBefore: formData.get("reminderDaysBefore"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { label, amount, kind, dueDayOfMonth, categoryId, accountId, toAccountId, reminderDaysBefore } =
    validatedFields.data;
  const isTransfer = kind === "TRANSFER";

  await prisma.recurringBill.create({
    data: {
      householdId,
      label,
      amount,
      kind: kind ?? "EXPENSE",
      dueDayOfMonth,
      categoryId: isTransfer ? null : categoryId || null,
      accountId: accountId || null,
      toAccountId: isTransfer ? toAccountId : null,
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
    toAccountId: formData.get("toAccountId"),
    reminderDaysBefore: formData.get("reminderDaysBefore"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { label, amount, kind, dueDayOfMonth, categoryId, accountId, toAccountId, reminderDaysBefore } =
    validatedFields.data;
  const isTransfer = kind === "TRANSFER";

  await prisma.recurringBill.updateMany({
    where: { id: billId, householdId },
    data: {
      label,
      amount,
      kind: kind ?? "EXPENSE",
      dueDayOfMonth,
      categoryId: isTransfer ? null : categoryId || null,
      accountId: accountId || null,
      toAccountId: isTransfer ? toAccountId : null,
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

// Crée la transaction réelle correspondant à l'échéance courante (dépense, revenu, ou virement
// entre deux comptes) et met à jour le(s) solde(s) associé(s), via un bouton "Marquer" (pas
// d'automatisation par tâche planifiée). Un montant différent peut être précisé (ex. salaire
// variable d'un mois sur l'autre) : il devient alors le nouveau montant de référence.
export async function payRecurringBill(billId: string, amountOverride?: number): Promise<{ error?: string }> {
  const householdId = await getHouseholdId();
  const user = await getUser();
  if (!householdId || !user) return { error: "Foyer introuvable." };

  const bill = await prisma.recurringBill.findFirst({ where: { id: billId, householdId } });
  if (!bill) return { error: "Introuvable." };
  if (!bill.accountId) return { error: "Choisis d'abord un compte pour cette échéance." };
  if (bill.kind === "TRANSFER" && !bill.toAccountId) {
    return { error: "Choisis d'abord le compte de destination du virement." };
  }

  if (amountOverride !== undefined && (Number.isNaN(amountOverride) || amountOverride <= 0)) {
    return { error: "Montant invalide." };
  }

  const now = new Date();
  if (bill.lastPaidAt) {
    const paid = new Date(bill.lastPaidAt);
    if (paid.getFullYear() === now.getFullYear() && paid.getMonth() === now.getMonth()) {
      return { error: "Déjà marqué comme réglé ce mois-ci." };
    }
  }

  const type = bill.kind === "INCOME" ? "INCOME" : bill.kind === "TRANSFER" ? "TRANSFER" : "DIRECT_DEBIT";
  const amount = amountOverride ?? bill.amount;

  await prisma.$transaction(async (tx) => {
    await tx.transaction.create({
      data: {
        householdId,
        accountId: bill.accountId!,
        toAccountId: bill.kind === "TRANSFER" ? bill.toAccountId : null,
        categoryId: bill.kind === "TRANSFER" ? null : bill.categoryId,
        amount,
        date: now,
        label: bill.label,
        type,
        createdById: user.id,
        sourceRecurringBillId: billId,
      },
    });
    await applyBalanceEffect(
      tx,
      { accountId: bill.accountId!, toAccountId: bill.kind === "TRANSFER" ? bill.toAccountId : null, amount, type },
      1
    );
    await tx.recurringBill.update({ where: { id: billId }, data: { lastPaidAt: now, amount } });
  });

  revalidatePath("/dashboard/factures");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/comptes");
  revalidatePath("/dashboard/budget");
  return {};
}

// Annule un "Marquer comme payée/reçue/versée" : supprime la transaction générée, restaure le(s)
// solde(s), et efface le statut "réglé ce mois-ci" pour permettre de le remarquer plus tard si besoin.
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
    const type = bill.kind === "INCOME" ? "INCOME" : bill.kind === "TRANSFER" ? "TRANSFER" : "DIRECT_DEBIT";
    transaction = await prisma.transaction.findFirst({
      where: {
        householdId,
        accountId: bill.accountId,
        amount: bill.amount,
        label: bill.label,
        type,
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
        "Statut annulé. Aucune transaction correspondante n'a été retrouvée automatiquement (antérieure à cette fonctionnalité) — vérifie le(s) solde(s) et supprime-la manuellement si besoin.",
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
