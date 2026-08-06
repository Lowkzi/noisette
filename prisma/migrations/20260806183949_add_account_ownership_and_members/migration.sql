-- CreateEnum
CREATE TYPE "AccountOwnership" AS ENUM ('INDIVIDUAL', 'JOINT');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "ownership" "AccountOwnership" NOT NULL DEFAULT 'INDIVIDUAL';

-- CreateTable
CREATE TABLE "_AccountMembers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AccountMembers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AccountMembers_B_index" ON "_AccountMembers"("B");

-- AddForeignKey
ALTER TABLE "_AccountMembers" ADD CONSTRAINT "_AccountMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AccountMembers" ADD CONSTRAINT "_AccountMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
