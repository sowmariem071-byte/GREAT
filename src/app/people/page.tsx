import { Role, ScriptCategory, UserStatus, VideoStatus } from "@prisma/client";
import Link from "next/link";
import { createUserAction, toggleUserStatusAction, updateTargetAction } from "@/app/actions";
import { AppShell } from "@/components/AppShell";
import { Modal } from "@/components/Modal";
import { requireRole } from "@/lib/auth";
import { endOfShanghaiDay, startOfShanghaiDay } from "@/lib/dates";
import { roleLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const completedEditingStatuses = [
  VideoStatus.PENDING_REVIEW,
  VideoStatus.APPROVED,
  VideoStatus.READY_TO_PUBLISH,
  VideoStatus.SCHEDULED,
  VideoStatus.PUBLISHED,
  VideoStatus.STOCK,
];

function percent(done: number, target: number) {
  if (target <= 0) return done > 0 ? 100 : 0;
  return Math.min(100, Math.round((done / target) * 100));
}

function progressText(done: number, target: number) {
  if (target <= 0) return `${done}`;
  return `${done}/${target}`;
}

function targetTotal(target?: { chineseParentingScripts: number; femaleScripts: number; editingVideos: number }) {
  if (!target) return 0;
  return target.chineseParentingScripts + target.femaleScripts + target.editingVideos;
}

export default async function PeoplePage() {
  const user = await requireRole([Role.ADMIN]);
  const start = startOfShanghaiDay();
  const end = endOfShanghaiDay();
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    include: { dailyTargets: { orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }], take: 1 } },
  });

  const [scriptGroups, editorDoneGroups, activeEditingGroups] = await Promise.all([
    prisma.script.groupBy({
      by: ["authorId", "category"],
      where: { createdAt: { gte: start, lt: end } },
      _count: true,
    }),
    prisma.videoTask.groupBy({
      by: ["editorId"],
      where: { deliveredAt: { gte: start, lt: end }, status: { in: completedEditingStatuses } },
      _count: true,
    }),
    prisma.videoTask.groupBy({
      by: ["editorId"],
      where: {
        status: { in: [VideoStatus.PENDING_EDIT, VideoStatus.IN_PROGRESS, VideoStatus.NEEDS_REVISION, VideoStatus.PENDING_REVIEW] },
      },
      _count: true,
    }),
  ]);

  const scriptDoneByAuthor = new Map<string, { chinese: number; female: number }>();
  scriptGroups.forEach((group) => {
    const current = scriptDoneByAuthor.get(group.authorId) || { chinese: 0, female: 0 };
    if (group.category === ScriptCategory.FEMALE) {
      current.female += group._count;
    } else {
      current.chinese += group._count;
    }
    scriptDoneByAuthor.set(group.authorId, current);
  });

  const editorDoneByUser = new Map(editorDoneGroups.map((group) => [group.editorId, group._count]));
  const activeEditingByUser = new Map(activeEditingGroups.map((group) => [group.editorId, group._count]));
  const directors = users.filter((member) => member.role === Role.DIRECTOR);
  const editors = users.filter((member) => member.role === Role.EDITOR);
  const admins = users.filter((member) => member.role === Role.ADMIN);
  const inactive = users.filter((member) => member.status === UserStatus.INACTIVE);
  const activeMembers = users.filter((member) => member.status === UserStatus.ACTIVE);
  const scriptTarget = directors.reduce((sum, member) => {
    const target = member.dailyTargets[0];
    return sum + (target?.chineseParentingScripts || 0) + (target?.femaleScripts || 0);
  }, 0);
  const editorTarget = editors.reduce((sum, member) => sum + (member.dailyTargets[0]?.editingVideos || 0), 0);
  const todayScriptDone = Array.from(scriptDoneByAuthor.values()).reduce((sum, item) => sum + item.chinese + item.female, 0);
  const todayEditorDone = Array.from(editorDoneByUser.values()).reduce((sum, count) => sum + count, 0);
  const teamTarget = scriptTarget + editorTarget;
  const teamDone = todayScriptDone + todayEditorDone;
  const teamPercent = percent(teamDone, teamTarget);

  return (
    <AppShell user={user} active="people" title="人员与目标设置" subtitle="管理员可以新增人员、停用账号，并调整每日工作目标。">
      <section className="people-workspace">
        <header className="people-hero">
          <div>
            <span className="people-kicker">TEAM TARGETS</span>
            <h1>人员与目标设置</h1>
            <p>管理成员账号、角色状态和每日目标，让团队工作量从源头保持清楚。</p>
          </div>
          <article className="people-team-card">
            <span>Today Signal</span>
            <strong>{teamPercent}%</strong>
            <p>{progressText(teamDone, teamTarget)} 今日全员目标</p>
          </article>
        </header>

        <section className="people-signal-grid" aria-label="团队概览">
          <article className="people-signal-card">
            <span>团队成员</span>
            <strong>{users.length}</strong>
            <p>启用 {activeMembers.length} · 停用 {inactive.length}</p>
          </article>
          <article className="people-signal-card">
            <span>编导目标</span>
            <strong>{scriptTarget}</strong>
            <p>今日脚本目标</p>
          </article>
          <article className="people-signal-card">
            <span>剪辑目标</span>
            <strong>{editorTarget}</strong>
            <p>今日交付目标</p>
          </article>
          <article className="people-signal-card">
            <span>待处理负载</span>
            <strong>{Array.from(activeEditingByUser.values()).reduce((sum, count) => sum + count, 0)}</strong>
            <p>剪辑侧未闭环任务</p>
          </article>
        </section>

        <section className="people-main-grid">
          <article className="people-member-panel">
            <div className="people-panel-head">
              <div>
                <span>Member Board</span>
                <h2>成员目标</h2>
                <p>每张成员卡展示今日完成、当前目标和账号状态，日常调整从这里进入。</p>
              </div>
              <Modal trigger="新增成员" title="新增成员" subtitle="创建账号后，该成员即可用账号和初始密码登录。">
                <form action={createUserAction} className="glass-form">
                  <label className="field">
                    <span>姓名</span>
                    <input name="name" required />
                  </label>
                  <label className="field">
                    <span>账号</span>
                    <input name="email" type="text" autoComplete="username" required />
                  </label>
                  <label className="field">
                    <span>角色</span>
                    <select name="role" defaultValue={Role.DIRECTOR}>
                      <option value={Role.DIRECTOR}>编导</option>
                      <option value={Role.EDITOR}>剪辑</option>
                      <option value={Role.ADMIN}>管理员</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>初始密码</span>
                    <input name="password" type="password" required minLength={6} defaultValue="zzb888" />
                  </label>
                  <button className="primary-action" type="submit">创建账号</button>
                </form>
              </Modal>
            </div>

            <div className="people-member-grid">
              {users.map((member) => {
                const target = member.dailyTargets[0];
                const scriptDone = scriptDoneByAuthor.get(member.id) || { chinese: 0, female: 0 };
                const directorDone = scriptDone.chinese + scriptDone.female;
                const editorDone = editorDoneByUser.get(member.id) || 0;
                const memberDone = member.role === Role.DIRECTOR ? directorDone : member.role === Role.EDITOR ? editorDone : 0;
                const memberTarget = targetTotal(target);
                const memberPercent = percent(memberDone, memberTarget);
                const isCurrentUser = member.id === user.id;

                return (
                  <article className="people-member-card" data-status={member.status.toLowerCase()} key={member.id}>
                    <div className="people-member-top">
                      <div className="people-avatar">{member.avatarUrl ? <img src={member.avatarUrl} alt={member.name} /> : member.name.slice(0, 1)}</div>
                      <div>
                        <span>{roleLabel[member.role]}</span>
                        <h3>{member.name}</h3>
                        <p>{member.email}</p>
                      </div>
                      <b>{member.status === UserStatus.ACTIVE ? "启用" : "停用"}</b>
                    </div>

                    <div className="people-progress-block">
                      <div>
                        <span>今日完成</span>
                        <strong>{progressText(memberDone, memberTarget)}</strong>
                      </div>
                      <i>
                        <em style={{ width: `${memberPercent}%` }} />
                      </i>
                    </div>

                    <div className="people-target-row">
                      <div>
                        <span>中式育儿</span>
                        <strong>{target?.chineseParentingScripts || 0}</strong>
                      </div>
                      <div>
                        <span>女性</span>
                        <strong>{target?.femaleScripts || 0}</strong>
                      </div>
                      <div>
                        <span>剪辑</span>
                        <strong>{target?.editingVideos || 0}</strong>
                      </div>
                    </div>

                    <div className="people-card-actions">
                      <Link href={`/people/${member.id}`}>查看主页</Link>
                      <Modal
                        trigger="调整目标"
                        title={`${member.name}的每日目标`}
                        subtitle="保存后从今天起按最新目标统计。"
                        tone="ghost"
                        triggerClassName="people-target-trigger"
                      >
                        <form action={updateTargetAction} className="glass-form">
                          <input type="hidden" name="userId" value={member.id} />
                          <label className="field">
                            <span>中式育儿</span>
                            <input name="chineseParentingScripts" type="number" min="0" defaultValue={target?.chineseParentingScripts || 0} />
                          </label>
                          <label className="field">
                            <span>女性</span>
                            <input name="femaleScripts" type="number" min="0" defaultValue={target?.femaleScripts || 0} />
                          </label>
                          <label className="field">
                            <span>剪辑</span>
                            <input name="editingVideos" type="number" min="0" defaultValue={target?.editingVideos || 0} />
                          </label>
                          <button className="primary-action" type="submit">更新目标</button>
                        </form>
                      </Modal>
                      <form action={toggleUserStatusAction}>
                        <input type="hidden" name="userId" value={member.id} />
                        <input type="hidden" name="status" value={member.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE} />
                        <button className="people-status-button" type="submit" disabled={isCurrentUser}>
                          {member.status === UserStatus.ACTIVE ? "停用" : "启用"}
                        </button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          </article>

          <aside className="people-side-stack">
            <article className="people-side-card">
              <span>Role Mix</span>
              <h2>角色分布</h2>
              <div className="people-role-list">
                <div>
                  <span>管理员</span>
                  <strong>{admins.length}</strong>
                </div>
                <div>
                  <span>编导</span>
                  <strong>{directors.length}</strong>
                </div>
                <div>
                  <span>剪辑</span>
                  <strong>{editors.length}</strong>
                </div>
              </div>
            </article>

            <article className="people-side-card warm">
              <span>Maintain Flow</span>
              <h2>维护原则</h2>
              <p>目标调整会新增一条从今天开始生效的目标记录，历史目标不覆盖，方便后续追踪团队节奏变化。</p>
            </article>
          </aside>
        </section>
      </section>
    </AppShell>
  );
}
