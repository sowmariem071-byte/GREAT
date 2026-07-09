import { Role, UserStatus, VideoStatus } from "@prisma/client";
import { updateEditorTaskAction } from "@/app/actions";
import { AppShell } from "@/components/AppShell";
import { Modal } from "@/components/Modal";
import { StatusPill } from "@/components/StatusPill";
import { VideoTaskDetailDialog } from "@/components/VideoTaskDetailDialog";
import { requireRole } from "@/lib/auth";
import { endOfShanghaiDay, formatDate, startOfShanghaiDay } from "@/lib/dates";
import { scriptCategoryLabel, videoStatusLabel, videoTypeLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const activeStatuses = [
  VideoStatus.PENDING_EDIT,
  VideoStatus.IN_PROGRESS,
  VideoStatus.NEEDS_REVISION,
  VideoStatus.PENDING_REVIEW,
];

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

const actionableStatuses = new Set<VideoStatus>([
  VideoStatus.PENDING_EDIT,
  VideoStatus.IN_PROGRESS,
  VideoStatus.NEEDS_REVISION,
]);

const editableStatusSet = new Set<VideoStatus>(activeStatuses);

type EditingPageProps = {
  searchParams?: Promise<{ queue?: string; status?: string }>;
};

function parseEditingStatus(value?: string) {
  return value && editableStatusSet.has(value as VideoStatus) ? (value as VideoStatus) : null;
}

function parseEditingQueue(value?: string) {
  return value === "flow" ? value : null;
}

function durationLabel(seconds?: number | null) {
  return seconds ? `${seconds}s` : "未填";
}

function deliverySignal(date: Date) {
  const today = startOfShanghaiDay();
  if (date < today) return "逾期";
  if (formatDate(date) === formatDate(today)) return "今日";
  return formatDate(date);
}

function actionLabel(status: VideoStatus) {
  if (status === VideoStatus.PENDING_EDIT) return "开始剪辑";
  if (status === VideoStatus.NEEDS_REVISION) return "提交修改";
  return "提交审核";
}

export default async function EditingPage({ searchParams }: EditingPageProps) {
  const params = await searchParams;
  const selectedStatus = parseEditingStatus(params?.status);
  const selectedQueue = selectedStatus ? null : parseEditingQueue(params?.queue);
  const user = await requireRole([Role.ADMIN, Role.EDITOR]);
  const start = startOfShanghaiDay();
  const end = endOfShanghaiDay();
  const where = user.role === Role.ADMIN ? {} : { editorId: user.id };

  const [tasks, todayDone, targetSource] = await Promise.all([
    prisma.videoTask.findMany({
      where: { ...where, status: { in: activeStatuses } },
      orderBy: [{ plannedDeliveryAt: "asc" }, { createdAt: "asc" }],
      include: { script: true, director: true, editor: true, reviews: { orderBy: { roundNumber: "desc" }, take: 1 } },
    }),
    prisma.videoTask.count({ where: { ...where, deliveredAt: { gte: start, lt: end } } }),
    user.role === Role.ADMIN
      ? prisma.user.findMany({
          where: { role: Role.EDITOR, status: UserStatus.ACTIVE },
          include: { dailyTargets: { orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }], take: 1 } },
        })
      : prisma.dailyTarget.findFirst({
          where: { userId: user.id },
          orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
        }),
  ]);

  const target =
    user.role === Role.ADMIN
      ? Array.isArray(targetSource)
        ? targetSource.reduce((sum, editor) => sum + (editor.dailyTargets[0]?.editingVideos || 6), 0)
        : 6
      : !Array.isArray(targetSource)
        ? targetSource?.editingVideos || 6
        : 6;

  const statusCount = (status: VideoStatus) => tasks.filter((task) => task.status === status).length;
  const flowCount = statusCount(VideoStatus.PENDING_EDIT) + statusCount(VideoStatus.IN_PROGRESS);
  const visibleTasks = selectedStatus
    ? tasks.filter((task) => task.status === selectedStatus)
    : selectedQueue === "flow"
      ? tasks.filter((task) => task.status === VideoStatus.PENDING_EDIT || task.status === VideoStatus.IN_PROGRESS)
      : tasks;
  const completionRate = target ? Math.min(100, Math.round((todayDone / target) * 100)) : 0;
  const pendingReviewCount = statusCount(VideoStatus.PENDING_REVIEW);

  const statusTabs = [
    { label: "全部", href: "/editing", count: tasks.length, active: !selectedStatus && !selectedQueue },
    { label: "流转", href: "/editing?queue=flow", count: flowCount, active: selectedQueue === "flow" },
    { label: "待剪辑", href: `/editing?status=${VideoStatus.PENDING_EDIT}`, count: statusCount(VideoStatus.PENDING_EDIT), active: selectedStatus === VideoStatus.PENDING_EDIT },
    { label: "剪辑中", href: `/editing?status=${VideoStatus.IN_PROGRESS}`, count: statusCount(VideoStatus.IN_PROGRESS), active: selectedStatus === VideoStatus.IN_PROGRESS },
    { label: "需修改", href: `/editing?status=${VideoStatus.NEEDS_REVISION}`, count: statusCount(VideoStatus.NEEDS_REVISION), active: selectedStatus === VideoStatus.NEEDS_REVISION },
    { label: "待审核", href: `/editing?status=${VideoStatus.PENDING_REVIEW}`, count: pendingReviewCount, active: selectedStatus === VideoStatus.PENDING_REVIEW },
  ];

  return (
    <AppShell user={user} active="editing" title="剪辑工作台" subtitle="今日剪辑目标、任务流转与待处理队列一屏掌握">
      <section className="editor-workspace">
        <header className="editor-hero">
          <div className="editor-title-block">
            <span>EDITOR WORK SIGNAL</span>
            <h1>剪辑工作台</h1>
            <p>把待剪辑、剪辑中、需修改和待审核任务压成一条清楚的工作线，进入页面就聚焦当前该处理的剪辑队列。</p>
          </div>

          <aside className="editor-completion-card">
            <span>今日完成率</span>
            <strong>{completionRate}%</strong>
            <p>{todayDone} / {target} 已交付</p>
            <div className="editor-progress-track" aria-hidden="true">
              <i style={{ width: `${completionRate}%` }} />
            </div>
          </aside>
        </header>

        <section className="editor-signal-grid" aria-label="剪辑任务信号">
          <a className="editor-signal-card" href={`/editing?status=${VideoStatus.PENDING_EDIT}`} data-active={selectedStatus === VideoStatus.PENDING_EDIT}>
            <span>待</span>
            <div>
              <small>待剪辑</small>
              <strong>{statusCount(VideoStatus.PENDING_EDIT)}</strong>
              <p>新下发，还未进入剪辑</p>
            </div>
          </a>
          <a className="editor-signal-card" href={`/editing?status=${VideoStatus.IN_PROGRESS}`} data-active={selectedStatus === VideoStatus.IN_PROGRESS}>
            <span>剪</span>
            <div>
              <small>剪辑中</small>
              <strong>{statusCount(VideoStatus.IN_PROGRESS)}</strong>
              <p>正在处理的视频任务</p>
            </div>
          </a>
          <a className="editor-signal-card" href={`/editing?status=${VideoStatus.NEEDS_REVISION}`} data-active={selectedStatus === VideoStatus.NEEDS_REVISION}>
            <span>改</span>
            <div>
              <small>需修改</small>
              <strong>{statusCount(VideoStatus.NEEDS_REVISION)}</strong>
              <p>编导退回的反馈</p>
            </div>
          </a>
          <a className="editor-signal-card" href={`/editing?status=${VideoStatus.PENDING_REVIEW}`} data-active={selectedStatus === VideoStatus.PENDING_REVIEW}>
            <span>审</span>
            <div>
              <small>待审核</small>
              <strong>{pendingReviewCount}</strong>
              <p>已提交，等待编导确认</p>
            </div>
          </a>
        </section>

        <section className="editor-board-grid">
          <main className="editor-main-panel">
            <div className="editor-task-head">
              <div>
                <span>Task Queue</span>
                <h2>{selectedStatus ? `${videoStatusLabel[selectedStatus]}任务` : selectedQueue === "flow" ? "剪辑流转任务" : "我的剪辑队列"}</h2>
              </div>
              <nav className="editor-status-tabs" aria-label="剪辑任务状态筛选">
                {statusTabs.map((tab) => (
                  <a href={tab.href} key={tab.label} data-active={tab.active}>
                    {tab.label} <b>{tab.count}</b>
                  </a>
                ))}
              </nav>
            </div>

            <div className="editor-task-list">
              {visibleTasks.length ? visibleTasks.map((task) => {
                const latestComment = task.reviews[0]?.comment;
                const canUpdate = actionableStatuses.has(task.status);
                const defaultNextStatus = task.status === VideoStatus.PENDING_EDIT ? VideoStatus.IN_PROGRESS : VideoStatus.PENDING_REVIEW;

                return (
                  <VideoTaskDetailDialog
                    allowReviewAction={false}
                    cardClassName="video-task-card editor-task-card"
                    key={task.id}
                    statusLabel={videoStatusLabel[task.status]}
                    task={{
                      id: task.id,
                      title: task.script.title,
                      scriptBody: task.script.body,
                      scriptCategoryLabel: scriptCategoryLabel[task.script.category],
                      scriptCreatedAt: formatDate(task.script.createdAt),
                      status: task.status,
                      tone: statusTone[task.status],
                      notes: task.notes || "暂无特殊备注，按脚本和素材要求正常推进。",
                      materialUrl: task.materialUrl,
                      videoUrl: task.videoUrl,
                      directorName: task.director.name,
                      editorName: task.editor.name,
                      duration: durationLabel(task.durationSeconds),
                      createdAt: formatDate(task.createdAt),
                      plannedDeliveryAt: formatDate(task.plannedDeliveryAt),
                      plannedPublishDate: formatDate(task.plannedPublishDate),
                      publishTime: task.publishTime || "",
                      deliveredAt: formatDate(task.deliveredAt),
                      approvedAt: formatDate(task.approvedAt),
                      publishedAt: formatDate(task.publishedAt),
                    }}
                    typeLabel={videoTypeLabel[task.type]}
                  >
                    <header>
                      <div>
                        <span>{videoTypeLabel[task.type]}</span>
                        <h3>{task.script.title}</h3>
                        <p>{task.notes || "暂无特殊备注，按脚本和素材要求正常推进。"}</p>
                      </div>
                      <StatusPill status={task.status} />
                    </header>

                    <div className="editor-task-meta">
                      <div><span>编导</span><strong>{task.director.name}</strong></div>
                      <div><span>剪辑</span><strong>{task.editor.name}</strong></div>
                      <div><span>交付</span><strong>{deliverySignal(task.plannedDeliveryAt)}</strong></div>
                      <div><span>秒数</span><strong>{durationLabel(task.durationSeconds)}</strong></div>
                    </div>

                    {latestComment ? (
                      <div className="editor-review-note">
                        <span>最新修改建议</span>
                        <p>{latestComment}</p>
                      </div>
                    ) : null}

                    <footer>
                      <a href={task.materialUrl} rel="noreferrer" target="_blank">打开素材</a>
                      {task.videoUrl ? <a href={task.videoUrl} rel="noreferrer" target="_blank">查看成片</a> : null}
                      {canUpdate ? (
                        <Modal
                          trigger={actionLabel(task.status)}
                          title={task.script.title}
                          subtitle="更新剪辑状态；提交待审核时请填写视频链接和秒数。"
                        >
                          <form action={updateEditorTaskAction} className="glass-form">
                            <input type="hidden" name="videoTaskId" value={task.id} />
                            <label className="field">
                              <span>状态</span>
                              <select name="status" defaultValue={defaultNextStatus}>
                                <option value={VideoStatus.IN_PROGRESS}>剪辑中</option>
                                <option value={VideoStatus.PENDING_REVIEW}>提交待审核</option>
                              </select>
                            </label>
                            <label className="field">
                              <span>视频链接</span>
                              <input name="videoUrl" defaultValue={task.videoUrl || ""} placeholder="提交待审核时必填" />
                            </label>
                            <label className="field">
                              <span>视频秒数</span>
                              <input name="durationSeconds" type="number" min="1" defaultValue={task.durationSeconds || ""} />
                            </label>
                            <button className="primary-action" type="submit">更新任务</button>
                          </form>
                        </Modal>
                      ) : (
                        <span className="editor-waiting-pill">等待编导审核</span>
                      )}
                    </footer>
                  </VideoTaskDetailDialog>
                );
              }) : (
                <div className="editor-empty-state">
                  <strong>当前没有剪辑任务</strong>
                  <p>这个状态下暂时没有需要处理的视频，先保持节奏，新的任务会出现在这里。</p>
                </div>
              )}
            </div>
          </main>
        </section>
      </section>
    </AppShell>
  );
}
