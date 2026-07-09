# 内容排期管理系统

这是从静态 UI 原型升级来的 Next.js 全栈项目，用于管理脚本、视频任务、剪辑、审核、排期、发布和库存。

## 技术栈

- Next.js + TypeScript
- Prisma + PostgreSQL
- S3 兼容对象存储：头像、审核截图
- 账号密码登录 + 数据库会话 Cookie
- Docker 部署配置

## 本地启动

1. 安装依赖：

```bash
npm install
```

2. 配置环境变量：

```bash
cp .env.example .env
```

3. 启动 PostgreSQL 后执行迁移和种子：

```bash
docker compose up -d db
npx prisma migrate deploy
npm run prisma:seed
```

4. 启动开发服务：

```bash
npm run dev
```

默认种子账号密码均为 `zzb888`，管理员账号为 `gr`。其他初始账号为：胡欣怡 `hxy`、王煊 `wx`、单萱萱 `sxx`、贺玲玥 `hly`、黄炜琪 `hwq`。

## Docker 部署

服务器上准备 `.env` 后执行：

```bash
docker compose up -d --build
```

当前 `docker-compose.yml` 会同时启动 PostgreSQL 和应用容器。应用容器启动时会执行 `npx prisma migrate deploy`。

## Windows Docker 配置

如果本机没有 Docker Desktop，可先安装 Docker Desktop，再用管理员权限运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-wsl-docker.ps1
```

脚本会启用 WSL 和 Virtual Machine Platform，并把 WSL 默认版本设置为 2。首次启用后如 Docker Desktop 无法启动，重启 Docker Desktop；必要时重启 Windows。

## 验证命令

```bash
npx prisma validate
npm run typecheck
npm run lint
npm run build
```

运行 `npm run build` 前建议先停止正在运行的 `npm run dev`。Next.js 的开发产物和生产构建产物都会写入 `.next`，同时运行可能导致本地 dev server 读取到不完整 chunk。
