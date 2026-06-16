import { View, Text, ScrollView } from '@tarojs/components'
import { Button } from '@taroify/core'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { familyApi, recordApi, rewardApi } from '@/services/api'
import { useAppStore } from '@/store/app'
import { ensureAuth, ensureFamily, showError } from '@/utils/auth'
import { formatDateTime } from '@/utils/format'
import type { PointRecord, PointSummary, Reward } from '@/types'
import './index.scss'

export default function IndexPage() {
  const { family, kids, currentKidId, setFamilyData } = useAppStore()
  const [summary, setSummary] = useState<PointSummary | null>(null)
  const [records, setRecords] = useState<PointRecord[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])

  const currentKid = kids.find((k) => k.id === currentKidId) || kids[0]

  const loadData = async () => {
    if (!(await ensureAuth()) || !(await ensureFamily())) return
    try {
      const familyData = await familyApi.me()
      setFamilyData(familyData.family, familyData.kids)
      const kidId = currentKidId || familyData.kids[0]?.id
      if (!kidId) return
      const [summaryData, recordList, rewardList] = await Promise.all([
        recordApi.summary(kidId),
        recordApi.list(kidId),
        rewardApi.list()
      ])
      setSummary(summaryData)
      setRecords(recordList.slice(0, 5))
      setRewards(rewardList.slice(0, 6))
    } catch (error) {
      showError(error)
    }
  }

  useDidShow(() => {
    loadData()
  })

  const goPointPick = (type: 'add' | 'subtract') => {
    Taro.navigateTo({ url: `/pages/point-pick/index?type=${type}` })
  }

  return (
    <View className='page home-page'>
      <View className='card points-card'>
        <Text className='kid-name'>{currentKid?.name || '宝贝'} 的积分</Text>
        <Text className='total-points'>{summary?.total_points ?? 0}</Text>
        <Text className='today-net'>
          今日 {summary && summary.today_net >= 0 ? '+' : ''}{summary?.today_net ?? 0}
          （+{summary?.today_add ?? 0} / -{summary?.today_sub ?? 0}）
        </Text>
      </View>

      <View className='card'>
        <View className='card-header'>
          <Text className='card-title'>最近记录</Text>
          <Text className='link' onClick={() => Taro.navigateTo({ url: '/pages/records/index' })}>全部</Text>
        </View>
        {records.length === 0 ? (
          <Text className='empty-inline'>暂无记录，点击下方按钮开始记录</Text>
        ) : (
          records.map((item) => (
            <View className='record-row' key={item.id}>
              <View>
                <Text className='record-name'>{item.action?.name || item.note || '积分变动'}</Text>
                <Text className='record-time'>{formatDateTime(item.created_at)}</Text>
              </View>
              <Text className={item.type === 'add' ? 'points-add' : 'points-sub'}>
                {item.type === 'add' ? '+' : '-'}{item.points}
              </Text>
            </View>
          ))
        )}
      </View>

      <View className='card'>
        <View className='card-header'>
          <Text className='card-title'>可兑换奖励</Text>
          <Text className='link' onClick={() => Taro.navigateTo({ url: '/pages/rewards/index' })}>更多</Text>
        </View>
        <ScrollView scrollX className='reward-scroll'>
          {rewards.map((reward) => {
            const enough = (summary?.total_points ?? 0) >= reward.points_cost
            return (
              <View className={`reward-chip ${enough ? '' : 'disabled'}`} key={reward.id}>
                <Text className='reward-name'>{reward.name}</Text>
                <Text className='reward-cost'>{reward.points_cost} 分</Text>
              </View>
            )
          })}
          {rewards.length === 0 && <Text className='empty-inline'>暂无奖励，可在设置页导入</Text>}
        </ScrollView>
      </View>

      <View className='bottom-bar'>
        <Button color='success' onClick={() => goPointPick('add')}>+ 增加积分</Button>
        <Button color='warning' onClick={() => goPointPick('subtract')}>- 减少积分</Button>
        <Button color='primary' onClick={() => Taro.navigateTo({ url: '/pages/rewards/index' })}>兑换奖励</Button>
      </View>

      <View className='settings-entry' onClick={() => Taro.navigateTo({ url: '/pages/settings/index' })}>
        <Text>{family?.name || '设置'}</Text>
      </View>
    </View>
  )
}
