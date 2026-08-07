-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "bank" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "defaultAccountId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_defaultAccountId_fkey" FOREIGN KEY ("defaultAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
