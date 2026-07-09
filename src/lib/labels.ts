import { Role, ScriptCategory, VideoStatus, VideoType } from "@prisma/client";

export const roleLabel: Record<Role, string> = {
  ADMIN: "管理员",
  DIRECTOR: "编导",
  EDITOR: "剪辑",
};

export const scriptCategoryLabel: Record<ScriptCategory, string> = {
  TRADITIONAL: "传统",
  ASSIST: "协助",
  FEMALE: "女性",
};

export const videoTypeLabel: Record<VideoType, string> = {
  CHINESE_PARENTING: "中式育儿",
  FEMALE: "女性",
};

export const videoStatusLabel: Record<VideoStatus, string> = {
  PENDING_EDIT: "待剪辑",
  IN_PROGRESS: "剪辑中",
  PENDING_REVIEW: "待审核",
  NEEDS_REVISION: "需修改",
  APPROVED: "审核通过",
  READY_TO_PUBLISH: "可发布",
  SCHEDULED: "已排期",
  PUBLISHED: "已发布",
  STOCK: "屯片",
};

export function statusClass(status: VideoStatus) {
  if (status === "NEEDS_REVISION") return "warn";
  if (["APPROVED", "READY_TO_PUBLISH", "PUBLISHED"].includes(status)) return "done";
  return "pending";
}
