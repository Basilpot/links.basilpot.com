ALTER TABLE "Profile" DROP COLUMN "avatar", DROP COLUMN "avatarType", ADD COLUMN "avatarPath" TEXT;
ALTER TABLE "Link" ADD COLUMN "description" TEXT NOT NULL DEFAULT '', ADD COLUMN "imagePath" TEXT;
