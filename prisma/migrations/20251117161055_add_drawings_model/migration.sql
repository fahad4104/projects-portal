/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Drawing` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Drawing` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Drawing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "boxName" TEXT NOT NULL,
    "fileName" TEXT,
    "filePath" TEXT,
    "uploadedBy" TEXT,
    "uploadedAt" DATETIME,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Drawing_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Drawing" ("boxName", "fileName", "id", "isArchived", "projectId", "uploadedAt", "uploadedBy") SELECT "boxName", "fileName", "id", "isArchived", "projectId", "uploadedAt", "uploadedBy" FROM "Drawing";
DROP TABLE "Drawing";
ALTER TABLE "new_Drawing" RENAME TO "Drawing";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
