"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ReviewDecision,
  Role,
  ScheduleStatus,
  ScriptCategory,
  UserStatus,
  VideoStatus,
  VideoType,
} from "@prisma/client";
import { pickEditorWithLightestQueue } from "@/lib/assignment";
import { canManageAll, requireRole, requireUser } from "@/lib/auth";
import { parseShanghaiDate } from "@/lib/dates";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { uploadObject } from "@/lib/storage";

function requiredString(formData: FormData, key: string) {
  const value = String(formData.get(key) || "").trim();
  if (!value) throw new Error(`${key} is required.`);
  return value;
}

function optionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) || "").trim();
  return value || null;
}

function enumValue<T extends Record<string, string>>(target: T, value: string, fallback: T[keyof T]) {
  return Object.values(target).includes(value) ? (value as T[keyof T]) : fallback;
}

function scriptType(category: ScriptCategory) {
  return category === ScriptCategory.FEMALE ? VideoType.FEMALE : VideoType.CHINESE_PARENTING;
}

const shellRevalidationPaths = [
  "/dashboard",
  "/scripts",
  "/videos",
  "/editing",
  "/review",
  "/schedule",
  "/inventory",
  "/people",
  "/settings",
];

function revalidateShellPages() {
  shellRevalidationPaths.forEach((path) => revalidatePath(path));
}

const editorMutableStatuses: VideoStatus[] = [
  VideoStatus.PENDING_EDIT,
  VideoStatus.IN_PROGRESS,
  VideoStatus.NEEDS_REVISION,
];

const schedulableStatuses: VideoStatus[] = [
  VideoStatus.APPROVED,
  VideoStatus.READY_TO_PUBLISH,
  VideoStatus.STOCK,
  VideoStatus.SCHEDULED,
];

async function assertVideoAccess(videoTaskId: string, allowedRoles: Role[]) {
  const user = await requireRole(allowedRoles);
  const video = await prisma.videoTask.findUnique({
    where: { id: videoTaskId },
    include: { script: true },
  });

  if (!video) throw new Error("Video task not found.");
  if (user.role === Role.DIRECTOR && video.directorId !== user.id) {
    throw new Error("You can only operate your own directed videos.");
  }
  if (user.role === Role.EDITOR && video.editorId !== user.id) {
    throw new Error("You can only operate your own editing tasks.");
  }

  return { user, video };
}

export async function createScriptAction(formData: FormData) {
  const user = await requireRole([Role.ADMIN, Role.DIRECTOR]);
  const title = requiredString(formData, "title");
  const body = requiredString(formData, "body");
  const category = enumValue(ScriptCategory, requiredString(formData, "category"), ScriptCategory.TRADITIONAL);
  const authorId = canManageAll(user.role) ? optionalString(formData, "authorId") || user.id : user.id;

  await prisma.script.create({
    data: { title, body, category, authorId },
  });

  revalidatePath("/scripts");
  revalidatePath("/dashboard");
}

export async function updateScriptAction(formData: FormData) {
  const user = await requireRole([Role.ADMIN, Role.DIRECTOR]);
  const scriptId = requiredString(formData, "scriptId");
  const title = requiredString(formData, "title");
  const body = requiredString(formData, "body");
  const category = enumValue(ScriptCategory, requiredString(formData, "category"), ScriptCategory.TRADITIONAL);

  const script = await prisma.script.findUnique({ where: { id: scriptId } });
  if (!script) throw new Error("Script not found.");
  if (user.role === Role.DIRECTOR && script.authorId !== user.id) {
    throw new Error("You can only edit your own scripts.");
  }

  await prisma.script.update({
    where: { id: scriptId },
    data: { title, body, category },
  });

  revalidatePath("/scripts");
  revalidatePath("/dashboard");
  revalidatePath("/videos");
}

export async function createVideoTaskAction(formData: FormData) {
  const user = await requireRole([Role.ADMIN, Role.DIRECTOR]);
  const scriptId = requiredString(formData, "scriptId");
  const materialUrl = requiredString(formData, "materialUrl");
  const plannedDeliveryAt = parseShanghaiDate(requiredString(formData, "plannedDeliveryAt"));
  const plannedPublishDateValue = optionalString(formData, "plannedPublishDate");
  const plannedPublishDate = plannedPublishDateValue ? parseShanghaiDate(plannedPublishDateValue) : null;
  const publishTime = optionalString(formData, "publishTime");
  const notes = optionalString(formData, "notes");

  const script = await prisma.script.findUnique({ where: { id: scriptId } });
  if (!script) throw new Error("Script not found.");
  if (user.role === Role.DIRECTOR && script.authorId !== user.id) {
    throw new Error("You can only create video tasks from your own scripts.");
  }

  const editor = await pickEditorWithLightestQueue();

  await prisma.videoTask.create({
    data: {
      scriptId,
      directorId: script.authorId,
      editorId: editor.id,
      type: scriptType(script.category),
      materialUrl,
      plannedDeliveryAt,
      plannedPublishDate,
      publishTime,
      notes,
    },
  });

  revalidatePath("/videos");
  revalidatePath("/editing");
  revalidatePath("/dashboard");
}

export async function createScriptAndVideoTaskAction(formData: FormData) {
  const user = await requireRole([Role.ADMIN, Role.DIRECTOR]);
  const title = requiredString(formData, "newTitle");
  const body = requiredString(formData, "newBody");
  const category = enumValue(ScriptCategory, requiredString(formData, "newCategory"), ScriptCategory.TRADITIONAL);
  const authorId = canManageAll(user.role) ? optionalString(formData, "authorId") || user.id : user.id;

  const script = await prisma.script.create({
    data: { title, body, category, authorId },
  });

  const editor = await pickEditorWithLightestQueue();
  const plannedPublishDateValue = optionalString(formData, "plannedPublishDate");

  await prisma.videoTask.create({
    data: {
      scriptId: script.id,
      directorId: authorId,
      editorId: editor.id,
      type: scriptType(category),
      materialUrl: requiredString(formData, "materialUrl"),
      plannedDeliveryAt: parseShanghaiDate(requiredString(formData, "plannedDeliveryAt")),
      plannedPublishDate: plannedPublishDateValue ? parseShanghaiDate(plannedPublishDateValue) : null,
      publishTime: optionalString(formData, "publishTime"),
      notes: optionalString(formData, "notes"),
    },
  });

  revalidatePath("/scripts");
  revalidatePath("/videos");
  revalidatePath("/editing");
  revalidatePath("/dashboard");
}

export async function updateEditorTaskAction(formData: FormData) {
  const videoTaskId = requiredString(formData, "videoTaskId");
  const status = enumValue(VideoStatus, requiredString(formData, "status"), VideoStatus.IN_PROGRESS);
  const { video } = await assertVideoAccess(videoTaskId, [Role.ADMIN, Role.EDITOR]);

  if (!editorMutableStatuses.includes(video.status)) {
    throw new Error("Only active editing tasks can be updated by editors.");
  }

  const editorAllowedStatuses: VideoStatus[] = [VideoStatus.IN_PROGRESS, VideoStatus.PENDING_REVIEW];
  if (!editorAllowedStatuses.includes(status)) {
    throw new Error("Editors can only mark tasks as editing or pending review.");
  }

  const videoUrl = optionalString(formData, "videoUrl") || video.videoUrl;
  const durationValue = optionalString(formData, "durationSeconds");
  const durationSeconds = durationValue ? Number(durationValue) : video.durationSeconds;

  if (status === VideoStatus.PENDING_REVIEW && !videoUrl) {
    throw new Error("提交待审核时必须填写视频链接。");
  }

  await prisma.videoTask.update({
    where: { id: videoTaskId },
    data: {
      status,
      videoUrl,
      durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : null,
      deliveredAt: status === VideoStatus.PENDING_REVIEW ? new Date() : video.deliveredAt,
    },
  });

  revalidatePath("/editing");
  revalidatePath("/review");
  revalidatePath("/videos");
  revalidatePath("/dashboard");
}

export async function submitReviewAction(formData: FormData) {
  const videoTaskId = requiredString(formData, "videoTaskId");
  const decision = enumValue(ReviewDecision, requiredString(formData, "decision"), ReviewDecision.NEEDS_REVISION);
  const videoUrl = requiredString(formData, "videoUrl");
  const comment = optionalString(formData, "comment");
  const { user, video } = await assertVideoAccess(videoTaskId, [Role.ADMIN, Role.DIRECTOR]);

  if (video.status !== VideoStatus.PENDING_REVIEW) {
    throw new Error("Only pending review videos can be reviewed.");
  }

  const latestRound = await prisma.reviewRound.findFirst({
    where: { videoTaskId },
    orderBy: { roundNumber: "desc" },
  });
  const roundNumber = (latestRound?.roundNumber || 0) + 1;

  const attachments = formData
    .getAll("attachments")
    .filter((item): item is File => item instanceof File && item.size > 0);

  await prisma.$transaction(async (tx) => {
    const review = await tx.reviewRound.create({
      data: {
        videoTaskId,
        roundNumber,
        videoUrl,
        decision,
        comment,
        createdById: user.id,
      },
    });

    for (const attachment of attachments) {
      const uploaded = await uploadObject(attachment, `reviews/${videoTaskId}/${roundNumber}`);
      await tx.reviewAttachment.create({
        data: {
          reviewRoundId: review.id,
          fileName: uploaded.fileName,
          objectKey: uploaded.objectKey,
          url: uploaded.url,
          contentType: uploaded.contentType,
        },
      });
    }

    if (decision === ReviewDecision.NEEDS_REVISION) {
      await tx.videoTask.update({
        where: { id: videoTaskId },
        data: { status: VideoStatus.NEEDS_REVISION, videoUrl, notes: comment || video.notes },
      });
      return;
    }

    if (video.plannedPublishDate) {
      await tx.publishSchedule.create({
        data: {
          videoTaskId,
          plannedPublishDate: video.plannedPublishDate,
          publishTime: video.publishTime || "19:30",
          status: ScheduleStatus.SCHEDULED,
        },
      });
    }

    await tx.videoTask.update({
      where: { id: videoTaskId },
      data: {
        status: video.plannedPublishDate ? VideoStatus.SCHEDULED : VideoStatus.STOCK,
        videoUrl,
        approvedAt: new Date(),
      },
    });
  });

  revalidatePath("/review");
  revalidatePath("/schedule");
  revalidatePath("/inventory");
  revalidatePath("/videos");
  revalidatePath("/dashboard");
}

export async function scheduleVideoAction(formData: FormData) {
  const videoTaskId = requiredString(formData, "videoTaskId");
  const plannedPublishDate = parseShanghaiDate(requiredString(formData, "plannedPublishDate"));
  const publishTime = requiredString(formData, "publishTime");
  const { video } = await assertVideoAccess(videoTaskId, [Role.ADMIN, Role.DIRECTOR]);

  if (!schedulableStatuses.includes(video.status)) {
    throw new Error("Only approved, ready or stock videos can be scheduled.");
  }

  await prisma.$transaction([
    prisma.publishSchedule.create({
      data: {
        videoTaskId,
        plannedPublishDate,
        publishTime,
      },
    }),
    prisma.videoTask.update({
      where: { id: videoTaskId },
      data: { plannedPublishDate, publishTime, status: VideoStatus.SCHEDULED },
    }),
  ]);

  revalidatePath("/schedule");
  revalidatePath("/inventory");
  revalidatePath("/videos");
  revalidatePath("/dashboard");
}

export async function markPublishedAction(formData: FormData) {
  const scheduleId = requiredString(formData, "scheduleId");
  const publishUrl = requiredString(formData, "publishUrl");
  const user = await requireRole([Role.ADMIN, Role.DIRECTOR]);
  const schedule = await prisma.publishSchedule.findUnique({
    where: { id: scheduleId },
    include: { videoTask: true },
  });

  if (!schedule) throw new Error("Schedule not found.");
  if (user.role === Role.DIRECTOR && schedule.videoTask.directorId !== user.id) {
    throw new Error("You can only publish your own scheduled videos.");
  }
  if (schedule.status !== ScheduleStatus.SCHEDULED || schedule.videoTask.status !== VideoStatus.SCHEDULED) {
    throw new Error("Only scheduled videos can be marked as published.");
  }

  const publishedAt = new Date();
  await prisma.$transaction([
    prisma.publishSchedule.update({
      where: { id: scheduleId },
      data: { status: ScheduleStatus.PUBLISHED, publishUrl, publishedAt },
    }),
    prisma.videoTask.update({
      where: { id: schedule.videoTaskId },
      data: { status: VideoStatus.PUBLISHED, publishedAt },
    }),
  ]);

  revalidatePath("/schedule");
  revalidatePath("/inventory");
  revalidatePath("/videos");
  revalidatePath("/dashboard");
}

export async function createUserAction(formData: FormData) {
  await requireRole([Role.ADMIN]);
  const email = requiredString(formData, "email").toLowerCase();
  const name = requiredString(formData, "name");
  const role = enumValue(Role, requiredString(formData, "role"), Role.DIRECTOR);
  const password = requiredString(formData, "password");

  await prisma.user.create({
    data: {
      email,
      name,
      role,
      passwordHash: await hashPassword(password),
    },
  });

  revalidatePath("/people");
  revalidatePath("/dashboard");
}

export async function updateTargetAction(formData: FormData) {
  await requireRole([Role.ADMIN]);
  const userId = requiredString(formData, "userId");
  await prisma.dailyTarget.create({
    data: {
      userId,
      chineseParentingScripts: Number(optionalString(formData, "chineseParentingScripts") || 0),
      femaleScripts: Number(optionalString(formData, "femaleScripts") || 0),
      editingVideos: Number(optionalString(formData, "editingVideos") || 0),
    },
  });

  revalidatePath("/people");
  revalidatePath("/dashboard");
}

export async function toggleUserStatusAction(formData: FormData) {
  const currentUser = await requireRole([Role.ADMIN]);
  const userId = requiredString(formData, "userId");
  const status = enumValue(UserStatus, requiredString(formData, "status"), UserStatus.ACTIVE);

  if (currentUser.id === userId && status === UserStatus.INACTIVE) {
    throw new Error("You cannot disable your own admin account.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status },
  });

  revalidatePath("/people");
}

export async function updateThemeAction(formData: FormData) {
  const user = await requireUser();
  await prisma.themePreference.upsert({
    where: { userId: user.id },
    update: {
      presetName: requiredString(formData, "presetName"),
      accent: requiredString(formData, "accent"),
      accent2: requiredString(formData, "accent2"),
      accent3: requiredString(formData, "accent3"),
    },
    create: {
      userId: user.id,
      presetName: requiredString(formData, "presetName"),
      accent: requiredString(formData, "accent"),
      accent2: requiredString(formData, "accent2"),
      accent3: requiredString(formData, "accent3"),
    },
  });

  revalidateShellPages();
}

export async function updateAvatarAction(formData: FormData) {
  const user = await requireUser();
  const avatarUrl = optionalString(formData, "avatarUrl");
  const file = formData.get("avatar");

  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadObject(file, `avatars/${user.id}`);
    await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: uploaded.url } });
  } else if (avatarUrl) {
    await prisma.user.update({ where: { id: user.id }, data: { avatarUrl } });
  }

  revalidateShellPages();
}

export async function readNotificationAction(formData: FormData) {
  const user = await requireUser();
  const notificationId = requiredString(formData, "notificationId");
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { readAt: new Date() },
  });
  revalidatePath("/dashboard");
}

export async function goDashboard() {
  redirect("/dashboard");
}
