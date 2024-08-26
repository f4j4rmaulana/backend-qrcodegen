-- Aktivasi ekstensi uuid-ossp untuk menghasilkan UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable users dengan UUID
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),  -- Menggunakan UUID sebagai primary key
    "name" VARCHAR(255),
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable documents dengan UUID
CREATE TABLE "documents" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),  -- Menggunakan UUID sebagai primary key
    "originalFileName" TEXT NOT NULL,
    "barcodeFileName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "originalFilePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL,  -- Mengubah tipe userId menjadi UUID

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex untuk email unik di tabel users
CREATE UNIQUE INDEX "email" ON "users"("email");

-- AddForeignKey dengan UUID sebagai foreign key
ALTER TABLE "documents" ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
