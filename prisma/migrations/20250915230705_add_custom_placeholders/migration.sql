-- AlterTable
ALTER TABLE "public"."Template" ADD COLUMN     "customPlaceholders" TEXT[] DEFAULT ARRAY[]::TEXT[];
