import { View, Text } from '@tarojs/components'
import { Button, Field, Input, Tabs } from '@taroify/core'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { familyApi } from '@/services/api'
import { useAppStore } from '@/store/app'
import { ensureAuth, showError, syncFamilyFromServer } from '@/utils/auth'
import type { User } from '@/types'
import './index.scss'

export default function FamilySetupPage() {
  const { setFamilyData } = useAppStore()
  const updateUser = (user: User) => useAppStore.setState({ user })
  const [tab, setTab] = useState(0)
  const [familyName, setFamilyName] = useState('我们家')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)

  useDidShow(async () => {
    if (!(await ensureAuth())) return
    try {
      await syncFamilyFromServer()
      await Taro.reLaunch({ url: '/pages/index/index' })
    } catch {
      // 未加入家庭，留在当前页
    }
  })

  const goHome = async () => {
    await syncFamilyFromServer()
    await Taro.reLaunch({ url: '/pages/index/index' })
  }

  const handleCreate = async () => {
    if (!familyName.trim()) {
      Taro.showToast({ title: '请输入家庭名称', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      const result = await familyApi.create(familyName.trim())
      updateUser(result.user)
      setFamilyData(result.family, [])
      Taro.showToast({ title: '创建成功', icon: 'success' })
      await Taro.reLaunch({ url: '/pages/settings/index' })
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message.includes('已加入家庭')) {
        await goHome()
        return
      }
      showError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      Taro.showToast({ title: '请输入邀请码', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      const result = await familyApi.join(inviteCode.trim().toUpperCase())
      updateUser(result.user)
      await goHome()
    } catch (error) {
      showError(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='family-setup page'>
      <View className='card intro'>
        <Text className='intro-title'>加入家庭空间</Text>
        <Text className='intro-desc'>创建家庭后可获得邀请码，爸爸妈妈可共享同一份积分数据</Text>
      </View>

      <Tabs value={tab} onChange={setTab}>
        <Tabs.TabPane title='创建家庭'>
          <View className='card'>
            <Field label='家庭名称'>
              <Input
                placeholder='例如：我们家'
                value={familyName}
                onChange={(e) => setFamilyName(e.detail.value)}
              />
            </Field>
            <Button color='primary' block loading={loading} onClick={handleCreate}>
              创建并获取邀请码
            </Button>
          </View>
        </Tabs.TabPane>
        <Tabs.TabPane title='加入家庭'>
          <View className='card'>
            <Field label='邀请码'>
              <Input
                placeholder='6位邀请码'
                value={inviteCode}
                onChange={(e) => setInviteCode(e.detail.value)}
              />
            </Field>
            <Button color='primary' block loading={loading} onClick={handleJoin}>
              加入家庭
            </Button>
          </View>
        </Tabs.TabPane>
      </Tabs>
    </View>
  )
}
