-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('pdf', 'docx', 'pptx');

-- DropTable
DROP TABLE "Product";

-- DropTable
DROP TABLE "SyncCursor";

-- DropTable
DROP TABLE "SyncLog";

-- DropEnum
DROP TYPE "Platform";

-- CreateTable
CREATE TABLE "Ebook" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileType" "FileType" NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "coverUrl" TEXT,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ebook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ebook_slug_key" ON "Ebook"("slug");

-- CreateIndex
CREATE INDEX "Ebook_published_idx" ON "Ebook"("published");

