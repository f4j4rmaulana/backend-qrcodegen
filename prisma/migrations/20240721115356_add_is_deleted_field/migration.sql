-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_userId_fkey";

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
