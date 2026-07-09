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
      <div className="ambient ambient-one"></div>
      <div className="ambient ambient-two"></div>
      <main className="auth-shell">
        <section className="auth-card">
          <p className="eyebrow">Content Calendar Studio</p>
          <h1>内容排期管理系统</h1>
          <p className="auth-copy">从脚本到库存，把每天的产出和风险放在一个轻盈的工作台里。</p>

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

        <aside className="auth-card auth-demo">
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
        </aside>
      </main>
    </>
  );
}
