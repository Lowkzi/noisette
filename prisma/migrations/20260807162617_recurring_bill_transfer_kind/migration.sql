-- CreateEnum
CREATE TYPE "RecurringKind" AS ENUM ('EXPENSE', 'INCOME', 'TRANSFER');

-- AlterTable
ALTER TABLE "RecurringBill" ADD COLUMN     "toAccountId" TEXT;

-- Convertit la colonne "kind" vers le nouvel enum en préservant les valeurs existantes
-- (EXPENSE/INCOME ont les mêmes libellés dans les deux enums), au lieu de la recréer.
ALTER TABLE "RecurringBill" ALTER COLUMN "kind" DROP DEFAULT;
ALTER TABLE "RecurringBill" ALTER COLUMN "kind" TYPE "RecurringKind" USING ("kind"::text::"RecurringKind");
ALTER TABLE "RecurringBill" ALTER COLUMN "kind" SET DEFAULT 'EXPENSE';

-- AddForeignKey
ALTER TABLE "RecurringBill" ADD CONSTRAINT "RecurringBill_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
