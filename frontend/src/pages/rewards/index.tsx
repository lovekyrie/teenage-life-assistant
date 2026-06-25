import { View, Text, Image } from '@tarojs/components'
import { Button } from '@taroify/core'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { resolveImageUrl, uiImages } from '@/assets/ui'
import { recordApi, redemptionApi, rewardApi } from '@/services/api'
import { getToken } from '@/services/request'
import { useAppStore } from '@/store/app'
import { ensureAuth, ensureFamily, ensureKid, showError } from '@/utils/auth'
import { confirm } from '@/utils/confirm'
import type { PointSummary, Reward } from '@/types'
import './index.scss'

const guestSummary: PointSummary = {
  total_points: 36,
  today_add: 5,
  today_sub: 0,
  today_net: 5
}

const guestRewards: Reward[] = [
  {
    id: -1,
    name: '看一集动画片',
    description: '完成今天任务后放松一下',
    image_url: '',
    points_cost: 20,
    stock: -1,
    enabled: true
  },
  {
    id: -2,
    name: '周末亲子烘焙',
    description: '一起做一份喜欢的小点心',
    image_url: '',
    points_cost: 50,
    stock: -1,
    enabled: true
  },
  {
    id: -3,
    name: '选择一次早餐',
    description: '从家庭菜单里挑选早餐',
    image_url: '',
    points_cost: 35,
    stock: -1,
    enabled: true
  }
]

export default function RewardsPage() {
  const { currentKidId, kids } = useAppStore()
  const kidId = currentKidId || kids[0]?.id
  const [rewards, setRewards] = useState<Reward[]>([])
  const [summary, setSummary] = useState<PointSummary | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(getToken()))

  const loadData = async () => {
    const loggedIn = Boolean(getToken())
    setIsLoggedIn(loggedIn)
    if (!loggedIn) {
      setRewards(guestRewards)
      setSummary(guestSummary)
      return
    }
    if (!(await ensureAuth()) || !(await ensureFamily()) || !(await ensureKid()) || !kidId) return
    try {
      const [rewardList, summaryData] = await Promise.all([
        rewardApi.list(),
        recordApi.summary(kidId)
      ])
      setRewards(rewardList)
      setSummary(summaryData)
    } catch (error) {
      showError(error)
    }
  }

  useDidShow(() => {
    loadData()
  })

  const promptLogin = async () => {
    const result = await Taro.showModal({
      title: '登录后使用',
      content: '登录后可保存积分、兑换奖励并查看发放记录。',
      confirmText: '去登录',
      cancelText: '继续浏览'
    })
    if (result.confirm) await Taro.navigateTo({ url: '/pages/login/index' })
  }

  const openRedemptions = async () => {
    if (!getToken()) {
      await promptLogin()
      return
    }
    await Taro.navigateTo({ url: '/pages/redemptions/index' })
  }

  const handleRedeem = async (reward: Reward) => {
    if (!getToken()) {
      await promptLogin()
      return
    }
    if (!kidId) return
    const enough = (summary?.total_points ?? 0) >= reward.points_cost
    if (!enough) {
      Taro.showToast({ title: '积分不足', icon: 'none' })
      return
    }
    const ok = await confirm('确认兑换', `使用 ${reward.points_cost} 分兑换「${reward.name}」？`)
    if (!ok) return
    try {
      await redemptionApi.create({ kid_id: kidId, reward_id: reward.id })
      Taro.showToast({ title: '兑换成功', icon: 'success' })
      loadData()
    } catch (error) {
      showError(error)
    }
  }

  return (
    <View className='page rewards-page'>
      <View className='rewards-hero'>
        <View className='hero-copy'>
          <Text className='eyebrow'>{isLoggedIn ? '奖励兑换' : '奖励预览'}</Text>
          <Text className='hero-title'>当前可用积分</Text>
          <Text className='summary-points'>{summary?.total_points ?? 0}</Text>
          <Text className='link' onClick={openRedemptions}>查看兑换记录</Text>
        </View>
        <Image className='hero-image' src={uiImages.rewardGift} mode='aspectFit' />
      </View>

      {rewards.length === 0 ? (
        <View className='empty-tip'>暂无奖励，可在设置页导入 Excel</View>
      ) : (
        rewards.map((reward) => {
          const enough = (summary?.total_points ?? 0) >= reward.points_cost
          const imageSrc = resolveImageUrl(reward.image_url) || uiImages.rewardGift
          return (
            <View className={`card reward-card ${enough ? '' : 'not-enough'}`} key={reward.id}>
              <Image className='reward-image' src={imageSrc} mode='aspectFit' />
              <View className='reward-info'>
                <Text className='reward-name'>{reward.name}</Text>
                {reward.description && <Text className='reward-desc'>{reward.description}</Text>}
                <View className='reward-meta'>
                  <Text className='reward-cost'>{reward.points_cost} 分</Text>
                  {reward.stock >= 0 && <Text className='reward-stock'>剩余 {reward.stock}</Text>}
                </View>
              </View>
              <Button size='small' color='primary' disabled={isLoggedIn && !enough} onClick={() => handleRedeem(reward)}>
                {isLoggedIn ? '兑换' : '登录兑换'}
              </Button>
            </View>
          )
        })
      )}
    </View>
  )
}
