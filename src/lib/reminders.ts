import { NotificationType, Role, VideoStatus } from "@prisma/client";
import { endOfShanghaiDay, isAfterShanghaiReminderTime, startOfShanghaiDay } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

const globalForReminders = globalThis as unknown as {
  deadlineReminderRunKey?: string;
};

async function latestTarget(userId: string) {
  return prisma.dailyTarget.findFirst({
    where: { userId },
    orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
  });
}

export async function ensureDeadlineReminders() {
  if (!isAfterShanghaiReminderTime()) return;

  const start = startOfShanghaiDay();
  const end = endOfShanghaiDay();
  const runKey = start.toISOString();
  if (globalForReminders.deadlineReminderRunKey === runKey) return;

  const users = await prisma.user.findMany({
    where: { role: { in: [Role.DIRECTOR, Role.EDITOR] }, status: "ACTIVE" },
    include: {
      dailyTargets: {
        orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
        take: 1,
      },
    },
  });
  if (users.length === 0) {
    globalForReminders.deadlineReminderRunKey = runKey;
    return;
  }

  const existingNotifications = await prisma.notification.findMany({
    where: {
      userId: { in: users.map((user) => user.id) },
      type: NotificationType.DEADLINE_REMINDER,
      createdAt: { gte: start, lt: end },
    },
    select: { userId: true },
  });
  const notifiedUserIds = new Set(existingNotifications.map((notification) => notification.userId));

  await Promise.all(
    users.map(async (user) => {
      if (notifiedUserIds.has(user.id)) return;

      const target = user.dailyTargets[0] ?? await latestTarget(user.id);
      if (!target) return;

      if (user.role === Role.DIRECTOR) {
        const [chineseDone, femaleDone] = await Promise.all([
          prisma.script.count({
            where: { authorId: user.id, createdAt: { gte: start, lt: end }, category: { not: "FEMALE" } },
          }),
          prisma.script.count({
            where: { authorId: user.id, createdAt: { gte: start, lt: end }, category: "FEMALE" },
          }),
        ]);
        const chineseGap = Math.max(0, target.chineseParentingScripts - chineseDone);
        const femaleGap = Math.max(0, target.femaleScripts - femaleDone);

        if (chineseGap + femaleGap > 0) {
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: NotificationType.DEADLINE_REMINDER,
              title: "16:30 工作量提醒",
              message: `今天还差 ${chineseGap} 条中式育儿文案、${femaleGap} 条女性文案，请尽快补齐。`,
              dueAt: new Date(),
            },
          });
        }
      }

      if (user.role === Role.EDITOR) {
        const done = await prisma.videoTask.count({
          where: {
            editorId: user.id,
            deliveredAt: { gte: start, lt: end },
            status: { in: [VideoStatus.PENDING_REVIEW, VideoStatus.APPROVED, VideoStatus.READY_TO_PUBLISH, VideoStatus.SCHEDULED, VideoStatus.PUBLISHED, VideoStatus.STOCK] },
          },
        });
        const gap = Math.max(0, target.editingVideos - done);

        if (gap > 0) {
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: NotificationType.DEADLINE_REMINDER,
              title: "16:30 剪辑交付提醒",
              message: `今天还差 ${gap} 条剪辑任务，请优先处理待剪辑、剪辑中和需修改的视频。`,
              dueAt: new Date(),
            },
          });
        }
      }
    }),
  );

  globalForReminders.deadlineReminderRunKey = runKey;
}
