import { Role, ScheduleStatus, VideoStatus } from "@prisma/client";
import { markPublishedAction, scheduleVideoAction } from "@/app/actions";
import { AppShell } from "@/components/AppShell";
import { Modal } from "@/components/Modal";
import { requireRole } from "@/lib/auth";
import { formatDate, startOfShanghaiDay } from "@/lib/dates";
import { videoStatusLabel, videoTypeLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const dayMs = 24 * 60 * 60 * 1000;

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * dayMs);
}

function sameDisplayDate(left: Date, right: Date) {
  return formatDate(left) === formatDate(right);
}

function weekdayLabel(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    weekday: "short",
  }).format(date);
}

export default async function SchedulePage() {
  const user = await requireRole([Role.ADMIN, Role.DIRECTOR]);
  const videoWhere = user.role === Role.ADMIN ? {} : { directorId: user.id };

  const [schedules, candidates] = await Promise.all([
    prisma.publishSchedule.findMany({
      where: user.role === Role.ADMIN ? {} : { videoTask: { directorId: user.id } },
      orderBy: [{ plannedPublishDate: "asc" }, { publishTime: "asc" }],
      include: { videoTask: { include: { script: true, editor: true, director: true } } },
      take: 100,
    }),
    prisma.videoTask.findMany({
      where: { ...videoWhere, status: { in: [VideoStatus.STOCK, VideoStatus.APPROVED, VideoStatus.READY_TO_PUBLISH] } },
      orderBy: { approvedAt: "desc" },
      include: { script: true, editor: true },
      take: 40,
    }),
  ]);

  const scheduled = schedules.filter((schedule) => schedule.status === ScheduleStatus.SCHEDULED);
  const published = schedules.filter((schedule) => schedule.status === ScheduleStatus.PUBLISHED);
  const today = startOfShanghaiDay();
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index);
    return {
      date,
      schedules: scheduled.filter((schedule) => sameDisplayDate(schedule.plannedPublishDate, date)),
    };
  });
  const todaySchedules = scheduled.filter((schedule) => sameDisplayDate(schedule.plannedPublishDate, today));
  const weekScheduleCount = weekDays.reduce((sum, day) => sum + day.schedules.length, 0);
  const weekEnd = addDays(today, 7);
  const laterSchedules = scheduled.filter((schedule) => schedule.plannedPublishDate >= weekEnd);
  const furthestSchedule = scheduled.reduce<(typeof scheduled)[number] | null>((latest, schedule) => {
    if (!latest) return schedule;
    if (schedule.plannedPublishDate > latest.plannedPublishDate) return schedule;
    if (sameDisplayDate(schedule.plannedPublishDate, latest.plannedPublishDate) && schedule.publishTime > latest.publishTime) return schedule;
    return latest;
  }, null);
  const plannedMessage = furthestSchedule
    ? `已规划到 ${formatDate(furthestSchedule.plannedPublishDate)} ${furthestSchedule.publishTime}，真棒`
    : "还没有未来排期，先从待安排池补一条";

  return (
    <AppShell user={user} active="schedule" title="排期日历" subtitle="未来一周、待安排与已发布归档一屏掌握。">
      <section className="schedule-workspace">
        <header className="schedule-hero">
          <div>
            <span className="schedule-kicker">PUBLISH PLAN</span>
            <h1>排期日历</h1>
            <p>把可发布内容安排到具体日期和时间，清楚看到未来一周怎么发、还剩哪些待安排。</p>
          </div>
          <article className="schedule-plan-card">
            <span>Planning Signal</span>
            <strong>{plannedMessage}</strong>
            <p>{laterSchedules.length ? `另有 ${laterSchedules.length} 条安排在一周以后` : "未来一周节奏已集中展示"}</p>
          </article>
        </header>

        <section className="schedule-signal-grid" aria-label="排期概览">
          <article className="schedule-signal-card">
            <span>已排期</span>
            <strong>{scheduled.length}</strong>
            <p>待发布内容</p>
          </article>
          <article className="schedule-signal-card">
            <span>今日发布</span>
            <strong>{todaySchedules.length}</strong>
            <p>需要手动确认</p>
          </article>
          <a className="schedule-signal-card" href="#waiting">
            <span>待安排</span>
            <strong>{candidates.length}</strong>
            <p>可发布或屯片</p>
          </a>
          <a className="schedule-signal-card" href="#published">
            <span>已发布</span>
            <strong>{published.length}</strong>
            <p>已归档内容</p>
          </a>
        </section>

        <section className="schedule-main-grid">
          <article className="schedule-week-panel">
            <div className="schedule-panel-head">
              <div>
                <span>Next 7 Days</span>
                <h2>未来一周发布日历</h2>
                <p>{plannedMessage} · 本周 {weekScheduleCount} 条</p>
              </div>
              <Modal trigger="补充排期" title="补充排期" subtitle="从屯片池或已通过内容中选择视频加入排期。">
                {candidates.length ? (
                  <form action={scheduleVideoAction} className="glass-form">
                    <label className="field">
                      <span>选择视频</span>
                      <select name="videoTaskId" required>
                        {candidates.map((video) => (
                          <option value={video.id} key={video.id}>{video.script.title} · {video.editor.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>计划发布日期</span>
                      <input name="plannedPublishDate" type="date" required />
                    </label>
                    <label className="field">
                      <span>发布时间</span>
                      <input name="publishTime" type="time" required defaultValue="19:30" />
                    </label>
                    <button className="primary-action" type="submit">加入排期</button>
                  </form>
                ) : (
                  <div className="empty-state">暂无可补充排期的视频。</div>
                )}
              </Modal>
            </div>

            <div className="schedule-week-grid">
              {weekDays.map((day, index) => (
                <article className="schedule-day-card" data-today={index === 0} key={day.date.toISOString()}>
                  <div className="schedule-day-head">
                    <div>
                      <strong>{formatDate(day.date)}</strong>
                      <span>{index === 0 ? "今天" : weekdayLabel(day.date)}</span>
                    </div>
                    <b>{day.schedules.length}</b>
                  </div>

                  <div className="schedule-day-list">
                    {day.schedules.length ? day.schedules.map((schedule) => (
                      <div className="schedule-item" key={schedule.id}>
                        <span>{schedule.publishTime}</span>
                        <strong>{schedule.videoTask.script.title}</strong>
                        <p>{videoTypeLabel[schedule.videoTask.type]} · {schedule.videoTask.editor.name}</p>
                        <Modal
                          trigger="标记发布"
                          title={schedule.videoTask.script.title}
                          subtitle="填写实际发布链接后进入已发布归档。"
                          tone="ghost"
                        >
                          <form action={markPublishedAction} className="glass-form">
                            <input type="hidden" name="scheduleId" value={schedule.id} />
                            <label className="field">
                              <span>发布链接</span>
                              <input name="publishUrl" required placeholder="https://..." />
                            </label>
                            <button className="primary-action" type="submit">标记已发布</button>
                          </form>
                        </Modal>
                      </div>
                    )) : (
                      <div className="schedule-day-empty">暂无发布安排</div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </article>

          <aside className="schedule-side-stack">
            <article className="schedule-side-panel" id="waiting">
              <div className="schedule-panel-head compact">
                <div>
                  <span>Waiting Pool</span>
                  <h2>待安排</h2>
                </div>
                <b>{candidates.length} 条</b>
              </div>
              <div className="schedule-waiting-list">
                {candidates.length ? candidates.slice(0, 8).map((video) => (
                  <article key={video.id}>
                    <div>
                      <strong>{video.script.title}</strong>
                      <p>{videoTypeLabel[video.type]} · 剪辑 {video.editor.name}</p>
                    </div>
                    <span>{videoStatusLabel[video.status]}</span>
                  </article>
                )) : (
                  <div className="schedule-empty-card">暂无待安排内容。</div>
                )}
              </div>
            </article>

            <article className="schedule-side-panel" id="published">
              <div className="schedule-panel-head compact">
                <div>
                  <span>Published</span>
                  <h2>已发布归档</h2>
                </div>
                <b>{published.length} 条</b>
              </div>
              <div className="schedule-published-list">
                {published.length ? published.slice(0, 6).map((schedule) => (
                  <article key={schedule.id}>
                    <strong>{schedule.videoTask.script.title}</strong>
                    <p>{formatDate(schedule.publishedAt)} · {schedule.publishUrl || "未记录链接"}</p>
                  </article>
                )) : (
                  <div className="schedule-empty-card">还没有已发布归档。</div>
                )}
              </div>
            </article>
          </aside>
        </section>

        <section className="schedule-timeline-panel">
          <div className="schedule-panel-head compact">
            <div>
              <span>All Scheduled</span>
              <h2>全部待发布排期</h2>
            </div>
            <b>{scheduled.length} 条</b>
          </div>
          <div className="schedule-timeline-list">
            {scheduled.length ? scheduled.map((schedule) => (
              <article key={schedule.id}>
                <time>{formatDate(schedule.plannedPublishDate)} {schedule.publishTime}</time>
                <strong>{schedule.videoTask.script.title}</strong>
                <span>{schedule.videoTask.director.name} / {schedule.videoTask.editor.name}</span>
              </article>
            )) : (
              <div className="schedule-empty-card">暂时没有待发布排期。</div>
            )}
          </div>
        </section>
      </section>
    </AppShell>
  );
}
