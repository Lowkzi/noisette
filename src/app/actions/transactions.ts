"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUser, getHouseholdId } from "@/lib/dal";
import { TransactionFormSchema, TransactionFormState } from "@/lib/definitions";
import { applyBalanceEffect } from "@/lib/balance";

export async function createTransaction(
  state: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const householdId = await getHouseholdId();
  const user = await getUser();
  if (!householdId || !user) return { message: "Foyer introuvable." };

  const validatedFields = TransactionFormSchema.safeParse({
    accountId: formData.get("accountId"),
    toAccountId: formData.get("toAccountId"),
    categoryId: formData.get("categoryId"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    label: formData.get("label"),
    note: formData.get("note"),
    type: formData.get("type"),
    isShared: formData.get("isShared"),
    splits: formData.get("splits"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { accountId, toAccountId, categoryId, amount, date, label, note, type, isShared, splits } =
    validatedFields.data;

  const account = await prisma.account.findFirst({ where: { id: accountId, householdId } });
  if (!account) return { message: "Compte introuvable." };

  let resolvedToAccountId: string | null = null;
  if (type === "TRANSFER") {
    const toAccount = await prisma.account.findFirst({ where: { id: toAccountId!, householdId } });
    if (!toAccount) return { errors: { toAccountId: ["Compte de destination introuvable."] } };
    resolvedToAccountId = toAccount.id;
  }

  let parsedSplits: { userId: string; shareAmount: number }[] = [];
  if (isShared && splits) {
    try {
      parsedSplits = JSON.parse(splits);
    } catch {
      return { errors: { splits: ["Répartition invalide."] } };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.transaction.create({
      data: {
        householdId,
        accountId,
        toAccountId: resolvedToAccountId,
        categoryId: type === "TRANSFER" ? null : categoryId || null,
        amount,
        date: new Date(date),
        label,
        note: note || null,
        type,
        isShared: !!isShared,
        createdById: user.id,
        splits: parsedSplits.length
          ? { create: parsedSplits.map((s) => ({ userId: s.userId, shareAmount: s.shareAmount })) }
          : undefined,
      },
    });

    await applyBalanceEffect(tx, { accountId, toAccountId: resolvedToAccountId, amount, type }, 1);
  });

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/comptes");
  revalidatePath("/dashboard/budget");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateTransaction(
  transactionId: string,
  state: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const householdId = await getHouseholdId();
  if (!householdId) return { message: "Foyer introuvable." };

  const existing = await prisma.transaction.findFirst({ where: { id: transactionId, householdId } });
  if (!existing) return { message: "Transaction introuvable." };

  const validatedFields = TransactionFormSchema.safeParse({
    accountId: formData.get("accountId"),
    toAccountId: formData.get("toAccountId"),
    categoryId: formData.get("categoryId"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    label: formData.get("label"),
    note: formData.get("note"),
    type: formData.get("type"),
    isShared: formData.get("isShared"),
    splits: formData.get("splits"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { accountId, toAccountId, categoryId, amount, date, label, note, type, isShared, splits } =
    validatedFields.data;

  const account = await prisma.account.findFirst({ where: { id: accountId, householdId } });
  if (!account) return { message: "Compte introuvable." };

  let resolvedToAccountId: string | null = null;
  if (type === "TRANSFER") {
    const toAccount = await prisma.account.findFirst({ where: { id: toAccountId!, householdId } });
    if (!toAccount) return { errors: { toAccountId: ["Compte de destination introuvable."] } };
    resolvedToAccountId = toAccount.id;
  }

  // Le formulaire d'édition rapide ne gère pas le partage entre membres : quand ni "isShared"
  // ni "splits" ne sont soumis, on préserve la répartition existante plutôt que de l'effacer.
  const sharedFieldsProvided = formData.has("isShared") || formData.has("splits");

  let parsedSplits: { userId: string; shareAmount: number }[] | null = null;
  if (sharedFieldsProvided) {
    parsedSplits = [];
    if (isShared && splits) {
      try {
        parsedSplits = JSON.parse(splits);
      } catch {
        return { errors: { splits: ["Répartition invalide."] } };
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    // Annule l'effet de l'ancienne version sur le(s) solde(s) d'origine.
    await applyBalanceEffect(
      tx,
      { accountId: existing.accountId, toAccountId: existing.toAccountId, amount: existing.amount, type: existing.type },
      -1
    );

    if (sharedFieldsProvided) {
      await tx.transactionSplit.deleteMany({ where: { transactionId } });
    }
    await tx.transaction.update({
      where: { id: transactionId },
      data: {
        accountId,
        toAccountId: resolvedToAccountId,
        categoryId: type === "TRANSFER" ? null : categoryId || null,
        amount,
        date: new Date(date),
        label,
        note: note || null,
        type,
        ...(sharedFieldsProvided
          ? {
              isShared: !!isShared,
              splits:
                parsedSplits && parsedSplits.length
                  ? { create: parsedSplits.map((s) => ({ userId: s.userId, shareAmount: s.shareAmount })) }
                  : undefined,
            }
          : {}),
      },
    });

    // Applique l'effet de la nouvelle version (compte(s) éventuellement différent(s)).
    await applyBalanceEffect(tx, { accountId, toAccountId: resolvedToAccountId, amount, type }, 1);
  });

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/comptes");
  revalidatePath("/dashboard/budget");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTransaction(transactionId: string) {
  const householdId = await getHouseholdId();
  if (!householdId) return;

  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, householdId },
  });
  if (!transaction) return;

  await prisma.$transaction(async (tx) => {
    await tx.transaction.delete({ where: { id: transactionId } });
    await applyBalanceEffect(
      tx,
      { accountId: transaction.accountId, toAccountId: transaction.toAccountId, amount: transaction.amount, type: transaction.type },
      -1
    );
  });

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/comptes");
  revalidatePath("/dashboard/budget");
  revalidatePath("/dashboard");
}
