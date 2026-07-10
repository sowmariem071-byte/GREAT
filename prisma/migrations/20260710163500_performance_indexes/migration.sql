-- Add indexes for frequent dashboard, queue, notification, and archive lookups.
CREATE INDEX IF NOT EXISTS "Session_expiresAt_idx" ON "Session"("expiresAt");

CREATE INDEX IF NOT EXISTS "VideoTask_editorId_deliveredAt_idx" ON "VideoTask"("editorId", "deliveredAt");
CREATE INDEX IF NOT EXISTS "VideoTask_directorId_createdAt_idx" ON "VideoTask"("directorId", "createdAt");
CREATE INDEX IF NOT EXISTS "VideoTask_directorId_plannedPublishDate_idx" ON "VideoTask"("directorId", "plannedPublishDate");
CREATE INDEX IF NOT EXISTS "VideoTask_status_createdAt_idx" ON "VideoTask"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "VideoTask_status_updatedAt_idx" ON "VideoTask"("status", "updatedAt");

CREATE INDEX IF NOT EXISTS "ReviewRound_videoTaskId_createdAt_idx" ON "ReviewRound"("videoTaskId", "createdAt");
CREATE INDEX IF NOT EXISTS "ReviewRound_createdAt_idx" ON "ReviewRound"("createdAt");

CREATE INDEX IF NOT EXISTS "PublishSchedule_status_publishedAt_idx" ON "PublishSchedule"("status", "publishedAt");
CREATE INDEX IF NOT EXISTS "PublishSchedule_videoTaskId_status_idx" ON "PublishSchedule"("videoTaskId", "status");

CREATE INDEX IF NOT EXISTS "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");
CREATE INDEX IF NOT EXISTS "Notification_userId_type_createdAt_idx" ON "Notification"("userId", "type", "createdAt");
