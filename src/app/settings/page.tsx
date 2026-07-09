import type { CSSProperties } from "react";
import { updateAvatarAction, updateThemeAction } from "@/app/actions";
import { AppShell } from "@/components/AppShell";
import { Modal } from "@/components/Modal";
import { requireUser } from "@/lib/auth";
import { roleLabel } from "@/lib/labels";

export const dynamic = "force-dynamic";

const presets = [
  { name: "赤陶焦糖", accent: "#B85C45", accent2: "#D49A62", accent3: "#F1D7BD" },
  { name: "薄荷玻璃", accent: "#6FB7A8", accent2: "#B7DFC8", accent3: "#E4F0E8" },
  { name: "雾蓝冷感", accent: "#6F92A8", accent2: "#A9C5D2", accent3: "#DDE8ED" },
  { name: "粉紫创作", accent: "#B47A8D", accent2: "#D9A7B6", accent3: "#E9DCEF" },
];

function themeStyle(theme: { accent: string; accent2: string; accent3: string }) {
  return {
    "--preview-a": theme.accent,
    "--preview-b": theme.accent2,
    "--preview-c": theme.accent3,
  } as CSSProperties;
}

export default async function SettingsPage() {
  const user = await requireUser();
  const preference = user.themePreference;
  const activeTheme = preference
    ? { name: preference.presetName, accent: preference.accent, accent2: preference.accent2, accent3: preference.accent3 }
    : presets[0];
  const avatarInitial = user.name.slice(0, 1);

  return (
    <AppShell user={user} active="settings" title="个人设置" subtitle="自定义头像和界面配色，让主页更像自己的工作空间。">
      <section className="settings-workspace">
        <header className="settings-hero">
          <div>
            <span className="settings-kicker">PERSONAL SPACE</span>
            <h1>个人设置</h1>
            <p>调整头像和点缀色，让系统保持统一高级感的同时，也有一点属于自己的工作空间气息。</p>
          </div>
          <article className="settings-profile-card">
            <div className="settings-profile-avatar">
              {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} /> : avatarInitial}
            </div>
            <div>
              <span>{roleLabel[user.role]} · 个人空间</span>
              <strong>{user.name}</strong>
              <p>{user.email}</p>
            </div>
            <div className="settings-profile-actions">
              <Modal
                trigger="修改头像"
                title="修改头像"
                subtitle="可上传文件到对象存储，也可以先填写头像 URL。"
                triggerClassName="settings-avatar-action"
              >
                <form action={updateAvatarAction} className="glass-form">
                  <label className="field">
                    <span>上传头像</span>
                    <input name="avatar" type="file" accept="image/*" />
                  </label>
                  <label className="field">
                    <span>或填写头像 URL</span>
                    <input name="avatarUrl" type="url" defaultValue={user.avatarUrl || ""} placeholder="https://..." />
                  </label>
                  <p className="muted-text">文件上传会使用 S3 兼容对象存储；未配置对象存储时，可先使用头像 URL。</p>
                  <button className="primary-action" type="submit">保存头像</button>
                </form>
              </Modal>
              <form action="/api/auth/logout" method="post">
                <button className="ghost-action compact-button" type="submit">退出登录</button>
              </form>
            </div>
          </article>
        </header>

        <section className="settings-main-grid">
          <article className="settings-theme-panel">
            <div className="settings-panel-head">
              <div>
                <span>Theme Board</span>
                <h2>配色设置</h2>
                <p>只调整点缀色，背景、文字和卡片质感保持系统统一，避免每个人的页面变成完全不同的网站。</p>
              </div>
              <Modal trigger="自定义配色" title="自定义配色" subtitle="只调整点缀色，正文颜色保持深灰黑以保证可读性。">
                <form action={updateThemeAction} className="glass-form">
                  <input type="hidden" name="presetName" value="自定义主题" />
                  <div className="color-grid">
                    <label>
                      <span>主色</span>
                      <input name="accent" type="color" defaultValue={activeTheme.accent} />
                    </label>
                    <label>
                      <span>辅助色</span>
                      <input name="accent2" type="color" defaultValue={activeTheme.accent2} />
                    </label>
                    <label>
                      <span>柔和底色</span>
                      <input name="accent3" type="color" defaultValue={activeTheme.accent3} />
                    </label>
                  </div>
                  <button className="primary-action" type="submit">保存自定义配色</button>
                </form>
              </Modal>
            </div>

            <div className="settings-theme-preview" style={themeStyle(activeTheme)}>
              <div>
                <span>Live Preview</span>
                <strong>{activeTheme.name}</strong>
                <p>按钮、标签、进度条会使用你的个人点缀色。</p>
              </div>
              <div className="settings-preview-card">
                <i></i>
                <b>今日工作台</b>
                <em>Queue</em>
              </div>
              <div className="settings-preview-line">
                <span></span>
              </div>
            </div>

            <div className="settings-preset-grid">
              {presets.map((preset) => (
                <form action={updateThemeAction} className="settings-preset-card" key={preset.name}>
                  <input type="hidden" name="presetName" value={preset.name} />
                  <input type="hidden" name="accent" value={preset.accent} />
                  <input type="hidden" name="accent2" value={preset.accent2} />
                  <input type="hidden" name="accent3" value={preset.accent3} />
                  <span className="settings-preset-swatch" style={themeStyle(preset)}>
                    <i></i>
                    <i></i>
                    <i></i>
                  </span>
                  <div>
                    <strong>{preset.name}</strong>
                    <p>{activeTheme.name === preset.name ? "当前使用" : "点击应用"}</p>
                  </div>
                  <button type="submit">应用</button>
                </form>
              ))}
            </div>
          </article>
        </section>
      </section>
    </AppShell>
  );
}
