# 部署指南

本项目后端用 Docker 跑 API；小程序前端在微信开发者工具里上传，**不走服务器 Docker**。

## 服务器上需要哪些文件？

用 Docker Compose 时，**不需要手动挑文件上传**，推荐在服务器上 `git clone` 整个仓库（或只拉后端相关目录）。

实际参与构建的只有：

```
docker-compose.yml          # 编排
.env                        # 密钥（服务器上手动创建，不要提交 Git）
backend/
  Dockerfile
  go.mod / go.sum
  cmd/
  internal/
```

**不需要**传到服务器：

| 路径 | 原因 |
|------|------|
| `frontend/` | 小程序本地构建后，用微信开发者工具上传 |
| `backend/config/.env` | 本地开发用；Docker 部署用项目根目录 `.env` |
| `backend/data/*.db` | 数据在 Docker volume 里，跟代码分开 |
| `node_modules/`、`dist/` | 构建产物/依赖，已在 `.gitignore` |

## 方式一：Docker Compose（手动）

### 1. 服务器首次准备（只做一次）

```bash
# 安装 Docker + Docker Compose 插件后
sudo mkdir -p /opt/teenage-life-assistant
cd /opt/teenage-life-assistant

git clone <你的仓库地址> .
cp .env.example .env
# 编辑 .env：JWT_SECRET、WECHAT_APP_ID、WECHAT_APP_SECRET
nano .env

docker compose up -d --build
```

根目录 `.env` 示例见 [.env.example](../.env.example)。

### 2. 以后更新代码

```bash
cd /opt/teenage-life-assistant
git pull
docker compose up -d --build
```

## 方式二：GitHub Actions 自动部署（推荐）

思路：**代码 push 到 GitHub → Action SSH 连服务器 → `git pull` + `docker compose up --build`**。  
不需要把文件打包上传，服务器上保留一份 git 仓库即可。

### 1. 服务器首次准备

与「方式一」相同：clone 仓库、创建 `.env`、手动跑通一次 `docker compose up -d --build`。

### 2. 在 GitHub 仓库配置 Secrets

Settings → Secrets and variables → Actions → New repository secret：

| Secret | 说明 |
|--------|------|
| `SERVER_HOST` | 服务器 IP 或域名 |
| `SERVER_USER` | SSH 用户名，如 `root` / `ubuntu` |
| `SERVER_SSH_KEY` | 私钥全文（对应服务器 `~/.ssh/authorized_keys`） |
| `SERVER_PORT` | 可选，SSH 端口，供 `.github/workflows/deploy-backend.yml` 的 `appleboy/ssh-action` 使用，默认 22 |
| `DEPLOY_PATH` | 可选，默认 `/opt/teenage-life-assistant` |

### 3. 工作流文件

已包含 [.github/workflows/deploy-backend.yml](../.github/workflows/deploy-backend.yml)。

- 推送到 `main` 且 `backend/` 或 `docker-compose.yml` 有变更时自动部署
- 也可在 Actions 页手动 Run workflow

### 4. 前端怎么发布？

Action **只部署后端 API**。小程序仍需本地：

```bash
cd frontend
pnpm install
pnpm build:weapp
# 修改 frontend/config/prod.ts 里的 API_BASE 为你的 HTTPS 域名
```

然后用微信开发者工具打开 `frontend/dist` 上传体验版/正式版。

## 方式三：systemd + Nginx

```bash
cd backend
go build -o app ./cmd/server
sudo mkdir -p /opt/teenage-life-assistant /var/lib/teenage
sudo cp app /opt/teenage-life-assistant/backend/
sudo cp config/.env /opt/teenage-life-assistant/backend/config/
sudo cp deploy/teenage-life-assistant.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now teenage-life-assistant
```

Nginx 参考 [deploy/nginx.conf](../deploy/nginx.conf)，配置 HTTPS 后在微信小程序后台添加 request 合法域名。

## SQLite 备份

```bash
chmod +x deploy/backup.sh
# crontab: 0 3 * * * DB_PATH=/var/lib/teenage/data.db /opt/teenage-life-assistant/deploy/backup.sh
```

Docker 部署时数据库在 volume `sqlite_data`，容器内路径 `/app/data/data.db`。

## 开发联调

- 后端默认 `DEV_MOCK_WECHAT=true`，开发时可跳过真实微信登录
- 前端 dev 环境 API 地址：`http://localhost:8080`（见 `frontend/config/dev.ts`）
- 开发者工具需勾选「不校验合法域名」
