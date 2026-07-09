import type { VideoStatus } from "@prisma/client";
import { statusClass, videoStatusLabel } from "@/lib/labels";

export function StatusPill({ status }: { status: VideoStatus }) {
  return <span className={`status-pill ${statusClass(status)}`}>{videoStatusLabel[status]}</span>;
}
