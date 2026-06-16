import { View, Text } from '@tarojs/components'
import { Button } from '@taroify/core'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { recordApi } from '@/services/api'
import { useAppStore } from '@/store/app'
import { ensureAuth, ensureFamily, ensureKid, showError } from '@/utils/auth'
import { confirm } from '@/utils/confirm'
import { formatDateTime, groupByDate } from '@/utils/format'
import type { PointRecord } from '@/types'
import './index.scss'

export default function RecordsPage() {
  const { currentKidId, kids } = useAppStore()
  const kidId = currentKidId || kids[0]?.id
  const [records, setRecords] = useState<PointRecord[]>([])

  const loadRecords = async () => {
    if (!(await ensureAuth()) || !(await ensureFamily()) || !(await ensureKid()) || !kidId) return
    try {
      const list = await recordApi.list(kidId)
      setRecords(list)
    } catch (error) {
      showError(error)
    }
  }

  useDidShow(() => {
    loadRecords()
  })

  const handleRevoke = async (record: PointRecord) => {
    const ok = await confirm('撤销记录', `确定撤销「${record.action?.name || '该记录'}」吗？`)
    if (!ok) return
    try {
      await recordApi.revoke(record.id)
      Taro.showToast({ title: '已撤销', icon: 'success' })
      loadRecords()
    } catch (error) {
      showError(error)
    }
  }

  const groups = groupByDate(records)

  return (
    <View className='page records-page'>
      {groups.length === 0 ? (
        <View className='empty-tip'>暂无积分记录</View>
      ) : (
        groups.map((group) => (
          <View key={group.date}>
            <Text className='section-title'>{group.date}</Text>
            {group.list.map((item) => (
              <View className='card record-card' key={item.id}>
                <View className='record-main'>
                  <Text className='record-name'>{item.action?.name || item.note || '积分变动'}</Text>
                  <Text className='record-time'>{formatDateTime(item.created_at)}</Text>
                </View>
                <View className='record-side'>
                  <Text className={item.type === 'add' ? 'points-add' : 'points-sub'}>
                    {item.type === 'add' ? '+' : '-'}{item.points}
                  </Text>
                  <Button size='small' variant='outlined' onClick={() => handleRevoke(item)}>撤销</Button>
                </View>
              </View>
            ))}
          </View>
        ))
      )}
    </View>
  )
}
