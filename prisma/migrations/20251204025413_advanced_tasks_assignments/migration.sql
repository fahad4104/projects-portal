/*
  Warnings:

  - You are about to drop the `ProjectMessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `assignedToConsultant` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `assignedToContractor` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `assignedToOwner` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `fromRole` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `isCritical` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `toConsultant` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `toContractor` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `toOwner` on the `Task` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ProjectMember_projectId_userId_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN "updatedAt" DATETIME;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProjectMessage";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "TaskAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleLabel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
INSERT INTO "new_Drawing" ("boxName", "fileName", "filePath", "id", "isArchived", "projectId", "uploadedAt", "uploadedBy") SELECT "boxName", "fileName", "filePath", "id", "isArchived", "projectId", "uploadedAt", "uploadedBy" FROM "Drawing";
DROP TABLE "Drawing";
ALTER TABLE "new_Drawing" RENAME TO "Drawing";
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "ownerRoleLabel" TEXT,
    "visibleToRoles" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "createdByUserId" TEXT,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("createdAt", "id", "projectId", "status", "title") SELECT "createdAt", "id", "projectId", "status", "title" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
