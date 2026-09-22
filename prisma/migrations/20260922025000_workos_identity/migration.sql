ALTER TABLE "User" ADD COLUMN "workosId" TEXT;
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
CREATE UNIQUE INDEX "User_workosId_key" ON "User"("workosId");
