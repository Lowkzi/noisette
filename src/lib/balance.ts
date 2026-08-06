import { prisma } from "@/lib/prisma";

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

// Applique (sign = 1) ou annule (sign = -1) l'effet d'une transaction sur le(s) solde(s) de
// compte(s) concerné(s). Un virement (TRANSFER) débite accountId et crédite toAccountId du même
// montant ; les autres types ne touchent que accountId.
export async function applyBalanceEffect(
  tx: TxClient,
  entry: { accountId: string; toAccountId: string | null; amount: number; type: string },
  sign: 1 | -1
) {
  if (entry.type === "TRANSFER" && entry.toAccountId) {
    await tx.account.update({
      where: { id: entry.accountId },
      data: { currentBalance: { increment: -sign * entry.amount } },
    });
    await tx.account.update({
      where: { id: entry.toAccountId },
      data: { currentBalance: { increment: sign * entry.amount } },
    });
    return;
  }
  const delta = entry.type === "INCOME" ? entry.amount : entry.type === "TRANSFER" ? 0 : -entry.amount;
  await tx.account.update({
    where: { id: entry.accountId },
    data: { currentBalance: { increment: sign * delta } },
  });
}
