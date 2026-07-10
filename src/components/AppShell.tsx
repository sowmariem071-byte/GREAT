import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { Role } from "@prisma/client";
import { readNotificationAction } from "@/app/actions";
import { formatDateTime } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

type ShellUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  themePreference: {
    accent: string;
    accent2: string;
    accent3: string;
  } | null;
};

const roleTheme: Record<Role, "admin" | "director" | "editor"> = {
  ADMIN: "admin",
  DIRECTOR: "director",
  EDITOR: "editor",
};

const navItems = [
  { href: "/dashboard", key: "dashboard", label: "首页", icon: "⌂", roles: [Role.ADMIN, Role.DIRECTOR, Role.EDITOR] },
  { href: "/scripts", key: "scripts", label: "脚本", icon: "□", roles: [Role.ADMIN, Role.DIRECTOR] },
  { href: "/videos", key: "videos", label: "视频", icon: "▷", roles: [Role.ADMIN, Role.DIRECTOR] },
  { href: "/editing", key: "editing", label: "剪辑", icon: "✂", roles: [Role.ADMIN, Role.EDITOR] },
  { href: "/review", key: "review", label: "审核", icon: "✓", roles: [Role.ADMIN, Role.DIRECTOR] },
  { href: "/schedule", key: "schedule", label: "排期", icon: "◇", roles: [Role.ADMIN, Role.DIRECTOR] },
  { href: "/inventory", key: "inventory", label: "库存", icon: "▣", roles: [Role.ADMIN, Role.DIRECTOR] },
  { href: "/people", key: "people", label: "人员", icon: "◎", roles: [Role.ADMIN] },
];

function themeVars(user: ShellUser) {
  const preference = user.themePreference;
  if (!preference) return undefined;
  return {
    "--accent": preference.accent,
    "--accent-2": preference.accent2,
    "--accent-3": preference.accent3,
  } as CSSProperties;
}

export async function AppShell({
  user,
  active,
  title,
  subtitle,
  children,
}: {
  user: ShellUser;
  active: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id, readAt: null },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const visibleNav = navItems.filter((item) => item.roles.includes(user.role));
  return (
    <>
      <div className="ambient ambient-one"></div>
      <div className="ambient ambient-two"></div>
      <div className="ambient ambient-three"></div>
      <main className="app-shell" data-theme={roleTheme[user.role]} style={themeVars(user)}>
        <aside className="side-nav" aria-label="主导航">
          <nav className="nav-items">
            {visibleNav.map((item) => (
              <Link className={`nav-item ${active === item.key ? "active" : ""}`} href={item.href} key={item.key} prefetch={false}>
                <span>{item.icon}</span>
                <small>{item.label}</small>
              </Link>
            ))}
          </nav>
          <Link className={`nav-item muted ${active === "settings" ? "active" : ""}`} href="/settings" prefetch={false}>
            <span>⚙</span>
            <small>设置</small>
          </Link>
        </aside>

        <section className="content-pane">
          <div className="app-brand-title">母婴事业部</div>
          <header className="topbar">
            <div>
              <p className="eyebrow">Content Calendar Studio</p>
              <h1>{title}</h1>
              <p className="top-subtitle">{subtitle}</p>
            </div>
          </header>

          {notifications.length > 0 ? (
            <section className="notice-strip">
              {notifications.map((notification) => (
                <form action={readNotificationAction} className="notice-item" key={notification.id}>
                  <input type="hidden" name="notificationId" value={notification.id} />
                  <div>
                    <strong>{notification.title}</strong>
                    <span>{notification.message} · {formatDateTime(notification.createdAt)}</span>
                  </div>
                  <button type="submit">已读</button>
                </form>
              ))}
            </section>
          ) : null}

          {children}
        </section>
      </main>
    </>
  );
}
