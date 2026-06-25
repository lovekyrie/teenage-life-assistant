import Taro from '@tarojs/taro'
import { familyApi } from '@/services/api'
import { getToken } from '@/services/request'
import { useAppStore } from '@/store/app'

function isNeedFamilyError(message: string) {
  return message.includes('请先加入家庭')
}

/** 从服务端同步家庭数据到本地 */
export async function syncFamilyFromServer() {
  const data = await familyApi.me()
  useAppStore.getState().setFamilyData(data.family, data.kids)
  return data
}

/** 登录后根据服务端状态跳转首页或家庭设置页 */
export async function redirectAfterLogin(needFamily: boolean) {
  try {
    await syncFamilyFromServer()
    await Taro.switchTab({ url: '/pages/index/index' })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (isNeedFamilyError(message) || needFamily) {
      await Taro.reLaunch({ url: '/pages/family-setup/index' })
      return
    }
    throw error
  }
}

/** 有 token 时尝试恢复会话并跳转 */
export async function restoreSessionIfLoggedIn() {
  if (!getToken()) return false
  try {
    await syncFamilyFromServer()
    await Taro.switchTab({ url: '/pages/index/index' })
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (isNeedFamilyError(message)) {
      await Taro.reLaunch({ url: '/pages/family-setup/index' })
      return true
    }
    return false
  }
}

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
  if (family) return true
  if (!(await ensureAuth())) return false

  try {
    await syncFamilyFromServer()
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (isNeedFamilyError(message)) {
      await Taro.reLaunch({ url: '/pages/family-setup/index' })
      return false
    }
    showError(error)
    return false
  }
}

export async function ensureKid() {
  const { kids } = useAppStore.getState()
  if (!kids.length) {
    await Taro.showModal({
      title: '提示',
      content: '请先在设置页添加孩子信息',
      confirmText: '去设置',
      success: (res) => {
        if (res.confirm) Taro.switchTab({ url: '/pages/settings/index' })
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
