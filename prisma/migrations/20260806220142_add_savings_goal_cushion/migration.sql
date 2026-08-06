-- AlterTable
ALTER TABLE "SavingsGoal" ADD COLUMN     "accountId" TEXT,
ADD COLUMN     "isCushion" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "SavingsGoal" ADD CONSTRAINT "SavingsGoal_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
