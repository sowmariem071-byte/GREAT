"use client";

import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { ScriptCategory } from "@prisma/client";
import { updateScriptAction } from "@/app/actions";

type ScriptCardDialogProps = {
  script: {
    id: string;
    title: string;
    body: string;
    category: ScriptCategory;
    authorName: string;
    createdAt: string;
    videoCount: number;
  };
  categoryMeta: {
    label: string;
    group: string;
    tone: string;
  };
  excerpt: string;
};

export function ScriptCardDialog({ script, categoryMeta, excerpt }: ScriptCardDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isVisible, setIsVisible] = useState(false);
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
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      dialogRef.current?.close();
    }, 240);
  };
  const openDialogFromKeyboard = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDialog();
    }
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      <article
        className="script-asset-card"
        onClick={openDialog}
        onKeyDown={openDialogFromKeyboard}
        role="button"
        tabIndex={0}
      >
        <div className="script-card-top">
          <span data-tone={categoryMeta.tone}>{categoryMeta.label}</span>
          <small>{categoryMeta.group}</small>
        </div>
        <h3>{script.title}</h3>
        <p>{excerpt}</p>
        <div className="script-card-meta">
          <span>{script.authorName}</span>
          <span>{script.createdAt}</span>
          <b>{script.videoCount} 个视频</b>
        </div>
      </article>

      <dialog
        className={`script-detail-dialog${isVisible ? " is-visible" : ""}`}
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
        <section className="script-detail-card">
          <header className="script-detail-head">
            <div>
              <span>脚本详情</span>
              <h2>{script.title}</h2>
              <p>{script.authorName} · {script.createdAt} · 已下发 {script.videoCount} 个视频</p>
            </div>
            <button className="modal-close" type="button" aria-label="关闭弹窗" onClick={closeDialog}>x</button>
          </header>

          <form action={updateScriptAction} className="script-detail-form">
            <input name="scriptId" type="hidden" value={script.id} />
            <div className="script-detail-grid">
              <label className="field">
                <span>标题</span>
                <input name="title" required defaultValue={script.title} />
              </label>
              <label className="field">
                <span>类别</span>
                <select name="category" defaultValue={script.category}>
                  <option value={ScriptCategory.TRADITIONAL}>传统</option>
                  <option value={ScriptCategory.ASSIST}>协助</option>
                  <option value={ScriptCategory.FEMALE}>女性</option>
                </select>
              </label>
            </div>
            <label className="field">
              <span>正文</span>
              <textarea name="body" required defaultValue={script.body} />
            </label>
            <footer className="script-detail-actions">
              <button className="ghost-action" type="button" onClick={closeDialog}>取消</button>
              <button className="primary-action" type="submit">保存修改</button>
            </footer>
          </form>
        </section>
      </dialog>
    </>
  );
}
