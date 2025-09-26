/*
  Warnings:

  - The primary key for the `CampaignRecipient` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[campaignId,contactId]` on the table `CampaignRecipient` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Campaign` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Campaign" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."CampaignRecipient" DROP CONSTRAINT "CampaignRecipient_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD CONSTRAINT "CampaignRecipient_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignRecipient_campaignId_contactId_key" ON "public"."CampaignRecipient"("campaignId", "contactId");
