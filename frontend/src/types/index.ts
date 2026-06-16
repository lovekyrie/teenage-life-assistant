export interface User {
  id: number
  family_id?: number | null
  openid: string
  nickname: string
  avatar: string
  role: string
}

export interface Family {
  id: number
  name: string
  invite_code: string
}

export interface Kid {
  id: number
  family_id: number
  name: string
  gender: string
  avatar: string
}

export interface PointAction {
  id: number
  type: 'add' | 'subtract'
  category: string
  name: string
  points: number
  description: string
  daily_limit?: number | null
  sort_order: number
  enabled: boolean
}

export interface PointRecord {
  id: number
  kid_id: number
  action_id?: number
  type: 'add' | 'subtract'
  points: number
  note: string
  created_at: string
  action?: PointAction
}

export interface Reward {
  id: number
  name: string
  description: string
  image_url: string
  points_cost: number
  stock: number
  enabled: boolean
}

export interface Redemption {
  id: number
  kid_id: number
  reward_id: number
  points_cost: number
  status: 'pending' | 'fulfilled' | 'cancelled'
  created_at: string
  fulfilled_at?: string
  reward?: Reward
}

export interface PointSummary {
  total_points: number
  today_add: number
  today_sub: number
  today_net: number
}

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data?: T
}

export interface LoginResult {
  token: string
  need_family: boolean
  user: User
}
