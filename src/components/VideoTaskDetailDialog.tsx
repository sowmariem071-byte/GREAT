"use client";

import { type KeyboardEvent, type MouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { ReviewDecision, VideoStatus } from "@prisma/client";
import { submitReviewAction } from "@/app/actions";
import { StatusPill } from "@/components/StatusPill";

type VideoTaskDetailDialogProps = {
  task: {
    id: string;
    title: string;
    scriptBody: string;
    scriptCategoryLabel: string;
    scriptCreatedAt: string;
    status: VideoStatus;
    tone: string;
    notes: string;
    materialUrl: string;
    videoUrl: string | null;
    directorName: string;
    editorName: string;
    duration: string;
    createdAt: string;
    plannedDeliveryAt: string;
    plannedPublishDate: string;
    publishTime: string;
    deliveredAt: string;
    approvedAt: string;
    publishedAt: string;
  };
  typeLabel: string;
  statusLabel: string;
  allowReviewAction?: boolean;
  cardClassName?: string;
  triggerAsButton?: boolean;
  children: ReactNode;
};

export function VideoTaskDetailDialog({
  task,
  typeLabel,
  statusLabel,
  allowReviewAction = true,
  cardClassName = "video-task-card",
  triggerAsButton = false,
  children,
}: VideoTaskDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scriptCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isScriptDialogOpen, setIsScriptDialogOpen] = useState(false);
  const [isScriptDialogVisible, setIsScriptDialogVisible] = useState(false);
  const canOpenReview = allowReviewAction && task.status === VideoStatus.PENDING_REVIEW;
  const publishedHref = task.status === VideoStatus.PUBLISHED ? "/schedule#published" : null;
  const interactiveSelector = "a, button, input, textarea, select, label, dialog, [data-detail-ignore]";

  const openDialog = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    if (!dialog.open) {
      dialog.showModal();
    }
    requestAnimationFrame(() => setIsVisible(true));
  };

  const closeDialog = () => {
    setIsVisible(false);
    setIsReviewOpen(false);
    setIsScriptDialogVisible(false);
    setIsScriptDialogOpen(false);
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    if (scriptCloseTimerRef.current) {
      clearTimeout(scriptCloseTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      dialogRef.current?.close();
    }, 240);
  };

  const openDialogFromKeyboard = (event: KeyboardEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest(interactiveSelector)) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDialog();
    }
  };

  const openDialogFromPointer = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest(interactiveSelector)) {
      return;
    }
    openDialog();
  };

  const keepLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  };

  const openReviewPanel = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsReviewOpen(true);
  };

  const closeReviewPanel = () => {
    setIsReviewOpen(false);
  };

  const openScriptDialog = () => {
    if (scriptCloseTimerRef.current) {
      clearTimeout(scriptCloseTimerRef.current);
    }
    setIsScriptDialogOpen(true);
    requestAnimationFrame(() => setIsScriptDialogVisible(true));
  };

  const closeScriptDialog = () => {
    setIsScriptDialogVisible(false);
    if (scriptCloseTimerRef.current) {
      clearTimeout(scriptCloseTimerRef.current);
    }
    scriptCloseTimerRef.current = setTimeout(() => {
      setIsScriptDialogOpen(false);
    }, 220);
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      if (scriptCloseTimerRef.current) {
        clearTimeout(scriptCloseTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      {triggerAsButton ? (
        <button
          aria-label={`查看视频任务详情：${task.title}`}
          className={cardClassName}
          data-tone={task.tone}
          onClick={openDialog}
          type="button"
        >
          {children}
          <span className="video-card-open-hint" aria-hidden="true">查看详情</span>
        </button>
      ) : (
        <article
          aria-label={`查看视频任务详情：${task.title}`}
          className={cardClassName}
          data-tone={task.tone}
          onClick={openDialogFromPointer}
          onKeyDown={openDialogFromKeyboard}
          role="button"
          tabIndex={0}
        >
          {children}
          <span className="video-card-open-hint" aria-hidden="true">查看详情</span>
        </article>
      )}

      <dialog
        className={`script-detail-dialog video-detail-dialog${isVisible ? " is-visible" : ""}`}
        ref={dialogRef}
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeDialog();
          }
        }}
      >
        <section className="script-detail-card video-detail-card">
          <header className="script-detail-head video-detail-head">
            <div>
              <span>Video Task Detail</span>
              <h2>{task.title}</h2>
              <p>{typeLabel} · {task.directorName} / {task.editorName}</p>
            </div>
            <button className="modal-close" type="button" aria-label="关闭弹窗" onClick={closeDialog}>x</button>
          </header>

          <div className="video-detail-body">
            <div className="video-detail-status-row">
              {publishedHref ? (
                <a
                  aria-label="查看已发布日历规划池"
                  className="video-status-action"
                  href={publishedHref}
                  onClick={keepLinkClick}
                >
                  <StatusPill status={task.status} />
                </a>
              ) : canOpenReview ? (
                <button
                  aria-expanded={isReviewOpen}
                  aria-label="打开审核建议填写窗口"
                  className="video-status-action"
                  type="button"
                  onClick={openReviewPanel}
                >
                  <StatusPill status={task.status} />
                </button>
              ) : (
                <StatusPill status={task.status} />
              )}
              <span>{statusLabel}</span>
              <b>{task.duration}</b>
            </div>

            {isReviewOpen ? (
              <section className="video-review-popover" aria-label="审核建议填写窗口">
                <div className="video-review-popover-head">
                  <div>
                    <span>Review Note</span>
                    <h3>填写审核建议</h3>
                    <p>提交后会进入审核历史；如选择需要修改，任务会回到剪辑侧。</p>
                  </div>
                  <button type="button" aria-label="关闭审核建议窗口" onClick={closeReviewPanel}>x</button>
                </div>
                <form action={submitReviewAction} className="glass-form video-review-form">
                  <input type="hidden" name="videoTaskId" value={task.id} />
                  <label className="field">
                    <span>审核视频链接</span>
                    <input name="videoUrl" required defaultValue={task.videoUrl || ""} placeholder="https://..." />
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
              </section>
            ) : null}

            <div className="video-detail-grid">
              <div>
                <span>编导</span>
                <strong>{task.directorName}</strong>
              </div>
              <div>
                <span>剪辑</span>
                <strong>{task.editorName || "未分配"}</strong>
              </div>
              <div>
                <span>创建日期</span>
                <strong>{task.createdAt}</strong>
              </div>
              <div>
                <span>计划交付</span>
                <strong>{task.plannedDeliveryAt}</strong>
              </div>
              <div>
                <span>计划发布</span>
                <strong>{task.plannedPublishDate}</strong>
              </div>
              <div>
                <span>发布时间</span>
                <strong>{task.publishTime || "未定"}</strong>
              </div>
              <div>
                <span>交付时间</span>
                <strong>{task.deliveredAt}</strong>
              </div>
              <div>
                <span>审核通过</span>
                <strong>{task.approvedAt}</strong>
              </div>
              <div>
                <span>已发布时间</span>
                <strong>{task.publishedAt}</strong>
              </div>
            </div>

            <section className="video-detail-section">
              <div className="video-detail-section-head">
                <h3>任务说明</h3>
                <button className="video-detail-soft-action" type="button" onClick={openScriptDialog}>查看脚本详情</button>
              </div>
              <p>{task.notes}</p>
            </section>

            <section className="video-detail-section">
              <div className="video-detail-section-head">
                <h3>素材链接</h3>
                <a href={task.materialUrl} rel="noreferrer" target="_blank" onClick={keepLinkClick}>打开素材链接</a>
              </div>
              <p>{task.materialUrl}</p>
            </section>

            <section className="video-detail-section">
              <div className="video-detail-section-head">
                <h3>成片链接</h3>
                {task.videoUrl ? (
                  <a href={task.videoUrl} rel="noreferrer" target="_blank" onClick={keepLinkClick}>打开视频链接</a>
                ) : null}
              </div>
              <p>{task.videoUrl || "剪辑暂未提交视频链接。"}</p>
            </section>
          </div>

          {isScriptDialogOpen ? (
            <div
              className={`video-bound-script-layer${isScriptDialogVisible ? " is-visible" : ""}`}
              onClick={closeScriptDialog}
            >
              <section
                aria-label="绑定脚本详情"
                aria-modal="true"
                className="video-bound-script-dialog"
                role="dialog"
                onClick={(event) => event.stopPropagation()}
              >
                <header className="video-bound-script-head">
                  <div>
                    <span>Bound Script</span>
                    <h3>{task.title}</h3>
                    <p>{typeLabel} · 入库 {task.scriptCreatedAt}</p>
                  </div>
                  <button className="modal-close" type="button" aria-label="关闭脚本详情窗口" onClick={closeScriptDialog}>x</button>
                </header>
                <div className="video-bound-script-meta">
                  <span>{task.scriptCategoryLabel}</span>
                  <span>{typeLabel}</span>
                  <span>视频任务绑定脚本</span>
                </div>
                <article className="video-bound-script-body">
                  <h4>脚本正文</h4>
                  <p>{task.scriptBody}</p>
                </article>
              </section>
            </div>
          ) : null}
        </section>
      </dialog>
    </>
  );
}
