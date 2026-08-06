"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUser, getHouseholdId } from "@/lib/dal";
import { TransactionFormSchema, TransactionFormState } from "@/lib/definitions";

// Applique la variation de solde d'un compte pour une transaction donnée (signe selon le type).
function balanceDelta(amount: number, type: "EXPENSE" | "INCOME" | "TRANSFER" | "DIRECT_DEBIT") {
  if (type === "INCOME") return amount;
  if (type === "EXPENSE" || type === "DIRECT_DEBIT") return -amount;
  return 0; // TRANSFER : V1 ne gère qu'un compte par transaction, pas de mouvement inter-comptes
}

export async function createTransaction(
  state: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const householdId = await getHouseholdId();
  const user = await getUser();
  if (!householdId || !user) return { message: "Foyer introuvable." };

  const validatedFields = TransactionFormSchema.safeParse({
    accountId: formData.get("accountId"),
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

  const { accountId, categoryId, amount, date, label, note, type, isShared, splits } =
    validatedFields.data;

  const account = await prisma.account.findFirst({ where: { id: accountId, householdId } });
  if (!account) return { message: "Compte introuvable." };

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
        categoryId: categoryId || null,
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

    await tx.account.update({
      where: { id: accountId },
      data: { currentBalance: { increment: balanceDelta(amount, type) } },
    });
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

  const { accountId, categoryId, amount, date, label, note, type, isShared, splits } =
    validatedFields.data;

  const account = await prisma.account.findFirst({ where: { id: accountId, householdId } });
  if (!account) return { message: "Compte introuvable." };

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
    // Annule l'effet de l'ancienne transaction sur le solde de son compte d'origine.
    await tx.account.update({
      where: { id: existing.accountId },
      data: { currentBalance: { increment: -balanceDelta(existing.amount, existing.type) } },
    });

    if (sharedFieldsProvided) {
      await tx.transactionSplit.deleteMany({ where: { transactionId } });
    }
    await tx.transaction.update({
      where: { id: transactionId },
      data: {
        accountId,
        categoryId: categoryId || null,
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

    // Applique l'effet de la nouvelle version sur le solde du compte (éventuellement différent).
    await tx.account.update({
      where: { id: accountId },
      data: { currentBalance: { increment: balanceDelta(amount, type) } },
    });
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
    await tx.account.update({
      where: { id: transaction.accountId },
      data: {
        currentBalance: {
          increment: -balanceDelta(transaction.amount, transaction.type),
        },
      },
    });
  });

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/comptes");
  revalidatePath("/dashboard/budget");
  revalidatePath("/dashboard");
}
