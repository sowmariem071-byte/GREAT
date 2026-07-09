import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const demoUsers = [
  ["龚锐", "gr", "管理员"],
  ["胡欣怡", "hxy", "编导"],
  ["王煊", "wx", "编导"],
  ["单萱萱", "sxx", "编导"],
  ["贺玲玥", "hly", "剪辑"],
  ["黄炜琪", "hwq", "剪辑"],
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const params = await searchParams;

  return (
    <>
      <div className="login-stage" aria-hidden="true">
        <div className="login-grid"></div>
        <div className="login-orb login-orb-one"></div>
        <div className="login-orb login-orb-two"></div>
        <div className="login-beam login-beam-one"></div>
        <div className="login-beam login-beam-two"></div>
        <span className="login-pulse login-pulse-one"></span>
        <span className="login-pulse login-pulse-two"></span>
        <span className="login-pulse login-pulse-three"></span>
      </div>

      <main className="auth-shell auth-shell-tech">
        <section className="auth-card auth-login-card">
          <div className="auth-brand-row">
            <span className="auth-brand-mark">排</span>
            <div>
              <p className="eyebrow">Content Calendar Studio</p>
              <h1>内容排期管理系统</h1>
            </div>
          </div>
          <p className="auth-copy">脚本、剪辑、审核、库存，进入同一个轻盈工作台。</p>

          <div className="auth-signal-row" aria-label="系统状态">
            <span>脚本库</span>
            <span>剪辑流转</span>
            <span>发布库存</span>
          </div>

          <form action="/api/auth/login" className="glass-form" method="post">
            <label className="field">
              <span>账号</span>
              <input name="email" type="text" defaultValue="gr" autoComplete="username" required />
            </label>
            <label className="field">
              <span>密码</span>
              <input name="password" type="password" defaultValue="zzb888" autoComplete="current-password" required />
            </label>
            {params.error ? <p className="form-error">账号、密码或用户状态不正确。</p> : null}
            <button className="primary-action" type="submit">登录工作台</button>
          </form>
        </section>

        <aside className="auth-visual-panel">
          <div className="login-orbit-card" aria-hidden="true">
            <div className="orbit-ring orbit-ring-one"></div>
            <div className="orbit-ring orbit-ring-two"></div>
            <div className="orbit-ring orbit-ring-three"></div>
            <div className="orbit-core">
              <span>Content Flow</span>
              <strong>Live</strong>
            </div>
            <div className="orbit-chip orbit-chip-one">脚本信号</div>
            <div className="orbit-chip orbit-chip-two">审核队列</div>
            <div className="orbit-chip orbit-chip-three">库存池</div>
          </div>

          <div className="auth-card auth-demo">
            <div className="panel-title">
              <h3>种子账号</h3>
              <span>默认密码 zzb888</span>
            </div>
            <div className="demo-list">
              {demoUsers.map(([name, account, role]) => (
                <div className="demo-user" key={account}>
                  <span>{name.slice(0, 1)}</span>
                  <div>
                    <strong>{name} · {role}</strong>
                    <small>{account}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </>
  );
}
