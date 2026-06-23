# API 文档

## 认证

### POST /api/auth/login
```json
{ "code": "wx.login 返回的 code" }
```

## 家庭

- POST /api/families `{ "name": "我们家" }`
- POST /api/families/join `{ "invite_code": "ABC123" }`
- GET /api/families/me

## 孩子

- GET /api/kids
- POST /api/kids `{ "name": "宝宝", "gender": "女" }`
- GET /api/kids/:id/points

## 积分行为

- GET /api/point-actions/import-template
- GET /api/point-actions?type=add|subtract
- POST /api/point-actions
- PUT /api/point-actions/:id
- DELETE /api/point-actions/:id
- POST /api/point-actions/import (multipart file)

## 积分记录

- POST /api/point-records `{ "kid_id": 1, "action_id": 2 }`
- GET /api/point-records?kid_id=1
- GET /api/point-records/summary?kid_id=1
- DELETE /api/point-records/:id

## 奖励

- GET /api/rewards
- POST /api/rewards
- PUT /api/rewards/:id
- DELETE /api/rewards/:id

## 兑换

- POST /api/redemptions `{ "kid_id": 1, "reward_id": 1 }`
- GET /api/redemptions?kid_id=1
- PUT /api/redemptions/:id/fulfill
- PUT /api/redemptions/:id/cancel

除登录和模板下载外，其他接口需 Header: `Authorization: Bearer <token>`
