const state = {
  activeRole: "admin",
  activePage: "home",
};

const dashboards = {
  admin: {
    theme: "admin",
    title: "龚锐的管理总览",
    subtitle: "全员脚本、剪辑交付、审核和库存状态",
    role: "管理员",
    name: "龚锐",
    avatar: "锐",
    completion: "92%",
    summary: [
      { label: "今日脚本", value: "10/11", icon: "稿" },
      { label: "今日交付", value: "11/12", icon: "剪" },
      { label: "可发布库存", value: "18", icon: "发" },
    ],
    cards: [
      { label: "编导完成率", value: "91%", trend: "+8%" },
      { label: "剪辑完成率", value: "92%", trend: "+6%" },
    ],
    bars: [44, 68, 82, 56, 49, 88, 76],
    progressTitle: "全员工作情况",
    progress: [
      { label: "胡欣怡 · 脚本 4/4", value: 100 },
      { label: "王煊 · 脚本 3/4", value: 75 },
      { label: "黄炜琪 · 剪辑 5/6", value: 83 },
    ],
    activities: [
      { title: "胡欣怡提交新脚本", detail: "传统 · 已进入脚本库" },
      { title: "贺玲玥交付视频", detail: "130s+ · 等待编导审核" },
    ],
    todos: [
      "16:30 前确认王煊女性脚本进度",
      "查看黄炜琪逾期剪辑任务",
      "审批明天可发布库存",
      "检查屯片池是否低于安全线",
    ],
    donut: ["脚本 42%", "交付 30%", "审核 16%", "逾期 12%"],
  },
  director: {
    theme: "director",
    title: "胡欣怡的编导主页",
    subtitle: "今日 3 条中式育儿脚本 + 1 条女性脚本",
    role: "编导",
    name: "胡欣怡",
    avatar: "欣",
    completion: "4/4",
    summary: [
      { label: "今日脚本", value: "4/4", icon: "文" },
      { label: "待审核", value: "3", icon: "审" },
      { label: "屯片池", value: "8", icon: "屯" },
    ],
    cards: [
      { label: "剪辑推进", value: "7条", trend: "+3" },
      { label: "可发布", value: "5条", trend: "+2" },
    ],
    bars: [72, 54, 36, 66, 80, 44, 92],
    progressTitle: "脚本分类",
    progress: [
      { label: "传统 · 2/2", value: 100 },
      { label: "协助 · 1/1", value: 100 },
      { label: "女性 · 1/1", value: 100 },
    ],
    activities: [
      { title: "《老人总说孩子不能抱太多》", detail: "待审核 · 贺玲玥" },
      { title: "《隔代育儿里的边界感》", detail: "可发布 · 07-08 19:30" },
    ],
    todos: [
      "审核《老人总说孩子不能抱太多》",
      "给女性脚本补一条素材链接",
      "确认屯片池 8 条是否需要排期",
      "下达明天第一条剪辑任务",
    ],
    donut: ["传统 50%", "协助 25%", "女性 25%", "待审 3"],
  },
  editor: {
    theme: "editor",
    title: "贺玲玥的剪辑主页",
    subtitle: "今日目标 6 条，优先处理交付和修改",
    role: "剪辑",
    name: "贺玲玥",
    avatar: "玥",
    completion: "83%",
    summary: [
      { label: "今日完成", value: "5/6", icon: "完" },
      { label: "待剪辑", value: "2", icon: "待" },
      { label: "需修改", value: "1", icon: "改" },
    ],
    cards: [
      { label: "已交付", value: "5条", trend: "+5" },
      { label: "逾期任务", value: "0条", trend: "稳" },
    ],
    bars: [38, 62, 58, 76, 90, 42, 66],
    progressTitle: "按时长统计",
    progress: [
      { label: "70s 以内 · 2条", value: 42 },
      { label: "70s-130s · 2条", value: 62 },
      { label: "130s+ · 1条", value: 34 },
    ],
    activities: [
      { title: "孩子哭闹时先抱还是先讲道理", detail: "剪辑中 · 预计 86s" },
      { title: "妈妈不是家庭里的隐形人", detail: "需修改 · 补截图 2 张" },
    ],
    todos: [
      "16:30 前补齐第 6 条交付",
      "处理王煊提交的修改建议",
      "确认 130s+ 视频字幕节奏",
      "提交今日完成视频链接",
    ],
    donut: ["70s 内 40%", "70-130s 40%", "130s+ 20%", "修改 1"],
  },
};

const modulePages = {
  scripts: {
    title: "脚本库",
    eyebrow: "Script Library",
    subtitle: "文案上传、分类归档、脚本状态和今日完成情况",
    actions: ["新增脚本", "批量导入"],
    stats: [
      { label: "今日新增", value: "10", hint: "目标 11 条", icon: "今" },
      { label: "脚本总数", value: "186", hint: "本月累计", icon: "库" },
      { label: "中式育儿", value: "142", hint: "传统 91 · 协助 51", icon: "育" },
      { label: "女性脚本", value: "44", hint: "今日新增 2", icon: "女" },
    ],
    rows: [
      ["老人总说孩子不能抱太多", "传统", "胡欣怡", "07-06", "已入库"],
      ["边界感不是不孝", "协助", "王煊", "07-06", "待下剪"],
      ["妈妈也要被看见", "女性", "胡欣怡", "07-06", "可下剪"],
      ["隔代育儿里的边界感", "传统", "单萱萱", "07-05", "已下剪"],
    ],
    sideTitle: "分类占比",
    sideItems: [
      { label: "传统脚本", value: 49 },
      { label: "协助脚本", value: 27 },
      { label: "女性脚本", value: 24 },
    ],
    notes: ["胡欣怡今日 4/4", "王煊今日 3/4", "单萱萱今日 3/3"],
  },
  videos: {
    title: "视频总览",
    eyebrow: "Video Overview",
    subtitle: "创建视频任务、跟踪剪辑进度、查看审核和发布状态",
    actions: ["新增视频", "自动分配剪辑"],
    stats: [
      { label: "今日新建", value: "8", hint: "脚本关联完成", icon: "新" },
      { label: "待剪辑", value: "11", hint: "自动平均分配", icon: "待" },
      { label: "待审核", value: "7", hint: "编导需确认", icon: "审" },
      { label: "可发布", value: "18", hint: "含屯片池", icon: "发" },
    ],
    rows: [
      ["老人总说孩子不能抱太多", "中式育儿", "贺玲玥", "78s", "待审核"],
      ["妈妈不是家庭里的隐形人", "女性", "黄炜琪", "132s", "需修改"],
      ["隔代育儿里的边界感", "中式育儿", "贺玲玥", "102s", "可发布"],
      ["孩子哭闹先抱还是讲道理", "中式育儿", "黄炜琪", "86s", "剪辑中"],
    ],
    sideTitle: "剪辑分配",
    sideItems: [
      { label: "贺玲玥", value: 50 },
      { label: "黄炜琪", value: 50 },
      { label: "逾期风险", value: 14 },
    ],
    notes: ["必填：脚本、素材链接、交付日期", "计划发布日期为空则进入屯片池", "剪辑人按任务数自动平均分配"],
  },
  review: {
    title: "审核中心",
    eyebrow: "Review Center",
    subtitle: "待审核视频、修改建议、截图备注和通过状态",
    actions: ["提交修改建议", "审核通过"],
    stats: [
      { label: "待审核", value: "7", hint: "今日新增 3", icon: "待" },
      { label: "需修改", value: "3", hint: "等待剪辑处理", icon: "改" },
      { label: "已通过", value: "12", hint: "进入可发布", icon: "过" },
      { label: "平均审核", value: "38m", hint: "今日口径", icon: "时" },
    ],
    reviewCards: [
      { title: "老人总说孩子不能抱太多", meta: "胡欣怡 · 贺玲玥 · 78s", status: "待审核" },
      { title: "妈妈不是家庭里的隐形人", meta: "王煊 · 黄炜琪 · 132s", status: "需修改" },
      { title: "隔代育儿里的边界感", meta: "单萱萱 · 贺玲玥 · 102s", status: "已通过" },
    ],
    sideTitle: "审核表单预览",
    notes: ["视频链接：https://video.example/review/0706", "截图上传：3 张待补充", "修改建议：片尾字幕停留 1.5 秒"],
  },
  schedule: {
    title: "排期日历",
    eyebrow: "Publishing Calendar",
    subtitle: "计划发布日期、发布时间、发布节奏和空档提醒",
    actions: ["新增排期", "从库存选择"],
    stats: [
      { label: "本周排期", value: "21", hint: "日均 3 条", icon: "周" },
      { label: "今日发布", value: "3", hint: "19:30 主推", icon: "今" },
      { label: "待排期", value: "9", hint: "可发布未安排", icon: "排" },
      { label: "空档", value: "2", hint: "周四/周日", icon: "空" },
    ],
    days: [
      ["周一", "3条", "19:30 老人带娃边界感"],
      ["周二", "3条", "12:00 女性成长短片"],
      ["周三", "4条", "20:00 中式育儿合集"],
      ["周四", "2条", "缺 1 条晚间档"],
      ["周五", "3条", "19:30 可发布库存"],
      ["周六", "4条", "周末测试双发"],
      ["周日", "2条", "需补 1 条女性"],
    ],
    sideTitle: "排期提醒",
    notes: ["无计划发布日期的视频自动进入屯片池", "可发布库存建议保持 12 条以上", "发布后进入库存记录归档"],
  },
  inventory: {
    title: "库存池",
    eyebrow: "Content Stock",
    subtitle: "屯片池、可发布库存、已发布归档和时长结构",
    actions: ["加入排期", "导出库存"],
    stats: [
      { label: "可发布库存", value: "18", hint: "安全线 12 条", icon: "发" },
      { label: "屯片池", value: "8", hint: "无发布日期", icon: "屯" },
      { label: "已发布", value: "64", hint: "本月累计", icon: "布" },
      { label: "需补链接", value: "2", hint: "素材待确认", icon: "补" },
    ],
    rows: [
      ["隔代育儿里的边界感", "中式育儿", "102s", "可发布", "07-08"],
      ["妈妈也要被看见", "女性", "68s", "屯片", "未定"],
      ["孩子哭闹时先抱还是先讲道理", "中式育儿", "86s", "可发布", "07-09"],
      ["老人带娃时的三条底线", "中式育儿", "138s", "已发布", "07-06"],
    ],
    sideTitle: "时长结构",
    sideItems: [
      { label: "70s 以内", value: 36 },
      { label: "70s-130s", value: 48 },
      { label: "130s+", value: 16 },
    ],
    notes: ["70s 内适合补日常发布", "130s+ 建议优先看完播数据", "屯片池低于 6 条时提醒管理员"],
  },
};

const THEME_STORAGE_KEY = "content-schedule-theme";

const roleThemes = {
  admin: { preset: "role", name: "管理员默认", accent: "#64cfee", accent2: "#83e6cd", accent3: "#9f91ff" },
  director: { preset: "role", name: "编导默认", accent: "#70d2ed", accent2: "#83e5bd", accent3: "#eda9d8" },
  editor: { preset: "role", name: "剪辑默认", accent: "#80d7f4", accent2: "#b5e98a", accent3: "#9d91ff" },
};

const themePresets = {
  mint: { preset: "mint", name: "浅蓝薄荷", accent: "#64cfee", accent2: "#83e6cd", accent3: "#9f91ff" },
  blush: { preset: "blush", name: "粉紫创作", accent: "#72d0ef", accent2: "#8de1bd", accent3: "#eda9d8" },
  lime: { preset: "lime", name: "青绿剪辑", accent: "#80d7f4", accent2: "#b5e98a", accent3: "#9d91ff" },
  slate: { preset: "slate", name: "灰蓝冷感", accent: "#86bfe2", accent2: "#a7d8d0", accent3: "#a9a7e9" },
};

let savedTheme = loadThemePreference();
let themeDraft = null;

function render() {
  const data = dashboards[state.activeRole];
  document.body.dataset.theme = data.theme;
  const currentPageTitle = state.activePage === "home" ? "Dashboard" : modulePages[state.activePage].title;
  document.getElementById("pageTitle").textContent = currentPageTitle;

  document.querySelectorAll(".role-tab").forEach((button) => {
    const active = button.dataset.role === state.activeRole;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });

  document.querySelectorAll("[data-page]").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === state.activePage);
  });

  if (state.activePage === "home") {
    renderHome(data);
  } else {
    renderModulePage(modulePages[state.activePage]);
  }

  applyPersistedTheme();
}

function renderHome(data) {
  document.getElementById("mainDashboard").innerHTML = `
    ${renderWorkspaceHead(data)}
    <section class="compact-grid">
      ${renderSalesChart(data)}
      ${renderSideCards(data)}
    </section>
    ${renderSummary(data.summary)}
    <section class="lower-grid">
      ${renderProgress(data)}
      ${renderActivities(data.activities)}
    </section>
  `;

  document.getElementById("rightPanel").innerHTML = `
    ${renderTodos(data.todos)}
    ${renderStats(data)}
  `;
}

function renderModulePage(page) {
  document.getElementById("mainDashboard").innerHTML = `
    ${renderModuleHead(page)}
    ${renderModuleStats(page.stats)}
    ${renderModuleBody(page)}
  `;

  document.getElementById("rightPanel").innerHTML = renderModuleSide(page);
}

function renderWorkspaceHead(data) {
  return `
    <section class="workspace-head">
      <div>
        <p class="eyebrow">${data.role} Dashboard</p>
        <h2>${data.title}</h2>
        <p>${data.subtitle}</p>
      </div>
      <div class="mini-profile" aria-label="${data.name} 的个人空间">
        <div class="mini-avatar">${data.avatar}</div>
        <div>
          <strong>${data.name}</strong>
          <span>${data.role} · 个人空间</span>
        </div>
      </div>
    </section>
  `;
}

function renderSalesChart(data) {
  return `
    <section class="panel chart-panel">
      <div class="panel-title">
        <h3>今日产出</h3>
        <span>实时</span>
      </div>
      <div class="bars">
        ${data.bars
          .map(
            (height, index) => `
              <div class="bar" style="--height:${height}%">
                <span>${["脚本", "素材", "下剪", "剪辑", "审核", "可发", "库存"][index]}</span>
              </div>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderSideCards(data) {
  return `
    <div class="side-metrics">
      ${data.cards
        .map(
          (item, index) => `
            <article class="panel mini-stat">
              <div>
                <span>${item.label}</span>
                <strong>${item.value}</strong>
                <small>${item.trend}</small>
              </div>
              <svg viewBox="0 0 160 54" aria-hidden="true">
                <path class="${index === 1 ? "violet" : ""}" d="${index === 1 ? "M2 36 L24 18 L46 42 L68 16 L90 30 L112 20 L136 22 L158 10" : "M2 40 L24 24 L46 32 L68 18 L90 20 L112 14 L136 22 L158 12"}" />
              </svg>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderSummary(items) {
  return `
    <section class="summary-row" aria-label="数据概览">
      ${items
        .map(
          (item) => `
            <article class="summary-card">
              <span class="summary-icon">${item.icon}</span>
              <div>
                <span>${item.label}</span>
                <strong>${item.value}</strong>
              </div>
            </article>
          `,
        )
        .join("")}
    </section>
  `;
}

function renderProgress(data) {
  return `
    <section class="panel">
      <div class="panel-title">
        <h3>${data.progressTitle}</h3>
        <span>详情</span>
      </div>
      <div class="progress-list">
        ${data.progress
          .map(
            (item) => `
              <div class="progress-item">
                <div>
                  <span>${item.label}</span>
                  <strong>${item.value}%</strong>
                </div>
                <div class="progress-track"><i style="--progress:${item.value}%"></i></div>
              </div>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderActivities(items) {
  return `
    <section class="panel">
      <div class="panel-title">
        <h3>最新活动</h3>
        <span>今天</span>
      </div>
      <div class="activity-list">
        ${items
          .map(
            (item) => `
              <article class="activity-item">
                <span></span>
                <div>
                  <strong>${item.title}</strong>
                  <p>${item.detail}</p>
                </div>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderTodos(items) {
  return `
    <section class="todo-panel">
      <div class="todo-head">
        <div>
          <h3>To-Do List</h3>
          <span>今日提醒</span>
        </div>
        <button type="button" data-action="新增待办">+</button>
      </div>
      <div class="todo-list">
        ${items
          .map(
            (item, index) => `
              <label class="todo-item">
                <input type="checkbox" ${index === 0 ? "checked" : ""} />
                <span>${item}</span>
              </label>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderStats(data) {
  return `
    <section class="stats-panel">
      <div class="panel-title">
        <h3>统计</h3>
        <span>${data.completion}</span>
      </div>
      <div class="donut" aria-label="统计环图">
        <strong>${data.completion}</strong>
      </div>
      <div class="stat-labels">
        ${data.donut.map((item) => `<span>${item}</span>`).join("")}
      </div>
    </section>
  `;
}

function renderModuleHead(page) {
  return `
    <section class="module-head">
      <div>
        <p class="eyebrow">${page.eyebrow}</p>
        <h2>${page.title}</h2>
        <p>${page.subtitle}</p>
      </div>
      <div class="module-actions">
        ${page.actions
          .map((action, index) => `<button class="${index === 0 ? "primary-action" : "ghost-action"}" type="button" data-action="${action}">${action}</button>`)
          .join("")}
      </div>
    </section>
  `;
}

function renderModuleStats(stats) {
  return `
    <section class="module-stat-grid" aria-label="模块数据概览">
      ${stats
        .map(
          (stat) => `
            <article class="module-stat-card">
              <span class="summary-icon">${stat.icon}</span>
              <div>
                <small>${stat.label}</small>
                <strong>${stat.value}</strong>
                <p>${stat.hint}</p>
              </div>
            </article>
          `,
        )
        .join("")}
    </section>
  `;
}

function renderModuleBody(page) {
  if (page.title === "审核中心") {
    return renderReviewBody(page);
  }

  if (page.title === "排期日历") {
    return renderScheduleBody(page);
  }

  return `
    <section class="module-body-grid">
      <article class="panel module-table-panel">
        <div class="panel-title">
          <h3>${page.title === "视频总览" ? "视频任务列表" : page.title === "库存池" ? "库存明细" : "脚本列表"}</h3>
          <span>静态预览</span>
        </div>
        ${renderModuleTable(page)}
      </article>
      <article class="panel module-focus-panel">
        <div class="panel-title">
          <h3>${page.sideTitle}</h3>
          <span>结构</span>
        </div>
        ${renderSideProgress(page.sideItems)}
      </article>
    </section>
  `;
}

function renderModuleTable(page) {
  const headers = page.title === "脚本库"
    ? ["标题", "类别", "编导", "日期", "状态"]
    : page.title === "库存池"
      ? ["标题", "类型", "时长", "状态", "日期"]
      : ["标题", "类型", "剪辑", "秒数", "状态"];

  return `
    <table class="data-table">
      <thead>
        <tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${page.rows
          .map(
            (row) => `
              <tr>
                ${row
                  .map((cell, index) => `<td>${index === row.length - 1 ? `<span class="status-pill ${getStatusClass(cell)}">${cell}</span>` : cell}</td>`)
                  .join("")}
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderReviewBody(page) {
  return `
    <section class="review-grid">
      <article class="panel review-list">
        <div class="panel-title">
          <h3>待处理视频</h3>
          <span>审核队列</span>
        </div>
        ${page.reviewCards
          .map(
            (card) => `
              <div class="review-card">
                <div>
                  <strong>${card.title}</strong>
                  <p>${card.meta}</p>
                </div>
                <span class="status-pill ${getStatusClass(card.status)}">${card.status}</span>
              </div>
            `,
          )
          .join("")}
      </article>
      <article class="panel review-detail">
        <div class="panel-title">
          <h3>修改建议预览</h3>
          <span>表单</span>
        </div>
        <div class="video-link-card">视频链接 / https://video.example/review/0706</div>
        <div class="upload-grid">
          <span>截图 1</span>
          <span>截图 2</span>
          <span>+</span>
        </div>
        <div class="note-box">建议：片尾字幕停留 1.5 秒，口播第 3 句节奏略快，需要补一个情绪缓冲镜头。</div>
      </article>
    </section>
  `;
}

function renderScheduleBody(page) {
  return `
    <section class="panel calendar-panel">
      <div class="panel-title">
        <h3>本周发布排期</h3>
        <span>计划视图</span>
      </div>
      <div class="calendar-grid">
        ${page.days
          .map(
            ([day, count, detail]) => `
              <article class="calendar-day">
                <div>
                  <strong>${day}</strong>
                  <span>${count}</span>
                </div>
                <p>${detail}</p>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderModuleSide(page) {
  return `
    <section class="todo-panel module-side-panel">
      <div class="todo-head">
        <div>
          <h3>${page.sideTitle || "模块提醒"}</h3>
          <span>重点信息</span>
        </div>
        <button type="button" data-action="新增">+</button>
      </div>
      ${page.sideItems ? renderSideProgress(page.sideItems) : ""}
      <div class="module-note-list">
        ${page.notes.map((note) => `<p>${note}</p>`).join("")}
      </div>
    </section>
    <section class="stats-panel module-mini-chart">
      <div class="panel-title">
        <h3>流程状态</h3>
        <span>预览</span>
      </div>
      <div class="flow-stack">
        <span>选题/脚本</span>
        <i></i>
        <span>剪辑</span>
        <i></i>
        <span>审核</span>
        <i></i>
        <span>发布/库存</span>
      </div>
    </section>
  `;
}

function renderSideProgress(items = []) {
  return `
    <div class="side-progress-list">
      ${items
        .map(
          (item) => `
            <div class="progress-item">
              <div>
                <span>${item.label}</span>
                <strong>${item.value}%</strong>
              </div>
              <div class="progress-track"><i style="--progress:${item.value}%"></i></div>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function getStatusClass(status) {
  if (["需修改", "逾期", "补链接"].some((word) => status.includes(word))) return "warn";
  if (["待审核", "待下剪", "待剪辑", "剪辑中", "屯片"].some((word) => status.includes(word))) return "pending";
  if (["可发布", "已通过", "已入库", "已发布"].some((word) => status.includes(word))) return "done";
  return "";
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1600);
}

function isHexColor(value) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function normalizeTheme(theme) {
  if (!theme || !isHexColor(theme.accent) || !isHexColor(theme.accent2) || !isHexColor(theme.accent3)) {
    return null;
  }

  const preset = themePresets[theme.preset] ? theme.preset : "custom";
  return {
    preset,
    name: theme.name || themePresets[preset]?.name || "自定义主题",
    accent: theme.accent,
    accent2: theme.accent2,
    accent3: theme.accent3,
  };
}

function loadThemePreference() {
  try {
    return normalizeTheme(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY)));
  } catch {
    return null;
  }
}

function getRoleTheme() {
  return roleThemes[state.activeRole];
}

function applyTheme(theme) {
  document.body.style.setProperty("--accent", theme.accent);
  document.body.style.setProperty("--accent-2", theme.accent2);
  document.body.style.setProperty("--accent-3", theme.accent3);
  document.body.dataset.userTheme = theme.preset;
}

function clearCustomTheme() {
  document.body.style.removeProperty("--accent");
  document.body.style.removeProperty("--accent-2");
  document.body.style.removeProperty("--accent-3");
  delete document.body.dataset.userTheme;
}

function applyPersistedTheme() {
  if (savedTheme) {
    applyTheme(savedTheme);
    return;
  }

  clearCustomTheme();
}

function renderPresetButtons() {
  const presetGrid = document.getElementById("presetGrid");
  if (!presetGrid) return;

  presetGrid.innerHTML = Object.values(themePresets)
    .map(
      (theme) => `
        <button class="preset-card" type="button" data-theme-preset="${theme.preset}">
          <span class="preset-swatch" style="--swatch-a:${theme.accent}; --swatch-b:${theme.accent2}; --swatch-c:${theme.accent3}">
            <i></i><i></i><i></i>
          </span>
          <strong>${theme.name}</strong>
        </button>
      `,
    )
    .join("");
}

function syncThemeControls(theme) {
  document.getElementById("themeAccent").value = theme.accent;
  document.getElementById("themeAccent2").value = theme.accent2;
  document.getElementById("themeAccent3").value = theme.accent3;
  document.getElementById("themePresetName").textContent = theme.name;

  document.querySelectorAll("[data-theme-preset]").forEach((button) => {
    button.classList.toggle("active", button.dataset.themePreset === theme.preset);
  });
}

function openThemePanel() {
  themeDraft = { ...(savedTheme || getRoleTheme()) };
  renderPresetButtons();
  syncThemeControls(themeDraft);
  applyTheme(themeDraft);
  document.getElementById("themeBackdrop").hidden = false;
}

function closeThemePanel() {
  document.getElementById("themeBackdrop").hidden = true;
  themeDraft = null;
  applyPersistedTheme();
}

function updateThemeDraft(nextTheme) {
  themeDraft = normalizeTheme(nextTheme);
  if (!themeDraft) return;
  applyTheme(themeDraft);
  syncThemeControls(themeDraft);
}

function saveThemeDraft() {
  if (!themeDraft) return;
  savedTheme = themeDraft;
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(savedTheme));
  document.getElementById("themeBackdrop").hidden = true;
  showToast("配色已保存");
}

function resetThemeToRoleDefault() {
  savedTheme = null;
  themeDraft = { ...getRoleTheme() };
  localStorage.removeItem(THEME_STORAGE_KEY);
  clearCustomTheme();
  syncThemeControls(themeDraft);
  showToast("已恢复角色默认配色");
}

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-settings]")) {
    openThemePanel();
    return;
  }

  if (event.target.closest("[data-theme-close]")) {
    closeThemePanel();
    return;
  }

  if (event.target.id === "themeBackdrop") {
    closeThemePanel();
    return;
  }

  const presetButton = event.target.closest("[data-theme-preset]");
  if (presetButton) {
    updateThemeDraft(themePresets[presetButton.dataset.themePreset]);
    return;
  }

  if (event.target.closest("[data-theme-save]")) {
    saveThemeDraft();
    return;
  }

  if (event.target.closest("[data-theme-reset]")) {
    resetThemeToRoleDefault();
    return;
  }

  const roleButton = event.target.closest("[data-role]");
  if (roleButton) {
    state.activeRole = roleButton.dataset.role;
    render();
    showToast(`已切换到${dashboards[state.activeRole].name}的视图`);
    return;
  }

  const action = event.target.closest("[data-action]");
  if (action) {
    showToast(`${action.dataset.action}：这是 UI 预览按钮`);
  }
});

document.addEventListener("input", (event) => {
  const colorInput = event.target.closest(".theme-color-input");
  if (!colorInput || !themeDraft) return;

  const nextTheme = {
    ...themeDraft,
    preset: "custom",
    name: "自定义主题",
    [colorInput.dataset.colorKey]: colorInput.value,
  };
  updateThemeDraft(nextTheme);
});

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    if (item.dataset.settings) return;
    state.activePage = item.dataset.page || "home";
    render();
    const pageTitle = state.activePage === "home" ? "首页" : modulePages[state.activePage].title;
    showToast(`已切换到${pageTitle}`);
  });
});

render();
