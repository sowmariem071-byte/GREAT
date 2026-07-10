import { Role, ScheduleStatus, VideoStatus } from "@prisma/client";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { videoStatusLabel, videoTypeLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const inventoryStatusSet = new Set<VideoStatus>([
  VideoStatus.READY_TO_PUBLISH,
  VideoStatus.SCHEDULED,
  VideoStatus.STOCK,
]);

type InventoryPageProps = {
  searchParams?: Promise<{ status?: string }>;
};

type InventoryVideo = Awaited<ReturnType<typeof getInventoryVideos>>["stock"][number];

function parseInventoryStatus(value?: string) {
  return value && inventoryStatusSet.has(value as VideoStatus) ? (value as VideoStatus) : null;
}

async function getInventoryVideos(user: Awaited<ReturnType<typeof requireRole>>) {
  const where = user.role === Role.ADMIN ? {} : { directorId: user.id };

  const [stock, ready, publishedSchedules] = await Promise.all([
    prisma.videoTask.findMany({
      where: { ...where, status: VideoStatus.STOCK },
      orderBy: { approvedAt: "desc" },
      include: { script: true, editor: true, director: true },
      take: 60,
    }),
    prisma.videoTask.findMany({
      where: { ...where, status: { in: [VideoStatus.READY_TO_PUBLISH, VideoStatus.SCHEDULED] } },
      orderBy: [{ plannedPublishDate: "asc" }, { updatedAt: "desc" }],
      include: { script: true, editor: true, director: true },
      take: 60,
    }),
    prisma.publishSchedule.findMany({
      where:
        user.role === Role.ADMIN
          ? { status: ScheduleStatus.PUBLISHED }
          : { status: ScheduleStatus.PUBLISHED, videoTask: { directorId: user.id } },
      orderBy: { publishedAt: "desc" },
      include: { videoTask: { include: { script: true, editor: true, director: true } } },
      take: 60,
    }),
  ]);

  return { stock, ready, publishedSchedules };
}

function InventoryVideoCard({ video, variant }: { video: InventoryVideo; variant: "ready" | "stock" }) {
  const plannedText = video.plannedPublishDate
    ? `${formatDate(video.plannedPublishDate)} ${video.publishTime || "未定时间"}`
    : "暂无计划发布日期";
  const actionText = variant === "stock" ? "去安排" : video.status === VideoStatus.SCHEDULED ? "看排期" : "去排期";

  return (
    <article className="inventory-video-card">
      <div className="inventory-card-topline">
        <span>{videoTypeLabel[video.type]}</span>
        <StatusPill status={video.status} />
      </div>
      <h3>{video.script.title}</h3>
      <p>{variant === "stock" ? "审核通过后暂存屯片池，补充发布日期后即可进入排期。" : "已进入发布准备区，可继续确认具体发布节奏。"}</p>
      <div className="inventory-card-meta">
        <div>
          <span>编导</span>
          <strong>{video.director.name}</strong>
        </div>
        <div>
          <span>剪辑</span>
          <strong>{video.editor.name}</strong>
        </div>
        <div>
          <span>秒数</span>
          <strong>{video.durationSeconds ? `${video.durationSeconds}s` : "未填"}</strong>
        </div>
      </div>
      <div className="inventory-card-footer">
        <span>{plannedText}</span>
        <Link href="/schedule" prefetch={false}>{actionText}</Link>
      </div>
    </article>
  );
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const params = await searchParams;
  const selectedStatus = parseInventoryStatus(params?.status);
  const user = await requireRole([Role.ADMIN, Role.DIRECTOR]);
  const { stock, ready, publishedSchedules } = await getInventoryVideos(user);
  const scheduled = ready.filter((video) => video.status === VideoStatus.SCHEDULED);
  const readyToPublish = ready.filter((video) => video.status === VideoStatus.READY_TO_PUBLISH);
  const showStock = !selectedStatus || selectedStatus === VideoStatus.STOCK;
  const showReady =
    !selectedStatus ||
    selectedStatus === VideoStatus.READY_TO_PUBLISH ||
    selectedStatus === VideoStatus.SCHEDULED;
  const visibleReady =
    selectedStatus === VideoStatus.READY_TO_PUBLISH
      ? readyToPublish
      : selectedStatus === VideoStatus.SCHEDULED
        ? scheduled
        : ready;

  return (
    <AppShell user={user} active="inventory" title="库存池" subtitle="可发布、屯片与排期入口一屏掌握。">
      <section className="inventory-workspace">
        <header className="inventory-hero">
          <div>
            <span className="inventory-kicker">INVENTORY SIGNAL</span>
            <h1>库存池</h1>
            <p>把已审核内容分成可发布和待安排屯片，清楚知道手里还有多少内容可以调度。</p>
          </div>
          <Link className="inventory-hero-card inventory-schedule-link" href="/schedule" prefetch={false}>
            <span>Schedule Signal</span>
            <strong>去排期日历</strong>
            <p>查看未来发布安排</p>
          </Link>
        </header>

        <section className="inventory-signal-grid" aria-label="库存概览">
          <Link
            className={`inventory-signal-card ${selectedStatus === VideoStatus.READY_TO_PUBLISH ? "active" : ""}`}
            href="/inventory?status=READY_TO_PUBLISH"
            prefetch={false}
          >
            <span>可发布</span>
            <strong>{readyToPublish.length}</strong>
            <p>{videoStatusLabel.READY_TO_PUBLISH}内容</p>
          </Link>
          <Link
            className={`inventory-signal-card ${selectedStatus === VideoStatus.STOCK ? "active" : ""}`}
            href="/inventory?status=STOCK#stock"
            prefetch={false}
          >
            <span>屯片池</span>
            <strong>{stock.length}</strong>
            <p>暂无计划发布日期</p>
          </Link>
          <Link
            className={`inventory-signal-card ${selectedStatus === VideoStatus.SCHEDULED ? "active" : ""}`}
            href="/inventory?status=SCHEDULED"
            prefetch={false}
          >
            <span>待发布</span>
            <strong>{scheduled.length}</strong>
            <p>已进入排期</p>
          </Link>
          <Link className="inventory-signal-card" href="/schedule#published" prefetch={false}>
            <span>已发布</span>
            <strong>{publishedSchedules.length}</strong>
            <p>最近 60 条归档</p>
          </Link>
        </section>

        <section className="inventory-main-grid">
          {showReady ? (
            <article className="inventory-column-panel" id="ready">
              <div className="inventory-panel-head">
                <div>
                  <span>Ready Pool</span>
                  <h2>{selectedStatus === VideoStatus.SCHEDULED ? "待发布" : "可发布池"}</h2>
                  <p>有计划发布日期的内容优先进入排期，没有定具体时间的先留在可发布池。</p>
                </div>
                <b>{visibleReady.length} 条</b>
              </div>
              <div className="inventory-card-list">
                {visibleReady.length ? (
                  visibleReady.map((video) => <InventoryVideoCard video={video} variant="ready" key={video.id} />)
                ) : (
                  <div className="inventory-empty-card">暂无可发布内容。审核通过后有计划发布日期的视频会出现在这里。</div>
                )}
              </div>
            </article>
          ) : null}

          {showStock ? (
            <article className="inventory-column-panel" id="stock">
              <div className="inventory-panel-head">
                <div>
                  <span>Stock Pool</span>
                  <h2>屯片池</h2>
                  <p>审核通过但还没有计划发布日期的内容，先沉淀在这里等待补排期。</p>
                </div>
                <b>{stock.length} 条</b>
              </div>
              <div className="inventory-card-list">
                {stock.length ? (
                  stock.map((video) => <InventoryVideoCard video={video} variant="stock" key={video.id} />)
                ) : (
                  <div className="inventory-empty-card">暂无屯片。没有计划发布日期的视频审核通过后会自动进入这里。</div>
                )}
              </div>
            </article>
          ) : null}
        </section>
      </section>
    </AppShell>
  );
}
