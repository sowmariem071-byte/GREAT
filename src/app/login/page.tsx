import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const params = await searchParams;

  return (
    <main className="login-page">
      <header className="login-topbar">
        <strong>母婴事业部</strong>
        <nav className="login-nav" aria-label="登录页导航">
          <span>内容排期</span>
          <span>脚本资产</span>
          <span>视频流转</span>
          <span>发布库存</span>
        </nav>
        <a className="login-official-link" href="https://ihmzoectzzq0.meoo.fun/" target="_blank" rel="noreferrer">
          进入【蒸蒸爸官网】
        </a>
      </header>

      <section className="login-board" aria-label="内容排期管理系统登录">
        <figure className="login-illustration-card">
          <video
            aria-label="蒸蒸爸与孩子的治愈系春日插画动画"
            autoPlay
            loop
            muted
            playsInline
            poster="/images/cartoon-parenting-character.png"
          >
            <source src="/videos/login-parenting-loop.mp4" type="video/mp4" />
            <img src="/images/cartoon-parenting-character.png" alt="蒸蒸爸与孩子的中式育儿插画" />
          </video>
        </figure>

        <section className="login-form-card">
          <div className="login-form-inner">
            <p className="login-kicker">Content Calendar Studio</p>
            <h1>欢迎登录</h1>
            <p>登录母婴事业部后台，请输入账号信息</p>

            <form action="/api/auth/login" className="login-form" method="post">
              <label className="login-field">
                <span aria-hidden="true">♡</span>
                <input name="email" type="text" placeholder="账号" autoComplete="username" required />
              </label>

              <label className="login-field">
                <span aria-hidden="true">⌘</span>
                <input name="password" type="password" placeholder="密码" autoComplete="current-password" required />
              </label>

              {params.error ? <p className="form-error">账号、密码或用户状态不正确。</p> : null}

              <div className="login-help-row">
                <span></span>
                <a href="mailto:admin@example.com">忘记密码？</a>
              </div>

              <button className="login-submit" type="submit">登录</button>
              <a className="login-contact" href="mailto:admin@example.com">注册 / 联系管理员</a>
            </form>
          </div>
        </section>
      </section>
    </main>
  );
}
