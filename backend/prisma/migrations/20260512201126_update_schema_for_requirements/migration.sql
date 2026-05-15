/*
  Warnings:

  - You are about to drop the column `country` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `filename` on the `EventPhoto` table. All the data in the column will be lost.
  - You are about to drop the column `deletedByReceiver` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `deletedBySender` on the `Message` table. All the data in the column will be lost.
  - Added the required column `url` to the `EventPhoto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "country";

-- AlterTable
ALTER TABLE "EventPhoto" DROP COLUMN "filename",
ADD COLUMN     "url" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "deletedByReceiver",
DROP COLUMN "deletedBySender";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "zipCode" TEXT;

-- CreateTable
CREATE TABLE "EventView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventView_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EventView" ADD CONSTRAINT "EventView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventView" ADD CONSTRAINT "EventView_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
