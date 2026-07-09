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
      <header className="login-topbar" aria-label="登录页导航">
        <p className="login-brand-name">母婴事业部</p>
        <a className="login-official-site" href="https://ihmzoectzzq0.meoo.fun/" target="_blank" rel="noreferrer">
          进入【蒸蒸爸】官网
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
            <h1>Create Account</h1>

            <form action="/api/auth/login" className="login-form" method="post">
              <label className="login-field">
                <input name="email" type="text" placeholder="Email" autoComplete="username" required />
              </label>

              <label className="login-field login-password-field">
                <input name="password" type="password" placeholder="Password" autoComplete="current-password" required />
                <span className="login-eye" aria-hidden="true">⌕</span>
              </label>

              {params.error ? <p className="form-error">The account or password is incorrect.</p> : null}

              <button className="login-submit" type="submit">Register</button>
              <button className="login-contact" type="button">Back</button>

              <div className="login-consents">
                <label className="login-consent">
                  <input type="checkbox" name="offers" />
                  <span>I&apos;d like to receive exclusive offers and updates by email. I understand I can contact the administrator to unsubscribe at anytime.</span>
                </label>
                <label className="login-consent">
                  <input type="checkbox" name="terms" />
                  <span>
                    I agree to the <a href="mailto:admin@example.com">Terms &amp; Conditions</a> and acknowledge that I have read the <a href="mailto:admin@example.com">Privacy Policy</a>.
                  </span>
                </label>
              </div>
            </form>
          </div>
        </section>
      </section>
    </main>
  );
}
