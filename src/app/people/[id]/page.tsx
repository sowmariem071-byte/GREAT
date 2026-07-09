import { notFound, redirect } from "next/navigation";
import { Role, VideoStatus } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { StatusPill } from "@/components/StatusPill";
import { requireUser } from "@/lib/auth";
import { endOfShanghaiDay, formatDate, startOfShanghaiDay } from "@/lib/dates";
import { roleLabel, videoStatusLabel, videoTypeLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const completeStatuses = [
  VideoStatus.PENDING_REVIEW,
  VideoStatus.APPROVED,
  VideoStatus.READY_TO_PUBLISH,
  VideoStatus.SCHEDULED,
  VideoStatus.PUBLISHED,
  VideoStatus.STOCK,
];

const editorQueueStatuses = [
  VideoStatus.PENDING_EDIT,
  VideoStatus.IN_PROGRESS,
  VideoStatus.NEEDS_REVISION,
  VideoStatus.PENDING_REVIEW,
];

const directorQueueStatuses = [
  VideoStatus.PENDING_EDIT,
  VideoStatus.IN_PROGRESS,
  VideoStatus.NEEDS_REVISION,
];

type PersonPageProps = {
  params: Promise<{ id: string }>;
};

function percent(done: number, target: number) {
  if (target <= 0) return done > 0 ? 100 : 0;
  return Math.min(100, Math.round((done / target) * 100));
}

function progressText(done: number, target: number) {
  if (target <= 0) return `${done}`;
  return `${done}/${target}`;
}

export default async function PersonPage({ params }: PersonPageProps) {
  const currentUser = await requireUser();
  const { id } = await params;
  const start = startOfShanghaiDay();
  const end = endOfShanghaiDay();

  const member = await prisma.user.findUnique({
    where: { id },
    include: { dailyTargets: { orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }], take: 1 } },
  });

  if (!member) notFound();

  if (currentUser.role !== Role.ADMIN && currentUser.id !== member.id) {
    redirect("/dashboard");
  }

  const target = member.dailyTargets[0];

  if (member.role === Role.DIRECTOR) {
    const [scriptsToday, pendingReview, editingVideos, readyVideos, stockVideos, recentVideos] = await Promise.all([
      prisma.script.findMany({
        where: { authorId: member.id, createdAt: { gte: start, lt: end } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.videoTask.count({ where: { directorId: member.id, status: VideoStatus.PENDING_REVIEW } }),
      prisma.videoTask.count({ where: { directorId: member.id, status: { in: directorQueueStatuses } } }),
      prisma.videoTask.count({
        where: { directorId: member.id, status: { in: [VideoStatus.READY_TO_PUBLISH, VideoStatus.SCHEDULED] } },
      }),
      prisma.videoTask.count({ where: { directorId: member.id, status: VideoStatus.STOCK } }),
      prisma.videoTask.findMany({
        where: { directorId: member.id },
        orderBy: { updatedAt: "desc" },
        take: 8,
        include: { script: true, editor: true },
      }),
    ]);

    const chineseDone = scriptsToday.filter((script) => script.category !== "FEMALE").length;
    const femaleDone = scriptsToday.filter((script) => script.category === "FEMALE").length;
    const chineseTarget = target?.chineseParentingScripts || 0;
    const femaleTarget = target?.femaleScripts || 0;
    const scriptDone = chineseDone + femaleDone;
    const scriptTarget = chineseTarget + femaleTarget;

    return (
      <AppShell user={currentUser} active={currentUser.role === Role.ADMIN ? "people" : "dashboard"} title={`${member.name}的编导主页`} subtitle="查看这位编导的今日脚本、视频流转和发布库存。">
        <section className="person-profile-hero">
          <div className="person-avatar">{member.avatarUrl ? <img src={member.avatarUrl} alt={member.name} /> : member.name.slice(0, 1)}</div>
          <div>
            <span>{roleLabel[member.role]} WORK SIGNAL</span>
            <h2>{member.name}</h2>
            <p>{member.email} · 今日完成率 {percent(scriptDone, scriptTarget)}%</p>
          </div>
        </section>

        <section className="module-stat-grid">
          <StatCard icon="稿" label="今日脚本" value={progressText(scriptDone, scriptTarget)} hint={`中式 ${progressText(chineseDone, chineseTarget)} · 女性 ${progressText(femaleDone, femaleTarget)}`} />
          <StatCard icon="审" label="待审核" value={pendingReview} hint="需要编导确认" />
          <StatCard icon="剪" label="剪辑流转" value={editingVideos} hint="已下发未完成" />
          <StatCard icon="库" label="发布库存" value={readyVideos + stockVideos} hint={`可发布 ${readyVideos} · 屯片 ${stockVideos}`} />
        </section>

        <section className="work-grid">
          <div className="panel">
            <div className="panel-title">
              <h3>今日脚本进度</h3>
              <span>{progressText(scriptDone, scriptTarget)}</span>
            </div>
            <div className="person-progress-list">
              <div><strong>中式育儿脚本</strong><span>{progressText(chineseDone, chineseTarget)}</span></div>
              <div><strong>女性脚本</strong><span>{progressText(femaleDone, femaleTarget)}</span></div>
              <div><strong>今日总目标</strong><span>{progressText(scriptDone, scriptTarget)}</span></div>
            </div>
          </div>

          <aside className="panel">
            <div className="panel-title">
              <h3>最近视频任务</h3>
              <span>{recentVideos.length} 条</span>
            </div>
            <div className="card-list">
              {recentVideos.length ? recentVideos.map((video) => (
                <article className="task-card" key={video.id}>
                  <header>
                    <div>
                      <strong>{video.script.title}</strong>
                      <p>{videoTypeLabel[video.type]} · 剪辑 {video.editor.name} · 交付 {formatDate(video.plannedDeliveryAt)}</p>
                    </div>
                    <StatusPill status={video.status} />
                  </header>
                </article>
              )) : <div className="empty-state">暂无视频任务。</div>}
            </div>
          </aside>
        </section>
      </AppShell>
    );
  }

  if (member.role === Role.EDITOR) {
    const [taskCounts, todayDone, overdue, tasks, deliveredToday] = await Promise.all([
      prisma.videoTask.groupBy({ by: ["status"], where: { editorId: member.id }, _count: true }),
      prisma.videoTask.count({
        where: { editorId: member.id, deliveredAt: { gte: start, lt: end }, status: { in: completeStatuses } },
      }),
      prisma.videoTask.count({
        where: {
          editorId: member.id,
          plannedDeliveryAt: { lt: new Date() },
          status: { in: [VideoStatus.PENDING_EDIT, VideoStatus.IN_PROGRESS, VideoStatus.NEEDS_REVISION] },
        },
      }),
      prisma.videoTask.findMany({
        where: { editorId: member.id, status: { in: editorQueueStatuses } },
        orderBy: { plannedDeliveryAt: "asc" },
        take: 8,
        include: { script: true, director: true },
      }),
      prisma.videoTask.findMany({
        where: { editorId: member.id, deliveredAt: { gte: start, lt: end }, durationSeconds: { not: null } },
        select: { durationSeconds: true },
      }),
    ]);

    const countByStatus = new Map(taskCounts.map((item) => [item.status, item._count]));
    const editingTarget = target?.editingVideos || 0;
    const shortCount = deliveredToday.filter((video) => (video.durationSeconds || 0) < 70).length;
    const midCount = deliveredToday.filter((video) => (video.durationSeconds || 0) >= 70 && (video.durationSeconds || 0) <= 130).length;
    const longCount = deliveredToday.filter((video) => (video.durationSeconds || 0) > 130).length;

    return (
      <AppShell user={currentUser} active={currentUser.role === Role.ADMIN ? "people" : "dashboard"} title={`${member.name}的剪辑工作量`} subtitle="查看这位剪辑的今日交付、待处理任务和时长结构。">
        <section className="person-profile-hero">
          <div className="person-avatar">{member.avatarUrl ? <img src={member.avatarUrl} alt={member.name} /> : member.name.slice(0, 1)}</div>
          <div>
            <span>{roleLabel[member.role]} WORK SIGNAL</span>
            <h2>{member.name}</h2>
            <p>{member.email} · 今日完成率 {percent(todayDone, editingTarget)}%</p>
          </div>
        </section>

        <section className="module-stat-grid">
          <StatCard icon="今" label="今日完成" value={progressText(todayDone, editingTarget)} hint="交付目标" />
          <StatCard icon="待" label="待剪辑" value={countByStatus.get(VideoStatus.PENDING_EDIT) || 0} hint="新任务" />
          <StatCard icon="中" label="剪辑中" value={countByStatus.get(VideoStatus.IN_PROGRESS) || 0} hint="处理中" />
          <StatCard icon="修" label="需修改" value={countByStatus.get(VideoStatus.NEEDS_REVISION) || 0} hint={`逾期 ${overdue}`} />
        </section>

        <section className="work-grid">
          <div className="panel">
            <div className="panel-title">
              <h3>当前剪辑队列</h3>
              <span>{tasks.length} 条</span>
            </div>
            <div className="card-list">
              {tasks.length ? tasks.map((video) => (
                <article className="task-card" key={video.id}>
                  <header>
                    <div>
                      <strong>{video.script.title}</strong>
                      <p>{videoTypeLabel[video.type]} · 编导 {video.director.name} · 交付 {formatDate(video.plannedDeliveryAt)}</p>
                    </div>
                    <StatusPill status={video.status} />
                  </header>
                  <p>{videoStatusLabel[video.status]}</p>
                </article>
              )) : <div className="empty-state">当前没有待处理剪辑任务。</div>}
            </div>
          </div>

          <aside className="panel">
            <div className="panel-title">
              <h3>今日完成时长</h3>
              <span>{formatDate(start)} - {formatDate(end)}</span>
            </div>
            <div className="duration-grid">
              <div className="duration-card"><small>70s 以内</small><strong>{shortCount}</strong></div>
              <div className="duration-card"><small>70s-130s</small><strong>{midCount}</strong></div>
              <div className="duration-card"><small>130s+</small><strong>{longCount}</strong></div>
            </div>
          </aside>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell user={currentUser} active={currentUser.role === Role.ADMIN ? "people" : "dashboard"} title={`${member.name}的主页`} subtitle="管理员账号暂无单独工作量面板。">
      <section className="person-profile-hero">
        <div className="person-avatar">{member.avatarUrl ? <img src={member.avatarUrl} alt={member.name} /> : member.name.slice(0, 1)}</div>
        <div>
          <span>{roleLabel[member.role]} WORK SIGNAL</span>
          <h2>{member.name}</h2>
          <p>{member.email}</p>
        </div>
      </section>
    </AppShell>
  );
}
