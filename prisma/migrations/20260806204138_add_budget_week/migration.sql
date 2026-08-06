-- CreateTable
CREATE TABLE "BudgetWeek" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "weekIndex" INTEGER NOT NULL,
    "plannedAmount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BudgetWeek_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BudgetWeek_budgetId_weekIndex_key" ON "BudgetWeek"("budgetId", "weekIndex");

-- AddForeignKey
ALTER TABLE "BudgetWeek" ADD CONSTRAINT "BudgetWeek_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
