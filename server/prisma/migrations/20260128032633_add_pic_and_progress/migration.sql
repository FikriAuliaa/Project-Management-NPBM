/*
  Warnings:

  - You are about to drop the column `filename` on the `Attachment` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `creatorId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `User` table. All the data in the column will be lost.
  - Added the required column `name` to the `Attachment` table without a default value. This is not possible if the table is not empty.
  - Made the column `user` on table `Comment` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `title` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_creatorId_fkey";

-- AlterTable
ALTER TABLE "Attachment" DROP COLUMN "filename",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Comment" ALTER COLUMN "user" SET NOT NULL;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "userId",
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'info';

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "creatorId",
DROP COLUMN "department",
ADD COLUMN     "picOtherDiv" TEXT,
ALTER COLUMN "startDate" DROP NOT NULL,
ALTER COLUMN "startDate" DROP DEFAULT,
ALTER COLUMN "targetDate" DROP NOT NULL,
ALTER COLUMN "dueDate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "department";
