/*
  Warnings:

  - You are about to drop the column `refreshToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `refreshTokenExpiry` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "dev"."User" DROP COLUMN "refreshToken",
DROP COLUMN "refreshTokenExpiry";
