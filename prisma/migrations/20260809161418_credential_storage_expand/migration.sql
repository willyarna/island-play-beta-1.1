-- AlterTable
ALTER TABLE "Account"
ADD COLUMN "passwordEncryptedPayload" TEXT,
ADD COLUMN "passwordKeyVersion" VARCHAR(64);

-- AlterTable
ALTER TABLE "Profile"
ADD COLUMN "pinEncryptedPayload" TEXT,
ADD COLUMN "pinKeyVersion" VARCHAR(64);

-- AddConstraint
ALTER TABLE "Account"
ADD CONSTRAINT "Account_password_encrypted_pair_check"
CHECK (
  ("passwordEncryptedPayload" IS NULL AND "passwordKeyVersion" IS NULL)
  OR (
    "passwordEncryptedPayload" IS NOT NULL
    AND char_length(btrim("passwordEncryptedPayload")) > 0
    AND "passwordKeyVersion" IS NOT NULL
    AND char_length(btrim("passwordKeyVersion")) > 0
  )
) NOT VALID;

-- AddConstraint
ALTER TABLE "Profile"
ADD CONSTRAINT "Profile_pin_encrypted_pair_check"
CHECK (
  ("pinEncryptedPayload" IS NULL AND "pinKeyVersion" IS NULL)
  OR (
    "pinEncryptedPayload" IS NOT NULL
    AND char_length(btrim("pinEncryptedPayload")) > 0
    AND "pinKeyVersion" IS NOT NULL
    AND char_length(btrim("pinKeyVersion")) > 0
  )
) NOT VALID;
