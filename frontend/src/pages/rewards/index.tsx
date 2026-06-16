import { View, Text } from '@tarojs/components'
import { Button } from '@taroify/core'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { recordApi, redemptionApi, rewardApi } from '@/services/api'
import { useAppStore } from '@/store/app'
import { ensureAuth, ensureFamily, ensureKid, showError } from '@/utils/auth'
import { confirm } from '@/utils/confirm'
import type { PointSummary, Reward } from '@/types'
import './index.scss'

export default function RewardsPage() {
  const { currentKidId, kids } = useAppStore()
  const kidId = currentKidId || kids[0]?.id
  const [rewards, setRewards] = useState<Reward[]>([])
  const [summary, setSummary] = useState<PointSummary | null>(null)

  const loadData = async () => {
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

  const handleRedeem = async (reward: Reward) => {
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
      <View className='summary-bar card'>
        <Text>当前可用积分</Text>
        <Text className='summary-points'>{summary?.total_points ?? 0}</Text>
        <Text className='link' onClick={() => Taro.navigateTo({ url: '/pages/redemptions/index' })}>查看兑换记录</Text>
      </View>

      {rewards.length === 0 ? (
        <View className='empty-tip'>暂无奖励，可在设置页导入 Excel</View>
      ) : (
        rewards.map((reward) => {
          const enough = (summary?.total_points ?? 0) >= reward.points_cost
          return (
            <View className='card reward-card' key={reward.id}>
              <View>
                <Text className='reward-name'>{reward.name}</Text>
                {reward.description && <Text className='reward-desc'>{reward.description}</Text>}
                <Text className='reward-cost'>{reward.points_cost} 分</Text>
              </View>
              <Button size='small' color='primary' disabled={!enough} onClick={() => handleRedeem(reward)}>
                兑换
              </Button>
            </View>
          )
        })
      )}
    </View>
  )
}
