import { request } from './request'
import type {
  Family,
  Kid,
  LoginResult,
  PointAction,
  PointRecord,
  PointSummary,
  Redemption,
  Reward,
  User
} from '@/types'

export const authApi = {
  login: (code: string) =>
    request<LoginResult>({ url: '/api/auth/login', method: 'POST', data: { code }, auth: false })
}

export const familyApi = {
  create: (name: string) =>
    request<{ family: Family; user: User }>({
      url: '/api/families',
      method: 'POST',
      data: { name }
    }),
  join: (invite_code: string) =>
    request<{ family: Family; user: User }>({
      url: '/api/families/join',
      method: 'POST',
      data: { invite_code }
    }),
  me: () => request<{ family: Family; kids: Kid[] }>({ url: '/api/families/me' })
}

export const kidApi = {
  create: (data: Partial<Kid>) =>
    request<Kid>({ url: '/api/kids', method: 'POST', data: data as Record<string, unknown> }),
  points: (id: number) =>
    request<PointSummary & { kid_id: number }>({ url: `/api/kids/${id}/points` })
}

export const actionApi = {
  list: (type?: string) =>
    request<PointAction[]>({ url: `/api/point-actions${type ? `?type=${type}` : ''}` }),
  create: (data: Partial<PointAction>) =>
    request<PointAction>({
      url: '/api/point-actions',
      method: 'POST',
      data: data as Record<string, unknown>
    }),
  update: (id: number, data: Partial<PointAction>) =>
    request<PointAction>({
      url: `/api/point-actions/${id}`,
      method: 'PUT',
      data: data as Record<string, unknown>
    }),
  remove: (id: number) =>
    request<null>({ url: `/api/point-actions/${id}`, method: 'DELETE' })
}

export const recordApi = {
  create: (data: { kid_id: number; action_id: number; note?: string }) =>
    request<PointRecord>({ url: '/api/point-records', method: 'POST', data }),
  list: (kidId: number) =>
    request<PointRecord[]>({ url: `/api/point-records?kid_id=${kidId}` }),
  summary: (kidId: number) =>
    request<PointSummary>({ url: `/api/point-records/summary?kid_id=${kidId}` }),
  revoke: (id: number) => request<null>({ url: `/api/point-records/${id}`, method: 'DELETE' })
}

export const rewardApi = {
  list: () => request<Reward[]>({ url: '/api/rewards' }),
  create: (data: Partial<Reward>) =>
    request<Reward>({
      url: '/api/rewards',
      method: 'POST',
      data: data as Record<string, unknown>
    }),
  update: (id: number, data: Partial<Reward>) =>
    request<Reward>({
      url: `/api/rewards/${id}`,
      method: 'PUT',
      data: data as Record<string, unknown>
    }),
  remove: (id: number) => request<null>({ url: `/api/rewards/${id}`, method: 'DELETE' })
}

export const redemptionApi = {
  create: (data: { kid_id: number; reward_id: number }) =>
    request<Redemption>({ url: '/api/redemptions', method: 'POST', data }),
  list: (kidId: number) =>
    request<Redemption[]>({ url: `/api/redemptions?kid_id=${kidId}` }),
  fulfill: (id: number) =>
    request<Redemption>({ url: `/api/redemptions/${id}/fulfill`, method: 'PUT' }),
  cancel: (id: number) =>
    request<Redemption>({ url: `/api/redemptions/${id}/cancel`, method: 'PUT' })
}
