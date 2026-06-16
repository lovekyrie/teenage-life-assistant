import Taro from '@tarojs/taro'
import { getToken } from '@/services/request'
import { useAppStore } from '@/store/app'

export async function ensureAuth() {
  const token = getToken()
  if (!token) {
    await Taro.reLaunch({ url: '/pages/login/index' })
    return false
  }
  return true
}

export async function ensureFamily() {
  const { family } = useAppStore.getState()
  if (!family) {
    await Taro.reLaunch({ url: '/pages/family-setup/index' })
    return false
  }
  return true
}

export async function ensureKid() {
  const { kids } = useAppStore.getState()
  if (!kids.length) {
    await Taro.showModal({
      title: '提示',
      content: '请先在设置页添加孩子信息',
      confirmText: '去设置',
      success: (res) => {
        if (res.confirm) Taro.navigateTo({ url: '/pages/settings/index' })
      }
    })
    return false
  }
  return true
}

export function showError(error: unknown) {
  const message = error instanceof Error ? error.message : '操作失败'
  Taro.showToast({ title: message, icon: 'none' })
}
