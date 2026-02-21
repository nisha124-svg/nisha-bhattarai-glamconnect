-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('GENERAL', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_REJECTED', 'BOOKING_RESCHEDULED', 'BOOKING_COMPLETED', 'BOOKING_REQUEST', 'NEW_REVIEW', 'CHAT_MESSAGE');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "link" TEXT,
ADD COLUMN     "type" "NotificationType" NOT NULL DEFAULT 'GENERAL';

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "appointmentId" TEXT,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
