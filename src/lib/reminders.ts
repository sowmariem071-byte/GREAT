import { NotificationType, Role, VideoStatus } from "@prisma/client";
import { endOfShanghaiDay, isAfterShanghaiReminderTime, startOfShanghaiDay } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

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
  const users = await prisma.user.findMany({
    where: { role: { in: [Role.DIRECTOR, Role.EDITOR] }, status: "ACTIVE" },
  });

  await Promise.all(
    users.map(async (user) => {
      const existing = await prisma.notification.findFirst({
        where: {
          userId: user.id,
          type: NotificationType.DEADLINE_REMINDER,
          createdAt: { gte: start, lt: end },
        },
      });
      if (existing) return;

      const target = await latestTarget(user.id);
      if (!target) return;

      if (user.role === Role.DIRECTOR) {
        const scripts = await prisma.script.findMany({
          where: { authorId: user.id, createdAt: { gte: start, lt: end } },
          select: { category: true },
        });
        const chineseDone = scripts.filter((script) => script.category !== "FEMALE").length;
        const femaleDone = scripts.filter((script) => script.category === "FEMALE").length;
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
}
