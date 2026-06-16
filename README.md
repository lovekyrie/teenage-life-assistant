# 家庭积分小程序

基于 Taro 4 + 微信小程序 + Go/Gin/GORM/SQLite 的儿童积分管理系统。

## 功能

- 微信登录 + 家庭邀请码共享
- 积分行为 Excel 导入
- 按分值分组的加分/减分
- 奖励兑换全流程

## 目录

```
├── backend/    # Go API 服务
├── frontend/   # Taro 微信小程序
└── docs/       # 文档与 Excel 模板说明
```

## 快速开始

### 后端

```bash
cd backend
cp config/.env.example config/.env
# 编辑 .env 填入微信 AppID/AppSecret
go mod tidy
go run ./cmd/server
```

默认监听 `http://localhost:8080`，SQLite 文件位于 `backend/data/data.db`。

### 前端

```bash
cd frontend
pnpm install
pnpm dev:weapp
```

用微信开发者工具打开 `frontend/dist` 目录。

## Excel 导入模板

见 [docs/excel-template.md](docs/excel-template.md)。

## 部署

见 [docs/deploy.md](docs/deploy.md)。
