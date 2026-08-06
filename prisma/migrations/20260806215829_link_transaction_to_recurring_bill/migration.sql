-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "sourceRecurringBillId" TEXT;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sourceRecurringBillId_fkey" FOREIGN KEY ("sourceRecurringBillId") REFERENCES "RecurringBill"("id") ON DELETE SET NULL ON UPDATE CASCADE;
