import { Role, ScriptCategory, VideoStatus } from "@prisma/client";
import { createScriptAndVideoTaskAction, createVideoTaskAction } from "@/app/actions";
import { AppShell } from "@/components/AppShell";
import { Modal } from "@/components/Modal";
import { StatusPill } from "@/components/StatusPill";
import { VideoTaskDetailDialog } from "@/components/VideoTaskDetailDialog";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { scriptCategoryLabel, videoStatusLabel, videoTypeLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const readyStatuses: VideoStatus[] = [VideoStatus.READY_TO_PUBLISH, VideoStatus.SCHEDULED];
const statusTone: Record<VideoStatus, string> = {
  PENDING_EDIT: "queued",
  IN_PROGRESS: "active",
  PENDING_REVIEW: "review",
  NEEDS_REVISION: "warning",
  APPROVED: "done",
  READY_TO_PUBLISH: "done",
  SCHEDULED: "planned",
  PUBLISHED: "published",
  STOCK: "stock",
};

const videoStatusSet = new Set<VideoStatus>(Object.values(VideoStatus));
const queueFilterConfig = {
  editing: {
    eyebrow: "Editing Queue",
    hint: "待剪辑和剪辑中的任务，会展示剪辑人、交付日期和完整视频详情。",
    statuses: [VideoStatus.PENDING_EDIT, VideoStatus.IN_PROGRESS],
    title: "剪辑流转任务",
  },
  review: {
    eyebrow: "Review Queue",
    hint: "待审核和需修改的视频，会展示全部详情，并支持在详情里填写审核建议。",
    statuses: [VideoStatus.PENDING_REVIEW, VideoStatus.NEEDS_REVISION],
    title: "审核队列任务",
  },
} as const;

type VideosPageProps = {
  searchParams?: Promise<{ queue?: string; status?: string }>;
};

type QueueFilter = keyof typeof queueFilterConfig;

function parseVideoStatus(value?: string) {
  return value && videoStatusSet.has(value as VideoStatus) ? (value as VideoStatus) : null;
}

function parseQueueFilter(value?: string) {
  return value === "editing" || value === "review" ? (value as QueueFilter) : null;
}

function scriptExcerpt(body: string) {
  if (body.length <= 54) return body;
  return `${body.slice(0, 54)}...`;
}

function reviewResultLabel(status: VideoStatus) {
  switch (status) {
    case VideoStatus.NEEDS_REVISION:
      return "需修改";
    case VideoStatus.APPROVED:
    case VideoStatus.READY_TO_PUBLISH:
    case VideoStatus.SCHEDULED:
    case VideoStatus.PUBLISHED:
    case VideoStatus.STOCK:
      return "已通过";
    case VideoStatus.PENDING_REVIEW:
      return "待审核";
    default:
      return "未提交";
  }
}

function publishReadyLabel(status: VideoStatus) {
  if (status === VideoStatus.PUBLISHED) return "已发布";
  if (status === VideoStatus.SCHEDULED) return "已排期";
  if (status === VideoStatus.READY_TO_PUBLISH) return "可发布";
  if (status === VideoStatus.STOCK) return "屯片";
  return "否";
}

export default async function VideosPage({ searchParams }: VideosPageProps) {
  const params = await searchParams;
  const selectedStatus = parseVideoStatus(params?.status);
  const selectedQueue = selectedStatus ? null : parseQueueFilter(params?.queue);
  const selectedQueueConfig = selectedQueue ? queueFilterConfig[selectedQueue] : null;
  const user = await requireRole([Role.ADMIN, Role.DIRECTOR]);
  const videoWhere = user.role === Role.ADMIN ? {} : { directorId: user.id };
  const scriptWhere = user.role === Role.ADMIN ? {} : { authorId: user.id };

  const [videos, scripts, directors] = await Promise.all([
    prisma.videoTask.findMany({
      where: videoWhere,
      orderBy: { createdAt: "desc" },
      take: 80,
      include: { script: true, director: true, editor: true },
    }),
    prisma.script.findMany({ where: scriptWhere, orderBy: { createdAt: "desc" }, take: 80, include: { author: true } }),
    prisma.user.findMany({ where: { role: Role.DIRECTOR, status: "ACTIVE" }, orderBy: { createdAt: "asc" } }),
  ]);

  const pendingEdit = videos.filter((video) => video.status === VideoStatus.PENDING_EDIT).length;
  const inProgress = videos.filter((video) => video.status === VideoStatus.IN_PROGRESS).length;
  const pendingReview = videos.filter((video) => video.status === VideoStatus.PENDING_REVIEW).length;
  const needsRevision = videos.filter((video) => video.status === VideoStatus.NEEDS_REVISION).length;
  const ready = videos.filter((video) => readyStatuses.includes(video.status)).length;
  const stock = videos.filter((video) => video.status === VideoStatus.STOCK).length;
  const statusGroups = [
    {
      count: pendingEdit,
      href: user.role === Role.ADMIN ? "/editing?status=PENDING_EDIT" : "/videos?status=PENDING_EDIT",
      label: "待剪辑",
      status: VideoStatus.PENDING_EDIT,
    },
    {
      count: inProgress,
      href: user.role === Role.ADMIN ? "/editing?status=IN_PROGRESS" : "/videos?status=IN_PROGRESS",
      label: "剪辑中",
      status: VideoStatus.IN_PROGRESS,
    },
    {
      count: pendingReview,
      href: "/review?status=PENDING_REVIEW",
      label: "待审核",
      status: VideoStatus.PENDING_REVIEW,
    },
    {
      count: needsRevision,
      href: user.role === Role.ADMIN ? "/editing?status=NEEDS_REVISION" : "/videos?status=NEEDS_REVISION",
      label: "需修改",
      status: VideoStatus.NEEDS_REVISION,
    },
    {
      count: ready,
      href: "/inventory?status=READY_TO_PUBLISH#ready",
      label: "可发布",
      status: VideoStatus.READY_TO_PUBLISH,
    },
    {
      count: stock,
      href: "/inventory?status=STOCK#stock",
      label: "屯片",
      status: VideoStatus.STOCK,
    },
  ];
  const visibleVideos = selectedStatus
    ? videos.filter((video) => (selectedStatus === VideoStatus.READY_TO_PUBLISH ? readyStatuses.includes(video.status) : video.status === selectedStatus))
    : selectedQueueConfig
      ? videos.filter((video) => (selectedQueueConfig.statuses as readonly VideoStatus[]).includes(video.status))
      : videos;
  const boardEyebrow = selectedStatus ? "Filtered Queue" : selectedQueueConfig?.eyebrow || "Task Queue";
  const boardTitle = selectedStatus ? `${videoStatusLabel[selectedStatus]}任务` : selectedQueueConfig?.title || "视频任务流";
  const boardHint = selectedStatus
    ? "当前仅展示所选状态的视频任务，点击卡片可以查看完整详情。"
    : selectedQueueConfig?.hint;
  const emptyTitle = selectedStatus
    ? `没有${videoStatusLabel[selectedStatus]}任务`
    : selectedQueueConfig
      ? `没有${selectedQueueConfig.title}`
      : "还没有视频任务";
  const emptyHint = selectedStatus || selectedQueueConfig
    ? "可以切换其他状态查看，或继续下发新的剪辑任务。"
    : "从脚本库选择脚本下达任务，或者直接创作新脚本并下发给剪辑。";

  return (
    <AppShell user={user} active="videos" title="视频总览" subtitle="下发剪辑任务、查看状态、追踪交付和发布计划。">
      <section className="video-workspace">
        <header className="video-workspace-header">
          <div>
            <span className="video-kicker">Video Flow</span>
            <h1>视频任务池</h1>
            <p>从脚本下发到剪辑交付、审核确认和发布排期，一屏看清每条视频现在卡在哪一步。</p>
          </div>
          <div className="video-header-actions">
            <Modal trigger="下达任务" title="从脚本库下达任务" subtitle="选择已入库脚本，填写素材和交付日期。">
              <form action={createVideoTaskAction} className="glass-form">
                <fieldset className="script-picker">
                  <legend>选择脚本</legend>
                  <p>从脚本资产库里选择本次要下发给剪辑的脚本。</p>
                  {scripts.length ? (
                    <div className="script-picker-grid">
                      {scripts.map((script, index) => (
                        <label className="script-picker-card" key={script.id}>
                          <input name="scriptId" required type="radio" value={script.id} defaultChecked={index === 0} />
                          <span className="script-picker-check" aria-hidden="true" />
                          <span className="script-picker-top">
                            <b data-tone={script.category.toLowerCase()}>{scriptCategoryLabel[script.category]}</b>
                            <small>{script.author.name} · {formatDate(script.createdAt)}</small>
                          </span>
                          <strong>{script.title}</strong>
                          <em>{scriptExcerpt(script.body)}</em>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="script-picker-empty">
                      <strong>脚本库暂无可选脚本</strong>
                      <p>可以关闭此弹窗，使用“创作并下发”直接创建新脚本。</p>
                    </div>
                  )}
                </fieldset>
                <label className="field">
                  <span>素材链接</span>
                  <input name="materialUrl" required placeholder="https://..." />
                </label>
                <div className="split-two">
                  <label className="field">
                    <span>计划交付</span>
                    <input name="plannedDeliveryAt" type="date" required />
                  </label>
                  <label className="field">
                    <span>计划发布</span>
                    <input name="plannedPublishDate" type="date" />
                  </label>
                </div>
                <label className="field">
                  <span>发布时间</span>
                  <input name="publishTime" type="time" defaultValue="19:30" />
                </label>
                <label className="field">
                  <span>备注</span>
                  <textarea name="notes" placeholder="交代画面、节奏、封面等要求。" />
                </label>
                <button className="primary-action" type="submit" disabled={!scripts.length}>下发剪辑任务</button>
              </form>
            </Modal>

            <Modal trigger="创作并下发" title="创作新脚本并下发" subtitle="当脚本库没有对应脚本时，直接创建脚本并生成视频任务。" tone="ghost">
              <form action={createScriptAndVideoTaskAction} className="glass-form">
                {user.role === Role.ADMIN ? (
                  <label className="field">
                    <span>作者</span>
                    <select name="authorId" defaultValue={directors[0]?.id}>
                      {directors.map((director) => (
                        <option value={director.id} key={director.id}>{director.name}</option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <label className="field">
                  <span>新脚本标题</span>
                  <input name="newTitle" required />
                </label>
                <label className="field">
                  <span>类别</span>
                  <select name="newCategory" defaultValue={ScriptCategory.TRADITIONAL}>
                    <option value={ScriptCategory.TRADITIONAL}>传统</option>
                    <option value={ScriptCategory.ASSIST}>协助</option>
                    <option value={ScriptCategory.FEMALE}>女性</option>
                  </select>
                </label>
                <label className="field">
                  <span>正文</span>
                  <textarea name="newBody" required />
                </label>
                <label className="field">
                  <span>素材链接</span>
                  <input name="materialUrl" required />
                </label>
                <div className="split-two">
                  <label className="field">
                    <span>计划交付</span>
                    <input name="plannedDeliveryAt" type="date" required />
                  </label>
                  <label className="field">
                    <span>计划发布</span>
                    <input name="plannedPublishDate" type="date" />
                  </label>
                </div>
                <label className="field">
                  <span>发布时间</span>
                  <input name="publishTime" type="time" defaultValue="19:30" />
                </label>
                <button className="primary-action" type="submit">保存脚本并下发</button>
              </form>
            </Modal>
          </div>
        </header>

        <section className="video-signal-grid">
          <a
            aria-label="查看全部视频任务流"
            className="video-signal-card video-signal-primary"
            data-active={!selectedStatus && !selectedQueue ? "true" : "false"}
            href="/videos#task-board"
          >
            <span>任务总数</span>
            <strong>{videos.length}</strong>
            <p>最近 80 条可见任务</p>
          </a>
          <a
            aria-label="查看剪辑流转任务"
            className="video-signal-card"
            data-active={selectedQueue === "editing" ? "true" : "false"}
            href="/videos?queue=editing#task-board"
          >
            <span>剪辑流转</span>
            <strong>{pendingEdit + inProgress}</strong>
            <p>待剪辑 {pendingEdit} · 剪辑中 {inProgress}</p>
          </a>
          <a
            aria-label="查看审核队列任务"
            className="video-signal-card"
            data-active={selectedQueue === "review" ? "true" : "false"}
            href="/videos?queue=review#task-board"
          >
            <span>审核队列</span>
            <strong>{pendingReview + needsRevision}</strong>
            <p>待审核 {pendingReview} · 需修改 {needsRevision}</p>
          </a>
          <article className="video-signal-card">
            <span>发布准备</span>
            <strong>{ready + stock}</strong>
            <p>可发布 {ready} · 屯片 {stock}</p>
          </article>
        </section>

        <section className="video-flow-grid">
          <section className="video-task-board" id="task-board">
            <div className="video-board-head">
              <div>
                <span>{boardEyebrow}</span>
                <h2>{boardTitle}</h2>
                {boardHint ? <p className="video-board-filter-note">{boardHint}</p> : null}
              </div>
              <div className="video-status-chips">
                {statusGroups.map((item) => (
                  <a
                    aria-label={`查看${item.label}任务`}
                    data-active={
                      selectedStatus === item.status ||
                      (!selectedStatus && selectedQueueConfig && (selectedQueueConfig.statuses as readonly VideoStatus[]).includes(item.status))
                        ? "true"
                        : "false"
                    }
                    href={item.href}
                    key={item.label}
                  >
                    {item.label} <b>{item.count}</b>
                  </a>
                ))}
              </div>
            </div>

            {visibleVideos.length ? (
              <div className="video-task-list" role="list">
                <div className="video-task-list-head" aria-hidden="true">
                  <span>创建日期</span>
                  <span>标题</span>
                  <span>类型</span>
                  <span>剪辑人</span>
                  <span>秒数</span>
                  <span>状态</span>
                  <span>计划交付</span>
                  <span>审核结果</span>
                  <span>可发布</span>
                </div>

                {visibleVideos.map((video) => {
                  const duration = video.durationSeconds ? `${video.durationSeconds}s` : "未填";
                  const reviewResult = reviewResultLabel(video.status);
                  const publishReady = publishReadyLabel(video.status);

                  return (
                    <VideoTaskDetailDialog
                      cardClassName="video-task-row"
                      key={video.id}
                      statusLabel={videoStatusLabel[video.status]}
                      task={{
                        id: video.id,
                        title: video.script.title,
                        scriptBody: video.script.body,
                        scriptCategoryLabel: scriptCategoryLabel[video.script.category],
                        scriptCreatedAt: formatDate(video.script.createdAt),
                        status: video.status,
                        tone: statusTone[video.status],
                        notes: video.notes || "暂无特殊备注，按素材与脚本要求正常推进。",
                        materialUrl: video.materialUrl,
                        videoUrl: video.videoUrl,
                        directorName: video.director.name,
                        editorName: video.editor.name,
                        duration,
                        createdAt: formatDate(video.createdAt),
                        plannedDeliveryAt: formatDate(video.plannedDeliveryAt),
                        plannedPublishDate: formatDate(video.plannedPublishDate),
                        publishTime: video.publishTime || "",
                        deliveredAt: formatDate(video.deliveredAt),
                        approvedAt: formatDate(video.approvedAt),
                        publishedAt: formatDate(video.publishedAt),
                      }}
                      triggerAsButton
                      typeLabel={videoTypeLabel[video.type]}
                    >
                      <span>{formatDate(video.createdAt)}</span>
                      <strong className="video-task-row-title">{video.script.title}</strong>
                      <span>{videoTypeLabel[video.type]}</span>
                      <span>{video.editor.name}</span>
                      <span>{duration}</span>
                      <span className="video-task-row-status"><StatusPill status={video.status} /></span>
                      <span>{formatDate(video.plannedDeliveryAt)}</span>
                      <span className="video-task-row-result" data-result={reviewResult}>{reviewResult}</span>
                      <span className="video-task-row-publish" data-publish={publishReady}>{publishReady}</span>
                    </VideoTaskDetailDialog>
                  );
                })}
              </div>
            ) : (
              <div className="video-empty-state">
                <strong>{emptyTitle}</strong>
                <p>{emptyHint}</p>
              </div>
            )}
          </section>
        </section>
      </section>
    </AppShell>
  );
}
