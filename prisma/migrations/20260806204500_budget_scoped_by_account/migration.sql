
-- DropIndex
DROP INDEX "Budget_categoryId_month_key";

-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "accountId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Budget_categoryId_accountId_month_key" ON "Budget"("categoryId", "accountId", "month");

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

