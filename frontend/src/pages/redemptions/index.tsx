import { View, Text } from '@tarojs/components'
import { Button, Tag } from '@taroify/core'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { redemptionApi } from '@/services/api'
import { useAppStore } from '@/store/app'
import { ensureAuth, ensureFamily, ensureKid, showError } from '@/utils/auth'
import { confirm } from '@/utils/confirm'
import { formatDateTime } from '@/utils/format'
import type { Redemption } from '@/types'
import './index.scss'

const statusMap = {
  pending: { text: '待发放', color: 'warning' as const },
  fulfilled: { text: '已发放', color: 'success' as const },
  cancelled: { text: '已取消', color: 'default' as const }
}

export default function RedemptionsPage() {
  const { currentKidId, kids } = useAppStore()
  const kidId = currentKidId || kids[0]?.id
  const [items, setItems] = useState<Redemption[]>([])

  const loadItems = async () => {
    if (!(await ensureAuth()) || !(await ensureFamily()) || !(await ensureKid()) || !kidId) return
    try {
      const list = await redemptionApi.list(kidId)
      setItems(list)
    } catch (error) {
      showError(error)
    }
  }

  useDidShow(() => {
    loadItems()
  })

  const handleFulfill = async (item: Redemption) => {
    try {
      await redemptionApi.fulfill(item.id)
      Taro.showToast({ title: '已标记发放', icon: 'success' })
      loadItems()
    } catch (error) {
      showError(error)
    }
  }

  const handleCancel = async (item: Redemption) => {
    const ok = await confirm('取消兑换', `取消后将退回 ${item.points_cost} 分，确定吗？`)
    if (!ok) return
    try {
      await redemptionApi.cancel(item.id)
      Taro.showToast({ title: '已取消', icon: 'success' })
      loadItems()
    } catch (error) {
      showError(error)
    }
  }

  return (
    <View className='page redemptions-page'>
      {items.length === 0 ? (
        <View className='empty-tip'>暂无兑换记录</View>
      ) : (
        items.map((item) => {
          const status = statusMap[item.status]
          return (
            <View className='card redemption-card' key={item.id}>
              <View className='redemption-head'>
                <Text className='reward-name'>{item.reward?.name || '奖励'}</Text>
                <Tag color={status.color}>{status.text}</Tag>
              </View>
              <Text className='meta'>消耗 {item.points_cost} 分 · {formatDateTime(item.created_at)}</Text>
              {item.status === 'pending' && (
                <View className='actions'>
                  <Button size='small' color='success' onClick={() => handleFulfill(item)}>标记已发放</Button>
                  <Button size='small' variant='outlined' onClick={() => handleCancel(item)}>取消兑换</Button>
                </View>
              )}
            </View>
          )
        })
      )}
    </View>
  )
}
