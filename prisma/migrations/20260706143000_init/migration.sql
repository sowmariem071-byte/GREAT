-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DIRECTOR', 'EDITOR');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ScriptCategory" AS ENUM ('TRADITIONAL', 'ASSIST', 'FEMALE');

-- CreateEnum
CREATE TYPE "VideoType" AS ENUM ('CHINESE_PARENTING', 'FEMALE');

-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('PENDING_EDIT', 'IN_PROGRESS', 'PENDING_REVIEW', 'NEEDS_REVISION', 'APPROVED', 'READY_TO_PUBLISH', 'SCHEDULED', 'PUBLISHED', 'STOCK');

-- CreateEnum
CREATE TYPE "ReviewDecision" AS ENUM ('NEEDS_REVISION', 'APPROVED');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('SCHEDULED', 'PUBLISHED', 'CANCELED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('DEADLINE_REMINDER', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "avatarUrl" TEXT,
    "passwordHash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyTarget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chineseParentingScripts" INTEGER NOT NULL DEFAULT 0,
    "femaleScripts" INTEGER NOT NULL DEFAULT 0,
    "editingVideos" INTEGER NOT NULL DEFAULT 0,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Script" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" "ScriptCategory" NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Script_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoTask" (
    "id" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "directorId" TEXT NOT NULL,
    "editorId" TEXT NOT NULL,
    "type" "VideoType" NOT NULL,
    "materialUrl" TEXT NOT NULL,
    "plannedDeliveryAt" TIMESTAMP(3) NOT NULL,
    "plannedPublishDate" TIMESTAMP(3),
    "publishTime" TEXT,
    "durationSeconds" INTEGER,
    "status" "VideoStatus" NOT NULL DEFAULT 'PENDING_EDIT',
    "videoUrl" TEXT,
    "notes" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewRound" (
    "id" TEXT NOT NULL,
    "videoTaskId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "decision" "ReviewDecision" NOT NULL,
    "comment" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewAttachment" (
    "id" TEXT NOT NULL,
    "reviewRoundId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "contentType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishSchedule" (
    "id" TEXT NOT NULL,
    "videoTaskId" TEXT NOT NULL,
    "plannedPublishDate" TIMESTAMP(3) NOT NULL,
    "publishTime" TEXT NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "publishUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublishSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThemePreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "presetName" TEXT NOT NULL,
    "accent" TEXT NOT NULL,
    "accent2" TEXT NOT NULL,
    "accent3" TEXT NOT NULL,
    "backgroundStyle" TEXT NOT NULL DEFAULT 'glass-mint',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThemePreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "DailyTarget_userId_effectiveFrom_idx" ON "DailyTarget"("userId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "Script_authorId_createdAt_idx" ON "Script"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "Script_category_idx" ON "Script"("category");

-- CreateIndex
CREATE INDEX "VideoTask_editorId_status_idx" ON "VideoTask"("editorId", "status");

-- CreateIndex
CREATE INDEX "VideoTask_directorId_status_idx" ON "VideoTask"("directorId", "status");

-- CreateIndex
CREATE INDEX "VideoTask_plannedDeliveryAt_idx" ON "VideoTask"("plannedDeliveryAt");

-- CreateIndex
CREATE INDEX "VideoTask_plannedPublishDate_idx" ON "VideoTask"("plannedPublishDate");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewRound_videoTaskId_roundNumber_key" ON "ReviewRound"("videoTaskId", "roundNumber");

-- CreateIndex
CREATE INDEX "PublishSchedule_plannedPublishDate_status_idx" ON "PublishSchedule"("plannedPublishDate", "status");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "ThemePreference_userId_key" ON "ThemePreference"("userId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyTarget" ADD CONSTRAINT "DailyTarget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Script" ADD CONSTRAINT "Script_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoTask" ADD CONSTRAINT "VideoTask_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoTask" ADD CONSTRAINT "VideoTask_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoTask" ADD CONSTRAINT "VideoTask_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewRound" ADD CONSTRAINT "ReviewRound_videoTaskId_fkey" FOREIGN KEY ("videoTaskId") REFERENCES "VideoTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewRound" ADD CONSTRAINT "ReviewRound_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewAttachment" ADD CONSTRAINT "ReviewAttachment_reviewRoundId_fkey" FOREIGN KEY ("reviewRoundId") REFERENCES "ReviewRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishSchedule" ADD CONSTRAINT "PublishSchedule_videoTaskId_fkey" FOREIGN KEY ("videoTaskId") REFERENCES "VideoTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThemePreference" ADD CONSTRAINT "ThemePreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
