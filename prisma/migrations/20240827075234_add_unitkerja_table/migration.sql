/*
  Warnings:

  - You are about to drop the column `unitKerja` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "unitKerja",
ADD COLUMN     "unitKerjaId" INTEGER;

-- CreateTable
CREATE TABLE "unit_kerjas" (
    "id" SERIAL NOT NULL,
    "nama" VARCHAR(255) NOT NULL,

    CONSTRAINT "unit_kerjas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_unitKerjaId_fkey" FOREIGN KEY ("unitKerjaId") REFERENCES "unit_kerjas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
