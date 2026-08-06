-- CreateTable
CREATE TABLE "OneOffPurchase" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "occasion" TEXT,
    "isBought" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OneOffPurchase_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OneOffPurchase" ADD CONSTRAINT "OneOffPurchase_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
