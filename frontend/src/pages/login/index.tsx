import { View, Text } from '@tarojs/components'
import { Button } from '@taroify/core'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { authApi } from '@/services/api'
import { useAppStore } from '@/store/app'
import { showError } from '@/utils/auth'
import './index.scss'

export default function LoginPage() {
  const setAuth = useAppStore((s) => s.setAuth)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    try {
      const { code } = await Taro.login()
      const result = await authApi.login(code)
      setAuth(result.user, result.token)
      if (result.need_family) {
        await Taro.reLaunch({ url: '/pages/family-setup/index' })
      } else {
        await Taro.reLaunch({ url: '/pages/index/index' })
      }
    } catch (error) {
      showError(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='login-page'>
      <View className='hero'>
        <Text className='title'>成长积分</Text>
        <Text className='subtitle'>记录每一次进步，兑换小小奖励</Text>
      </View>
      <Button color='primary' block loading={loading} onClick={handleLogin}>
        微信登录
      </Button>
    </View>
  )
}
