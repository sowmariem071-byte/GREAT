import type { CSSProperties } from "react";
import { Role, ScriptCategory } from "@prisma/client";
import { createScriptAction } from "@/app/actions";
import { AppShell } from "@/components/AppShell";
import { Modal } from "@/components/Modal";
import { ScriptCardDialog } from "@/components/ScriptCardDialog";
import { requireRole } from "@/lib/auth";
import { formatDate, startOfShanghaiDay, endOfShanghaiDay } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const categoryMeta: Record<ScriptCategory, { label: string; group: string; tone: string }> = {
  TRADITIONAL: { label: "传统", group: "中式育儿", tone: "terracotta" },
  ASSIST: { label: "协助", group: "中式育儿", tone: "caramel" },
  FEMALE: { label: "女性", group: "女性内容", tone: "rose" },
};

function scriptExcerpt(body: string) {
  if (body.length <= 78) return body;
  return `${body.slice(0, 78)}...`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function meterStyle(percent: number): CSSProperties {
  return { "--meter": `${clampPercent(percent)}%` } as CSSProperties;
}

function ringStyle(percent: number): CSSProperties {
  return { "--progress": `${clampPercent(percent) * 3.6}deg` } as CSSProperties;
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    weekday: "short",
  }).format(date);
}

export default async function ScriptsPage() {
  const user = await requireRole([Role.ADMIN, Role.DIRECTOR]);
  const where = user.role === Role.ADMIN ? {} : { authorId: user.id };
  const [scripts, directors] = await Promise.all([
    prisma.script.findMany({
      where,
      include: { author: true, videos: true },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.user.findMany({
      where: { role: Role.DIRECTOR, status: "ACTIVE" },
      include: { dailyTargets: { orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }], take: 1 } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const todayStart = startOfShanghaiDay();
  const todayEnd = endOfShanghaiDay();
  const todayScripts = scripts.filter((script) => script.createdAt >= todayStart && script.createdAt < todayEnd).length;
  const todayChineseScripts = scripts.filter(
    (script) => script.createdAt >= todayStart && script.createdAt < todayEnd && script.category !== ScriptCategory.FEMALE,
  ).length;
  const todayFemaleScripts = scripts.filter(
    (script) => script.createdAt >= todayStart && script.createdAt < todayEnd && script.category === ScriptCategory.FEMALE,
  ).length;
  const traditionalCount = scripts.filter((script) => script.category === ScriptCategory.TRADITIONAL).length;
  const assistCount = scripts.filter((script) => script.category === ScriptCategory.ASSIST).length;
  const femaleCount = scripts.filter((script) => script.category === ScriptCategory.FEMALE).length;
  const videoTaskCount = scripts.reduce((sum, script) => sum + script.videos.length, 0);
  const visibleDirectors = user.role === Role.ADMIN ? directors : directors.filter((director) => director.id === user.id);
  const dailyTarget = visibleDirectors.reduce(
    (sum, director) => {
      const target = director.dailyTargets[0];
      return {
        chinese: sum.chinese + (target?.chineseParentingScripts || 0),
        female: sum.female + (target?.femaleScripts || 0),
      };
    },
    { chinese: 0, female: 0 },
  );
  const totalScriptTarget = dailyTarget.chinese + dailyTarget.female;
  const todayProgress = totalScriptTarget ? clampPercent((todayScripts / totalScriptTarget) * 100) : 0;
  const chineseProgress = dailyTarget.chinese ? (todayChineseScripts / dailyTarget.chinese) * 100 : 0;
  const femaleProgress = dailyTarget.female ? (todayFemaleScripts / dailyTarget.female) * 100 : 0;
  const allVideos = scripts.flatMap((script) => script.videos);
  const weekStart = todayStart;
  const weekEnd = new Date(weekStart.getTime() + 7 * DAY_MS);
  const plannedVideos = allVideos.filter((video) => video.plannedPublishDate);
  const upcomingVideos = plannedVideos.filter(
    (video) => video.plannedPublishDate && video.plannedPublishDate >= weekStart && video.plannedPublishDate < weekEnd,
  );
  const furthestPlannedVideo = plannedVideos.reduce<(typeof plannedVideos)[number] | null>((latest, video) => {
    if (!video.plannedPublishDate) return latest;
    if (!latest?.plannedPublishDate) return video;
    return video.plannedPublishDate > latest.plannedPublishDate ? video : latest;
  }, null);
  const pendingScheduleCount = allVideos.filter((video) => !video.plannedPublishDate).length;
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart.getTime() + index * DAY_MS);
    const nextDate = new Date(date.getTime() + DAY_MS);
    const count = upcomingVideos.filter(
      (video) => video.plannedPublishDate && video.plannedPublishDate >= date && video.plannedPublishDate < nextDate,
    ).length;
    return { count, date };
  });

  return (
    <AppShell user={user} active="scripts" title="脚本库" subtitle="文案入库后，会成为下达视频任务的素材源。">
      <section className="script-library-frame">
        <aside className="script-side-rail script-progress-rail" aria-label="今日进度">
          <div className="script-rail-card">
            <span className="script-rail-kicker">Today Signal</span>
            <h2>今日进度</h2>
            <div className="script-progress-ring" style={ringStyle(todayProgress)}>
              <strong>{todayProgress}%</strong>
            </div>
            <p>{user.role === Role.ADMIN ? "全员今日脚本目标" : "个人今日脚本目标"}</p>
            <div className="script-rail-meters">
              <div>
                <span>中式育儿</span>
                <b>{todayChineseScripts}/{dailyTarget.chinese || 0}</b>
                <i style={meterStyle(chineseProgress)} />
              </div>
              <div>
                <span>女性脚本</span>
                <b>{todayFemaleScripts}/{dailyTarget.female || 0}</b>
                <i style={meterStyle(femaleProgress)} />
              </div>
            </div>
          </div>
        </aside>

        <section className="script-library">
          <header className="script-library-header">
            <div>
              <span className="script-kicker">Script Assets</span>
              <h1>脚本资产库</h1>
              <p>集中管理每日文案、内容类别和已下发视频数量，方便编导从脚本到剪辑流转。</p>
            </div>
            <Modal trigger="新增脚本" title="新增脚本" subtitle="填写标题、类别和正文后进入脚本库。">
              <form action={createScriptAction} className="glass-form script-form">
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
                  <span>标题</span>
                  <input name="title" required placeholder="例如：老人总说孩子不能抱太多" />
                </label>
                <label className="field">
                  <span>类别</span>
                  <select name="category" defaultValue={ScriptCategory.TRADITIONAL}>
                    <option value={ScriptCategory.TRADITIONAL}>传统</option>
                    <option value={ScriptCategory.ASSIST}>协助</option>
                    <option value={ScriptCategory.FEMALE}>女性</option>
                  </select>
                </label>
                <label className="field">
                  <span>正文</span>
                  <textarea name="body" required placeholder="写入完整脚本正文或大纲。" />
                </label>
                <button className="primary-action" type="submit">保存到脚本库</button>
              </form>
            </Modal>
          </header>

          <div className="script-summary-grid">
            <article className="script-summary-card">
              <span>脚本总数</span>
              <strong>{scripts.length}</strong>
              <p>当前可见范围</p>
            </article>
            <article className="script-summary-card">
              <span>今日入库</span>
              <strong>{todayScripts}</strong>
              <p>{formatDate(todayStart)}</p>
            </article>
            <article className="script-summary-card">
              <span>中式育儿</span>
              <strong>{traditionalCount + assistCount}</strong>
              <p>传统 {traditionalCount} · 协助 {assistCount}</p>
            </article>
            <article className="script-summary-card">
              <span>视频流转</span>
              <strong>{videoTaskCount}</strong>
              <p>已从脚本下发的视频任务</p>
            </article>
          </div>

          <section className="script-board">
            <div className="script-board-head">
              <div>
                <span>Recent 80</span>
                <h2>最近脚本</h2>
              </div>
              <p>女性脚本 {femaleCount} 条</p>
            </div>

            {scripts.length ? (
              <div className="script-card-grid">
                {scripts.map((script) => {
                  const meta = categoryMeta[script.category];
                  return (
                    <ScriptCardDialog
                      categoryMeta={meta}
                      excerpt={scriptExcerpt(script.body)}
                      key={script.id}
                      script={{
                        id: script.id,
                        title: script.title,
                        body: script.body,
                        category: script.category,
                        authorName: script.author.name,
                        createdAt: formatDate(script.createdAt),
                        videoCount: script.videos.length,
                      }}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="script-empty-state">
                <strong>还没有入库脚本</strong>
                <p>点击右上角新增脚本，先把今天的标题和正文沉淀到脚本库。</p>
              </div>
            )}
          </section>
        </section>

        <aside className="script-side-rail script-calendar-rail" aria-label="接下来一周发布日历">
          <div className="script-rail-card">
            <span className="script-rail-kicker">Next 7 Days</span>
            <h2>发布日历</h2>
            <div className="script-plan-praise">
              <strong>
                {furthestPlannedVideo?.plannedPublishDate
                  ? `已规划到 ${formatDate(furthestPlannedVideo.plannedPublishDate)} ${furthestPlannedVideo.publishTime || "时间待定"}，真棒`
                  : "还没有发布排期"}
              </strong>
              <p>{upcomingVideos.length ? `未来一周已有 ${upcomingVideos.length} 条内容排上节奏。` : "先把可发布内容排进来，节奏会更稳。"}</p>
            </div>
            <div className="script-week-list">
              {weekDays.map((day) => (
                <div className="script-week-day" data-active={day.count > 0 ? "true" : "false"} key={day.date.toISOString()}>
                  <span>{formatWeekday(day.date)}</span>
                  <b>{formatDate(day.date)}</b>
                  <em>{day.count ? `${day.count} 条` : "待排"}</em>
                </div>
              ))}
            </div>
            <div className="script-pending-plan">
              <span>待安排</span>
              <strong>{pendingScheduleCount}</strong>
              <p>暂无计划发布日期的视频</p>
            </div>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
