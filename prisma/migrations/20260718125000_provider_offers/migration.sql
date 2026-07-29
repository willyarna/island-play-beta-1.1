-- CreateTable
CREATE TABLE "ProviderOffer" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProviderOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProviderOffer_providerId_idx" ON "ProviderOffer"("providerId");

-- CreateIndex
CREATE INDEX "ProviderOffer_productId_idx" ON "ProviderOffer"("productId");

-- CreateIndex
CREATE INDEX "ProviderOffer_active_deletedAt_idx" ON "ProviderOffer"("active", "deletedAt");

-- AddForeignKey
ALTER TABLE "ProviderOffer" ADD CONSTRAINT "ProviderOffer_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderOffer" ADD CONSTRAINT "ProviderOffer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing product provider costs as provider offers
INSERT INTO "ProviderOffer" ("id", "providerId", "productId", "costCents", "active", "createdAt", "updatedAt")
SELECT
    concat('offer_', "providerId", '_', "id"),
    "providerId",
    "id",
    "costCents",
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Product"
WHERE "providerId" IS NOT NULL AND "deletedAt" IS NULL;
