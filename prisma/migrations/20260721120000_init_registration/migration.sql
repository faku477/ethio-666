-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Registration" (
    "id" SERIAL NOT NULL,
    "registrationId" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "identificationId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "bankAccountNumber" TEXT NOT NULL,
    "email" TEXT,
    "photoUrl" TEXT NOT NULL,
    "photoMimeType" TEXT NOT NULL,
    "photoSize" INTEGER NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NumberSequence" (
    "prefix" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "lastValue" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NumberSequence_pkey" PRIMARY KEY ("prefix","year")
);

-- CreateIndex
CREATE UNIQUE INDEX "Registration_registrationId_key" ON "Registration"("registrationId");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_certificateNumber_key" ON "Registration"("certificateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_identificationId_key" ON "Registration"("identificationId");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_phoneNumber_key" ON "Registration"("phoneNumber");

-- CreateIndex
CREATE INDEX "Registration_status_idx" ON "Registration"("status");

-- CreateIndex
CREATE INDEX "Registration_createdAt_idx" ON "Registration"("createdAt");

-- CreateIndex
CREATE INDEX "Registration_fullName_idx" ON "Registration"("fullName");

