ALTER TABLE "User"
ADD COLUMN "salonApplicationName" TEXT,
ADD COLUMN "salonApplicationDescription" TEXT,
ADD COLUMN "ownershipProofUrl" TEXT,
ADD COLUMN "locationImageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "applicationSubmittedAt" TIMESTAMP(3),
ADD COLUMN "applicationReviewedAt" TIMESTAMP(3),
ADD COLUMN "applicationReviewNote" TEXT;
