import { ReviewDecision, Role, VideoStatus } from "@prisma/client";
import { submitReviewAction } from "@/app/actions";
import { AppShell } from "@/components/AppShell";
import { Modal } from "@/components/Modal";
import { StatusPill } from "@/components/StatusPill";
import { requireRole } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/dates";
import { videoTypeLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ReviewPageProps = {
  searchParams: Promise<{ status?: string }>;
};

function reviewStatusParam(value?: string) {
  return value === VideoStatus.NEEDS_REVISION ? VideoStatus.NEEDS_REVISION : VideoStatus.PENDING_REVIEW;
}

function attachmentText(count: number) {
  return count > 0 ? `截图 ${count} 张` : "无截图";
}

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const user = await requireRole([Role.ADMIN, Role.DIRECTOR]);
  const params = await searchParams;
  const activeStatus = reviewStatusParam(params.status);
  const scopeWhere = user.role === Role.ADMIN ? {} : { directorId: user.id };

  const [pending, revisionTasks, history] = await Promise.all([
    prisma.videoTask.findMany({
      where: { ...scopeWhere, status: VideoStatus.PENDING_REVIEW },
      orderBy: [{ deliveredAt: "asc" }, { updatedAt: "desc" }],
      include: {
        director: true,
        editor: true,
        script: true,
        reviews: {
          orderBy: { roundNumber: "desc" },
          take: 5,
          include: { attachments: true, createdBy: true },
        },
      },
    }),
    prisma.videoTask.findMany({
      where: { ...scopeWhere, status: VideoStatus.NEEDS_REVISION },
      orderBy: [{ updatedAt: "desc" }],
      include: {
        director: true,
        editor: true,
        script: true,
        reviews: {
          orderBy: { roundNumber: "desc" },
          take: 5,
          include: { attachments: true, createdBy: true },
        },
      },
    }),
    prisma.reviewRound.findMany({
      where: user.role === Role.ADMIN ? {} : { videoTask: { directorId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        attachments: true,
        createdBy: true,
        videoTask: { include: { director: true, editor: true, script: true } },
      },
    }),
  ]);

  const visibleQueue = activeStatus === VideoStatus.NEEDS_REVISION ? revisionTasks : pending;
  const approved = history.filter((round) => round.decision === ReviewDecision.APPROVED).length;
  const revisions = history.filter((round) => round.decision === ReviewDecision.NEEDS_REVISION).length;
  const completion = history.length ? Math.round((approved / history.length) * 100) : 0;
  const listTitle = activeStatus === VideoStatus.PENDING_REVIEW ? "待审核视频列表" : "需修改视频列表";
  const listEyebrow = activeStatus === VideoStatus.PENDING_REVIEW ? "Pending Videos" : "Revision Videos";

  return (
    <AppShell user={user} active="review" title="审核中心" subtitle="以标题列表快速扫片，点开后再处理完整审核详情。">
      <section className="review-workspace">
        <header className="review-hero">
          <div>
            <span className="review-kicker">REVIEW SIGNAL</span>
            <h1>审核中心</h1>
            <p>页面只保留视频标题列表，方便视频数量多时快速浏览；点击标题后，在弹窗里查看详情并提交审核建议。</p>
          </div>
          <article className="review-score-card">
            <span>近期通过率</span>
            <strong>{completion}%</strong>
            <p>{approved}/{history.length || 0} 轮通过</p>
          </article>
        </header>

        <section className="review-signal-grid" aria-label="审核概览">
          <a className="review-signal-card" data-active={activeStatus === VideoStatus.PENDING_REVIEW} href="/review?status=PENDING_REVIEW">
            <span>待审核</span>
            <strong>{pending.length}</strong>
            <p>剪辑已提交，等待确认</p>
          </a>
          <a className="review-signal-card" data-active={activeStatus === VideoStatus.NEEDS_REVISION} href="/review?status=NEEDS_REVISION">
            <span>需修改</span>
            <strong>{revisionTasks.length}</strong>
            <p>已退回剪辑处理</p>
          </a>
          <article className="review-signal-card">
            <span>近期通过</span>
            <strong>{approved}</strong>
            <p>最近 10 轮审核</p>
          </article>
          <article className="review-signal-card">
            <span>近期退修</span>
            <strong>{revisions}</strong>
            <p>需要回看反馈质量</p>
          </article>
        </section>

        <section className="review-list-panel">
          <div className="review-panel-head">
            <div>
              <span>{listEyebrow}</span>
              <h2>{listTitle}</h2>
              <p>列表只显示视频标题，点开后查看成片、素材、脚本、历史轮次和审核表单。</p>
            </div>
            <b>{visibleQueue.length} 条</b>
          </div>

          <div className="review-title-list">
            {visibleQueue.length ? visibleQueue.map((video) => {
              const latestReview = video.reviews[0];
              return (
                <article className="review-title-item" key={video.id}>
                  <Modal
                    dialogClassName="review-task-dialog"
                    trigger={video.script.title}
                    triggerClassName="review-title-trigger"
                    title={video.script.title}
                    subtitle={`${videoTypeLabel[video.type]} · 编导 ${video.director.name} · 剪辑 ${video.editor.name}`}
                  >
                    <section className="review-task-detail">
                      <div className="review-detail-modal-headline">
                        <div>
                          <span>Current Video</span>
                          <h3>{video.script.title}</h3>
                          <p>{videoTypeLabel[video.type]} · 编导 {video.director.name} · 剪辑 {video.editor.name}</p>
                        </div>
                        <StatusPill status={video.status} />
                      </div>

                      <div className="review-detail-grid">
                        <div>
                          <span>成片链接</span>
                          <strong>{video.videoUrl ? "已提交" : "未提交"}</strong>
                          {video.videoUrl ? <a href={video.videoUrl} rel="noreferrer" target="_blank">打开视频</a> : null}
                        </div>
                        <div>
                          <span>素材链接</span>
                          <strong>素材包</strong>
                          <a href={video.materialUrl} rel="noreferrer" target="_blank">打开素材</a>
                        </div>
                        <div>
                          <span>计划交付</span>
                          <strong>{formatDate(video.plannedDeliveryAt)}</strong>
                        </div>
                        <div>
                          <span>计划发布</span>
                          <strong>{formatDate(video.plannedPublishDate)}</strong>
                        </div>
                        <div>
                          <span>发布时间</span>
                          <strong>{video.publishTime || "未定"}</strong>
                        </div>
                        <div>
                          <span>视频秒数</span>
                          <strong>{video.durationSeconds ? `${video.durationSeconds}s` : "未填"}</strong>
                        </div>
                      </div>

                      <article className="review-script-preview">
                        <div>
                          <span>脚本正文</span>
                          <b>{videoTypeLabel[video.type]}</b>
                        </div>
                        <h3>{video.script.title}</h3>
                        <p>{video.script.body}</p>
                      </article>

                      {latestReview ? (
                        <article className="review-latest-note">
                          <span>上一轮反馈 · 第 {latestReview.roundNumber} 轮 · {attachmentText(latestReview.attachments.length)}</span>
                          <p>{latestReview.comment || "上一轮没有填写文字反馈。"}</p>
                        </article>
                      ) : null}

                      {video.status === VideoStatus.PENDING_REVIEW ? (
                        <article className="review-form-card">
                          <div className="review-panel-head compact">
                            <div>
                              <span>Review Form</span>
                              <h2>填写审核建议</h2>
                            </div>
                          </div>
                          <form action={submitReviewAction} className="glass-form review-action-form">
                            <input type="hidden" name="videoTaskId" value={video.id} />
                            <label className="field">
                              <span>审核视频链接</span>
                              <input name="videoUrl" required defaultValue={video.videoUrl || ""} placeholder="https://..." />
                            </label>
                            <label className="field">
                              <span>审核结论</span>
                              <select name="decision" required defaultValue="">
                                <option value="" disabled>请选择审核结论</option>
                                <option value={ReviewDecision.NEEDS_REVISION}>需要修改</option>
                                <option value={ReviewDecision.APPROVED}>审核通过</option>
                              </select>
                            </label>
                            <label className="field">
                              <span>修改建议 / 通过备注</span>
                              <textarea name="comment" placeholder="写清楚要改的位置、文案、镜头、节奏或封面建议。" />
                            </label>
                            <label className="field">
                              <span>审核截图</span>
                              <input name="attachments" type="file" accept="image/*" multiple />
                            </label>
                            <button className="primary-action" type="submit">提交审核结果</button>
                          </form>
                        </article>
                      ) : (
                        <div className="review-waiting-note">
                          <strong>等待剪辑修改后再次提交</strong>
                          <p>这条视频已经退回剪辑侧，重新提交后会回到待审核队列。</p>
                        </div>
                      )}

                      <section className="review-rounds">
                        <div className="review-panel-head compact">
                          <div>
                            <span>Round History</span>
                            <h2>本视频审核轮次</h2>
                          </div>
                          <b>{video.reviews.length} 轮</b>
                        </div>
                        {video.reviews.length ? video.reviews.map((round) => (
                          <article className="review-round-card" key={round.id}>
                            <div>
                              <strong>第 {round.roundNumber} 轮 · {round.decision === ReviewDecision.APPROVED ? "审核通过" : "需要修改"}</strong>
                              <span>{round.createdBy.name} · {formatDateTime(round.createdAt)} · {attachmentText(round.attachments.length)}</span>
                            </div>
                            {round.comment ? <p>{round.comment}</p> : null}
                          </article>
                        )) : <div className="review-empty-card">暂无历史轮次。</div>}
                      </section>
                    </section>
                  </Modal>
                </article>
              );
            }) : (
              <div className="review-empty-card">
                <strong>{activeStatus === VideoStatus.PENDING_REVIEW ? "暂无待审核视频" : "暂无需修改视频"}</strong>
                <p>{activeStatus === VideoStatus.PENDING_REVIEW ? "剪辑提交后会出现在这里。" : "需要修改的视频会在这里跟踪。"}</p>
              </div>
            )}
          </div>
        </section>

        <section className="review-history-strip">
          <div className="review-panel-head compact">
            <div>
              <span>Recent History</span>
              <h2>最近审核记录</h2>
            </div>
            <b>{history.length} 轮</b>
          </div>
          <div className="review-history-grid">
            {history.length ? history.map((round) => (
              <article className="review-history-card" key={round.id}>
                <div>
                  <span>{round.decision === ReviewDecision.APPROVED ? "通过" : "需修改"}</span>
                  <b>{formatDateTime(round.createdAt)}</b>
                </div>
                <strong>{round.videoTask.script.title}</strong>
                <p>{round.videoTask.director.name} / {round.videoTask.editor.name} · 第 {round.roundNumber} 轮 · {attachmentText(round.attachments.length)}</p>
              </article>
            )) : <div className="review-empty-card">暂无审核记录。</div>}
          </div>
        </section>
      </section>
    </AppShell>
  );
}
