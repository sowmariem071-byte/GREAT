import { Role, UserStatus, VideoStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const unfinishedStatuses: VideoStatus[] = [
  VideoStatus.PENDING_EDIT,
  VideoStatus.IN_PROGRESS,
  VideoStatus.NEEDS_REVISION,
];

export async function pickEditorWithLightestQueue() {
  const editors = await prisma.user.findMany({
    where: { role: Role.EDITOR, status: UserStatus.ACTIVE },
    include: {
      _count: {
        select: {
          editingVideos: {
            where: { status: { in: unfinishedStatuses } },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (editors.length === 0) {
    throw new Error("当前没有可分配的剪辑同学。");
  }

  return editors.sort((a, b) => {
    const diff = a._count.editingVideos - b._count.editingVideos;
    return diff === 0 ? a.createdAt.getTime() - b.createdAt.getTime() : diff;
  })[0];
}
