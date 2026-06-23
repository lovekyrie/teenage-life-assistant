import Taro from '@tarojs/taro'
import type { ApiResponse } from '@/types'

const TOKEN_KEY = 'token'

export function getToken() {
  return Taro.getStorageSync(TOKEN_KEY) as string
}

export function setToken(token: string) {
  Taro.setStorageSync(TOKEN_KEY, token)
}

export function clearToken() {
  Taro.removeStorageSync(TOKEN_KEY)
}

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, unknown>
  auth?: boolean
}

let redirectingToLogin = false

async function handleUnauthorized() {
  if (redirectingToLogin) return
  redirectingToLogin = true
  clearToken()
  try {
    await Taro.reLaunch({ url: '/pages/login/index' })
  } finally {
    setTimeout(() => {
      redirectingToLogin = false
    }, 500)
  }
}

export async function request<T>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, auth = true } = options
  const header: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  if (auth) {
    const token = getToken()
    if (token) header.Authorization = `Bearer ${token}`
  }

  const res = await Taro.request<ApiResponse<T>>({
    url: `${API_BASE}${url}`,
    method,
    data,
    header
  })

  if (res.statusCode === 401) {
    await handleUnauthorized()
    throw new Error('登录已失效')
  }

  const body = res.data
  if (body.code !== 0) {
    throw new Error(body.message || '请求失败')
  }
  return body.data as T
}

export async function uploadFile<T>(url: string, filePath: string, name = 'file'): Promise<T> {
  const token = getToken()
  const res = await Taro.uploadFile({
    url: `${API_BASE}${url}`,
    filePath,
    name,
    header: token ? { Authorization: `Bearer ${token}` } : {}
  })
  if (res.statusCode === 401) {
    await handleUnauthorized()
    throw new Error('登录已失效')
  }
  const body = JSON.parse(res.data) as ApiResponse<T>
  if (body.code !== 0) {
    throw new Error(body.message || '上传失败')
  }
  return body.data as T
}

export async function downloadFile(url: string): Promise<string> {
  const token = getToken()
  const res = await Taro.downloadFile({
    url: `${API_BASE}${url}`,
    header: token ? { Authorization: `Bearer ${token}` } : {}
  })
  if (res.statusCode === 401) {
    await handleUnauthorized()
    throw new Error('登录已失效')
  }
  if (res.statusCode !== 200) {
    throw new Error('下载失败')
  }
  return res.tempFilePath
}
