import { Role, VideoStatus } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { formatDate, startOfShanghaiDay, endOfShanghaiDay } from "@/lib/dates";
import { roleLabel, videoStatusLabel, videoTypeLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { ensureDeadlineReminders } from "@/lib/reminders";

export const dynamic = "force-dynamic";

const completeStatuses = [
  VideoStatus.PENDING_REVIEW,
  VideoStatus.APPROVED,
  VideoStatus.READY_TO_PUBLISH,
  VideoStatus.SCHEDULED,
  VideoStatus.PUBLISHED,
  VideoStatus.STOCK,
];

type DirectorStat = {
  icon: string;
  label: string;
  value: string | number;
  description: string;
  detail?: string;
  href?: string;
};

type DirectorTargetItem = {
  icon: string;
  label: string;
  caption: string;
  done: number;
  target: number;
};

type DirectorReviewItem = {
  label: string;
  title: string;
  meta: string;
  status: string;
  actionLabel: string;
  href: string;
} | null;

type AdminMemberItem = {
  caption: string;
  done: number;
  href: string;
  id: string;
  name: string;
  role: Role;
  target: number;
};

async function latestTarget(userId: string) {
  return prisma.dailyTarget.findFirst({
    where: { userId },
    orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
  });
}

function roleSubtitle(role: Role) {
  if (role === Role.ADMIN) return "全员岗位进度、风险任务和今日产出。";
  if (role === Role.DIRECTOR) return "今日脚本、审核、可发布和屯片进度。";
  return "今日剪辑、修改、交付和时长结构进度。";
}

function percent(done: number, target: number) {
  if (target <= 0) return done > 0 ? 100 : 0;
  return Math.min(100, Math.round((done / target) * 100));
}

function sumTarget(target?: {
  chineseParentingScripts: number;
  femaleScripts: number;
  editingVideos: number;
} | null) {
  if (!target) return 0;
  return target.chineseParentingScripts + target.femaleScripts + target.editingVideos;
}

function progressText(done: number, target: number) {
  if (target <= 0) return `${done}`;
  return `${done}/${target}`;
}

function WorkbenchStatGrid({ stats }: { stats: DirectorStat[] }) {
  return (
    <div className="director-stat-grid">
      {stats.map((stat) => {
        const content = (
          <>
            <div className="director-stat-icon">{stat.icon}</div>
            <div>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <p>{stat.description}{stat.detail ? ` · ${stat.detail}` : ""}</p>
            </div>
          </>
        );

        return stat.href ? (
          <a aria-label={`查看${stat.label}`} className="director-stat-card director-stat-link-card" href={stat.href} key={stat.label}>
            {content}
          </a>
        ) : (
          <article className="director-stat-card" key={stat.label}>
            {content}
          </article>
        );
      })}
    </div>
  );
}

function AdminWorkbench({
  completion,
  completedText,
  durationBuckets,
  members,
  publishReady,
  riskItems,
  stats,
  stock,
}: {
  completion: number;
  completedText: string;
  durationBuckets: { long: number; mid: number; short: number };
  members: AdminMemberItem[];
  publishReady: number;
  riskItems: Array<{ href: string; label: string; meta: string; status: string; title: string }>;
  stats: DirectorStat[];
  stock: number;
}) {
  return (
    <section className="director-workbench admin-workbench">
      <header className="director-header">
        <div className="director-title-block">
          <span className="director-kicker">管理员 WORK SIGNAL</span>
          <h1>管理员工作台</h1>
          <p>全员完成情况、审核风险与发布库存一屏掌握</p>
        </div>

        <div className="director-completion-card" aria-label="全员完成率">
          <div className="director-completion-copy">
            <span>全员完成率</span>
            <strong>{completion}%</strong>
            <p>{completedText} 已完成</p>
          </div>
          <div
            className="director-completion-ring"
            aria-hidden="true"
            style={{ background: `conic-gradient(var(--theme-accent, var(--accent, #b85c45)) ${completion * 3.6}deg, rgba(32, 36, 42, 0.08) 0deg)` }}
          >
            <i></i>
          </div>
        </div>
      </header>

      <WorkbenchStatGrid stats={stats} />

      <div className="admin-main-grid">
        <article className="director-panel admin-team-panel">
          <div className="director-panel-head">
            <div>
              <h2>全员今日进度</h2>
            </div>
            <span>Team</span>
          </div>

          <div className="admin-member-grid">
            {members.map((member) => {
              const memberPercent = percent(member.done, member.target);
              return (
                <a className="admin-member-card" href={member.href} key={member.id}>
                  <div className="admin-member-avatar">{member.name.slice(0, 1)}</div>
                  <div>
                    <strong>{member.name}</strong>
                    <span>{roleLabel[member.role]} · {member.caption}</span>
                  </div>
                  <b>{progressText(member.done, member.target)}</b>
                  <i aria-hidden="true"><em style={{ width: `${memberPercent}%` }} /></i>
                </a>
              );
            })}
          </div>
        </article>

        <aside className="admin-side-stack">
          <article className="director-panel admin-risk-panel">
            <div className="director-panel-head">
              <div>
                <h2>风险与待处理</h2>
              </div>
              <span>Risk</span>
            </div>
            <div className="admin-risk-list">
              {riskItems.length ? riskItems.map((item) => (
                <a className="admin-risk-item" href={item.href} key={`${item.label}-${item.title}`}>
                  <div>
                    <span>{item.label}</span>
                    <b>{item.status}</b>
                  </div>
                  <strong>{item.title}</strong>
                  <p>{item.meta}</p>
                </a>
              )) : (
                <div className="admin-empty-card">
                  <strong>暂无风险任务</strong>
                  <p>当前没有逾期或待审核压力，团队节奏稳定。</p>
                </div>
              )}
            </div>
          </article>

          <article className="director-panel admin-publish-panel">
            <div className="director-panel-head">
              <div>
                <h2>发布与时长</h2>
              </div>
              <span>Stock</span>
            </div>
            <div className="admin-publish-grid">
              <a href="/inventory?status=READY_TO_PUBLISH">
                <span>可发布</span>
                <strong>{publishReady}</strong>
              </a>
              <a href="/inventory?status=STOCK">
                <span>屯片池</span>
                <strong>{stock}</strong>
              </a>
            </div>
            <div className="admin-duration-row">
              <div><span>70s 内</span><strong>{durationBuckets.short}</strong></div>
              <div><span>70s-130s</span><strong>{durationBuckets.mid}</strong></div>
              <div><span>130s+</span><strong>{durationBuckets.long}</strong></div>
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}

function DirectorWorkbench({
  completion,
  completedText,
  stats,
  targetItems,
  reviewItem,
}: {
  completion: number;
  completedText: string;
  stats: DirectorStat[];
  targetItems: DirectorTargetItem[];
  reviewItem: DirectorReviewItem;
}) {
  return (
    <section className="director-workbench">
      <header className="director-header">
        <div className="director-title-block">
          <span className="director-kicker">编导 WORK SIGNAL</span>
          <h1>编导工作台</h1>
          <p>今日脚本、剪辑流转与发布库存一屏掌握</p>
        </div>

        <div className="director-completion-card" aria-label="今日完成率">
          <div className="director-completion-copy">
            <span>今日完成率</span>
            <strong>{completion}%</strong>
            <p>{completedText} 已完成</p>
          </div>
          <div
            className="director-completion-ring"
            aria-hidden="true"
            style={{ background: `conic-gradient(var(--theme-accent, var(--accent, #b85c45)) ${completion * 3.6}deg, rgba(32, 36, 42, 0.08) 0deg)` }}
          >
            <i></i>
          </div>
        </div>
      </header>

      <WorkbenchStatGrid stats={stats} />

      <div className="director-main-grid">
        <article className="director-panel director-target-panel">
          <div className="director-panel-head">
            <div>
              <h2>今日目标</h2>
            </div>
            <span>Today</span>
          </div>
          <div className="director-target-list">
            {targetItems.map((item) => {
              const itemPercent = percent(item.done, item.target);
              return (
                <div className="director-target-row" key={item.label}>
                  <div className="director-target-icon">{item.icon}</div>
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.caption}</span>
                    <div className="director-target-bar">
                      <i style={{ width: `${itemPercent}%` }}></i>
                    </div>
                  </div>
                  <b>{progressText(item.done, item.target)}</b>
                </div>
              );
            })}
          </div>
        </article>

        <article className="director-panel director-review-panel">
          <div className="director-panel-head">
            <div>
              <h2>当前待处理</h2>
            </div>
            <span>Queue</span>
          </div>
          {reviewItem ? (
            <div className="director-review-card">
              <div className="director-review-topline">
                <span>{reviewItem.label}</span>
                <b>{reviewItem.status}</b>
              </div>
              <strong>{reviewItem.title}</strong>
              <p>{reviewItem.meta}</p>
              <a className="director-action-button" href={reviewItem.href}>{reviewItem.actionLabel}</a>
            </div>
          ) : (
            <div className="director-review-empty">
              <strong>暂无待审核成片</strong>
              <p>当前没有需要你确认的视频。</p>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

function EditorDashboardWorkbench({
  completion,
  completedText,
  stats,
  targetItems,
  queueItem,
}: {
  completion: number;
  completedText: string;
  stats: DirectorStat[];
  targetItems: DirectorTargetItem[];
  queueItem: DirectorReviewItem;
}) {
  return (
    <section className="director-workbench editor-dashboard-workbench">
      <header className="director-header">
        <div className="director-title-block">
          <span className="director-kicker">剪辑 WORK SIGNAL</span>
          <h1>剪辑工作台</h1>
          <p>今日剪辑、修改返工与交付节奏一屏掌握</p>
        </div>

        <div className="director-completion-card" aria-label="今日完成率">
          <div className="director-completion-copy">
            <span>今日完成率</span>
            <strong>{completion}%</strong>
            <p>{completedText} 已交付</p>
          </div>
          <div
            className="director-completion-ring"
            aria-hidden="true"
            style={{ background: `conic-gradient(var(--theme-accent, var(--accent, #b85c45)) ${completion * 3.6}deg, rgba(32, 36, 42, 0.08) 0deg)` }}
          >
            <i></i>
          </div>
        </div>
      </header>

      <WorkbenchStatGrid stats={stats} />

      <div className="director-main-grid">
        <article className="director-panel director-target-panel">
          <div className="director-panel-head">
            <div>
              <h2>今日目标</h2>
            </div>
            <span>Today</span>
          </div>
          <div className="director-target-list">
            {targetItems.map((item) => {
              const itemPercent = percent(item.done, item.target);
              return (
                <div className="director-target-row" key={item.label}>
                  <div className="director-target-icon">{item.icon}</div>
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.caption}</span>
                    <div className="director-target-bar">
                      <i style={{ width: `${itemPercent}%` }}></i>
                    </div>
                  </div>
                  <b>{progressText(item.done, item.target)}</b>
                </div>
              );
            })}
          </div>
        </article>

        <article className="director-panel director-review-panel">
          <div className="director-panel-head">
            <div>
              <h2>当前待处理</h2>
            </div>
            <span>Queue</span>
          </div>
          {queueItem ? (
            <div className="director-review-card">
              <div className="director-review-topline">
                <span>{queueItem.label}</span>
                <b>{queueItem.status}</b>
              </div>
              <strong>{queueItem.title}</strong>
              <p>{queueItem.meta}</p>
              <a className="director-action-button" href={queueItem.href}>{queueItem.actionLabel}</a>
            </div>
          ) : (
            <div className="director-review-empty">
              <strong>暂无待处理剪辑任务</strong>
              <p>当前没有需要你立刻处理的视频，保持这个节奏。</p>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

export default async function DashboardPage() {
  await ensureDeadlineReminders();
  const user = await requireUser();
  const start = startOfShanghaiDay();
  const end = endOfShanghaiDay();

  if (user.role === Role.ADMIN) {
    const now = new Date();
    const [
      users,
      scriptsToday,
      deliveredToday,
      pendingReview,
      readyToPublish,
      stock,
      overdue,
      pendingReviewVideos,
      overdueVideos,
    ] = await Promise.all([
      prisma.user.findMany({
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        include: { dailyTargets: { orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }], take: 1 } },
      }),
      prisma.script.findMany({
        where: { createdAt: { gte: start, lt: end } },
        select: { authorId: true },
      }),
      prisma.videoTask.findMany({
        where: { deliveredAt: { gte: start, lt: end }, status: { in: completeStatuses } },
        select: { durationSeconds: true, editorId: true },
      }),
      prisma.videoTask.count({ where: { status: VideoStatus.PENDING_REVIEW } }),
      prisma.videoTask.count({ where: { status: { in: [VideoStatus.READY_TO_PUBLISH, VideoStatus.SCHEDULED] } } }),
      prisma.videoTask.count({ where: { status: VideoStatus.STOCK } }),
      prisma.videoTask.count({
        where: {
          plannedDeliveryAt: { lt: now },
          status: { in: [VideoStatus.PENDING_EDIT, VideoStatus.IN_PROGRESS, VideoStatus.NEEDS_REVISION] },
        },
      }),
      prisma.videoTask.findMany({
        where: { status: VideoStatus.PENDING_REVIEW },
        orderBy: { updatedAt: "desc" },
        take: 3,
        include: { script: true, director: true, editor: true },
      }),
      prisma.videoTask.findMany({
        where: {
          plannedDeliveryAt: { lt: now },
          status: { in: [VideoStatus.PENDING_EDIT, VideoStatus.IN_PROGRESS, VideoStatus.NEEDS_REVISION] },
        },
        orderBy: { plannedDeliveryAt: "asc" },
        take: 3,
        include: { script: true, director: true, editor: true },
      }),
    ]);

    const directorTarget = users.reduce((sum, member) => {
      const target = member.dailyTargets[0];
      return sum + (target?.chineseParentingScripts || 0) + (target?.femaleScripts || 0);
    }, 0);
    const editorTarget = users.reduce((sum, member) => sum + (member.dailyTargets[0]?.editingVideos || 0), 0);
    const totalTarget = directorTarget + editorTarget;
    const totalDone = scriptsToday.length + deliveredToday.length;
    const scriptsByAuthor = scriptsToday.reduce<Record<string, number>>((map, script) => {
      map[script.authorId] = (map[script.authorId] || 0) + 1;
      return map;
    }, {});
    const deliveredByEditor = deliveredToday.reduce<Record<string, number>>((map, video) => {
      map[video.editorId] = (map[video.editorId] || 0) + 1;
      return map;
    }, {});
    const memberItems = users
      .filter((member) => member.role !== Role.ADMIN)
      .map((member) => {
        const target = member.dailyTargets[0];
        const memberTarget = sumTarget(target);
        const memberDone = member.role === Role.EDITOR ? deliveredByEditor[member.id] || 0 : scriptsByAuthor[member.id] || 0;
        return {
          caption: "今日目标",
          done: memberDone,
          href: `/people/${member.id}`,
          id: member.id,
          name: member.name,
          role: member.role,
          target: memberTarget,
        };
      });
    const deliveredWithDuration = deliveredToday.filter((video) => typeof video.durationSeconds === "number");
    const durationBuckets = {
      long: deliveredWithDuration.filter((video) => (video.durationSeconds || 0) > 130).length,
      mid: deliveredWithDuration.filter((video) => {
        const duration = video.durationSeconds || 0;
        return duration >= 70 && duration <= 130;
      }).length,
      short: deliveredWithDuration.filter((video) => (video.durationSeconds || 0) < 70).length,
    };
    const riskItems = [
      ...overdueVideos.map((video) => ({
        href: "/videos?queue=editing#task-board",
        label: "逾期任务",
        meta: `${video.director.name} / ${video.editor.name} · ${formatDate(video.plannedDeliveryAt)} 交付`,
        status: videoStatusLabel[video.status],
        title: video.script.title,
      })),
      ...pendingReviewVideos.map((video) => ({
        href: "/videos?queue=review#task-board",
        label: "待审核",
        meta: `${video.director.name} / ${video.editor.name} · ${formatDate(video.plannedDeliveryAt)} 交付`,
        status: videoStatusLabel[video.status],
        title: video.script.title,
      })),
    ].slice(0, 4);

    return (
      <AppShell user={user} active="dashboard" title="管理员工作台" subtitle={roleSubtitle(user.role)}>
        <AdminWorkbench
          completion={percent(totalDone, totalTarget)}
          completedText={progressText(totalDone, totalTarget)}
          durationBuckets={durationBuckets}
          members={memberItems}
          publishReady={readyToPublish}
          riskItems={riskItems}
          stats={[
            {
              description: `全员完成率 ${percent(totalDone, totalTarget)}%`,
              detail: `${memberItems.length} 人`,
              href: "/people",
              icon: "总",
              label: "今日总进度",
              value: progressText(totalDone, totalTarget),
            },
            {
              description: "编导今日脚本",
              href: "/scripts",
              icon: "稿",
              label: "脚本产出",
              value: progressText(scriptsToday.length, directorTarget),
            },
            {
              description: "剪辑今日成片",
              href: "/editing",
              icon: "剪",
              label: "剪辑交付",
              value: progressText(deliveredToday.length, editorTarget),
            },
            {
              description: `待审核 ${pendingReview}`,
              detail: `逾期 ${overdue}`,
              href: "/videos?queue=review",
              icon: "险",
              label: "审核风险",
              value: pendingReview + overdue,
            },
          ]}
          stock={stock}
        />
      </AppShell>
    );
  }

  if (user.role === Role.DIRECTOR) {
    const [target, scriptsToday, pendingReview, readyVideos, stockVideos, editingVideos] = await Promise.all([
      latestTarget(user.id),
      prisma.script.findMany({ where: { authorId: user.id, createdAt: { gte: start, lt: end } }, orderBy: { createdAt: "desc" } }),
      prisma.videoTask.findMany({
        where: { directorId: user.id, status: VideoStatus.PENDING_REVIEW },
        orderBy: { updatedAt: "desc" },
        include: { script: true, editor: true },
      }),
      prisma.videoTask.findMany({
        where: { directorId: user.id, status: { in: [VideoStatus.READY_TO_PUBLISH, VideoStatus.SCHEDULED] } },
        orderBy: { plannedPublishDate: "asc" },
        include: { script: true, editor: true },
      }),
      prisma.videoTask.findMany({
        where: { directorId: user.id, status: VideoStatus.STOCK },
        orderBy: { approvedAt: "desc" },
        include: { script: true, editor: true },
      }),
      prisma.videoTask.findMany({
        where: { directorId: user.id, status: { in: [VideoStatus.PENDING_EDIT, VideoStatus.IN_PROGRESS, VideoStatus.NEEDS_REVISION] } },
        orderBy: { plannedDeliveryAt: "asc" },
        include: { script: true, editor: true },
      }),
    ]);
    const chineseDone = scriptsToday.filter((script) => script.category !== "FEMALE").length;
    const femaleDone = scriptsToday.filter((script) => script.category === "FEMALE").length;
    const chineseTarget = target?.chineseParentingScripts || 0;
    const femaleTarget = target?.femaleScripts || 0;
    const scriptTarget = chineseTarget + femaleTarget;
    const scriptDone = chineseDone + femaleDone;

    const reviewItem = pendingReview[0]
      ? {
          label: "待审核成片",
          title: pendingReview[0].script.title,
          meta: `待审核 · 剪辑：${pendingReview[0].editor.name}`,
          status: "待审核",
          actionLabel: "去审核",
          href: "/review",
        }
      : null;

    return (
      <AppShell user={user} active="dashboard" title="编导工作台" subtitle="今日脚本、剪辑流转与发布库存一屏掌握">
        <DirectorWorkbench
          completion={percent(scriptDone, scriptTarget)}
          completedText={progressText(scriptDone, scriptTarget)}
          stats={[
            {
              icon: "稿",
              label: "今日脚本目标",
              value: progressText(scriptDone, scriptTarget),
              description: `中式育儿 ${progressText(chineseDone, chineseTarget)}`,
              detail: `女性脚本 ${progressText(femaleDone, femaleTarget)}`,
            },
            {
              icon: "审",
              label: "待审核",
              value: pendingReview.length,
              description: "需要你确认的成片",
            },
            {
              icon: "剪",
              label: "剪辑中",
              value: editingVideos.length,
              description: "已下发给剪辑的任务",
            },
            {
              icon: "库",
              label: "发布库存",
              value: readyVideos.length + stockVideos.length,
              description: `可发布 ${readyVideos.length}`,
              detail: `屯片池 ${stockVideos.length}`,
            },
          ]}
          targetItems={[
            { icon: "中", label: "中式育儿脚本", done: chineseDone, target: chineseTarget, caption: "传统 + 协助" },
            { icon: "女", label: "女性脚本", done: femaleDone, target: femaleTarget, caption: "女性内容" },
            { icon: "总", label: "今日总目标", done: scriptDone, target: scriptTarget, caption: "个人交稿目标" },
          ]}
          reviewItem={reviewItem}
        />
      </AppShell>
    );
  }

  const [target, taskCounts, todayDone, overdue, tasks, deliveredToday] = await Promise.all([
    latestTarget(user.id),
    prisma.videoTask.groupBy({ by: ["status"], where: { editorId: user.id }, _count: true }),
    prisma.videoTask.count({ where: { editorId: user.id, deliveredAt: { gte: start, lt: end }, status: { in: completeStatuses } } }),
    prisma.videoTask.count({
      where: {
        editorId: user.id,
        plannedDeliveryAt: { lt: new Date() },
        status: { in: [VideoStatus.PENDING_EDIT, VideoStatus.IN_PROGRESS, VideoStatus.NEEDS_REVISION] },
      },
    }),
    prisma.videoTask.findMany({
      where: { editorId: user.id, status: { in: [VideoStatus.PENDING_EDIT, VideoStatus.IN_PROGRESS, VideoStatus.NEEDS_REVISION, VideoStatus.PENDING_REVIEW] } },
      orderBy: { plannedDeliveryAt: "asc" },
      include: { script: true, director: true },
    }),
    prisma.videoTask.findMany({
      where: { editorId: user.id, deliveredAt: { gte: start, lt: end }, durationSeconds: { not: null } },
      select: { durationSeconds: true },
    }),
  ]);
  const countByStatus = new Map(taskCounts.map((item) => [item.status, item._count]));
  const shortCount = deliveredToday.filter((video) => (video.durationSeconds || 0) < 70).length;
  const midCount = deliveredToday.filter((video) => (video.durationSeconds || 0) >= 70 && (video.durationSeconds || 0) <= 130).length;
  const longCount = deliveredToday.filter((video) => (video.durationSeconds || 0) > 130).length;
  const editingTarget = target?.editingVideos || 0;
  const pendingEditCount = countByStatus.get(VideoStatus.PENDING_EDIT) || 0;
  const inProgressCount = countByStatus.get(VideoStatus.IN_PROGRESS) || 0;
  const needsRevisionCount = countByStatus.get(VideoStatus.NEEDS_REVISION) || 0;
  const pendingReviewCount = countByStatus.get(VideoStatus.PENDING_REVIEW) || 0;
  const priorityTask =
    tasks.find((video) => video.status === VideoStatus.NEEDS_REVISION) ||
    tasks.find((video) => video.status === VideoStatus.PENDING_EDIT) ||
    tasks.find((video) => video.status === VideoStatus.IN_PROGRESS) ||
    tasks.find((video) => video.status === VideoStatus.PENDING_REVIEW) ||
    null;
  const queueItem = priorityTask
    ? {
        label: priorityTask.status === VideoStatus.PENDING_REVIEW ? "等待编导审核" : "优先处理任务",
        title: priorityTask.script.title,
        meta: `${videoTypeLabel[priorityTask.type]} · 编导：${priorityTask.director.name} · ${formatDate(priorityTask.plannedDeliveryAt)} 交付`,
        status: videoStatusLabel[priorityTask.status],
        actionLabel: priorityTask.status === VideoStatus.PENDING_REVIEW ? "查看队列" : "去处理",
        href: `/editing?status=${priorityTask.status}`,
      }
    : null;

  return (
    <AppShell user={user} active="dashboard" title="剪辑工作台" subtitle="今日剪辑、修改返工与交付节奏一屏掌握">
      <EditorDashboardWorkbench
        completion={percent(todayDone, editingTarget)}
        completedText={progressText(todayDone, editingTarget)}
        stats={[
          {
            icon: "交",
            label: "今日剪辑目标",
            value: progressText(todayDone, editingTarget),
            description: `已交付 ${todayDone}`,
            detail: `剩余 ${Math.max(editingTarget - todayDone, 0)}`,
            href: "/editing",
          },
          {
            icon: "流",
            label: "剪辑流转",
            value: pendingEditCount + inProgressCount,
            description: `待剪辑 ${pendingEditCount}`,
            detail: `剪辑中 ${inProgressCount}`,
            href: "/editing?queue=flow",
          },
          {
            icon: "改",
            label: "修改返工",
            value: needsRevisionCount,
            description: "审核反馈待处理",
            detail: `逾期 ${overdue}`,
            href: `/editing?status=${VideoStatus.NEEDS_REVISION}`,
          },
          {
            icon: "审",
            label: "待审核",
            value: pendingReviewCount,
            description: "已提交给编导确认",
            href: `/editing?status=${VideoStatus.PENDING_REVIEW}`,
          },
        ]}
        targetItems={[
          { icon: "目", label: "今日剪辑目标", done: todayDone, target: editingTarget, caption: "个人交付目标" },
          { icon: "短", label: "70s 内", done: shortCount, target: todayDone, caption: "今日短视频交付" },
          { icon: "中", label: "70-130s", done: midCount, target: todayDone, caption: "今日标准时长交付" },
          { icon: "长", label: "130s+", done: longCount, target: todayDone, caption: "今日长视频交付" },
        ]}
        queueItem={queueItem}
      />
    </AppShell>
  );
}
