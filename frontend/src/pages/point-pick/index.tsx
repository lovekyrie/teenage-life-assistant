import { View, Text, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useMemo, useState } from 'react'
import { uiImages } from '@/assets/ui'
import { actionApi, recordApi } from '@/services/api'
import { useAppStore } from '@/store/app'
import { ensureAuth, ensureFamily, ensureKid, showError } from '@/utils/auth'
import { confirm } from '@/utils/confirm'
import { groupActionsByPoints } from '@/utils/format'
import type { PointAction } from '@/types'
import './index.scss'

export default function PointPickPage() {
  const router = useRouter()
  const type = (router.params.type === 'subtract' ? 'subtract' : 'add') as 'add' | 'subtract'
  const { currentKidId, kids } = useAppStore()
  const kidId = currentKidId || kids[0]?.id
  const [actions, setActions] = useState<PointAction[]>([])
  const [activePoints, setActivePoints] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const groups = useMemo(() => groupActionsByPoints(actions), [actions])
  const currentGroup = groups.find((g) => g.points === activePoints) || groups[0]

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: type === 'add' ? '增加积分' : '减少积分' })
    loadActions()
  }, [type])

  useEffect(() => {
    if (groups.length) setActivePoints(groups[0].points)
  }, [groups])

  const loadActions = async () => {
    if (!(await ensureAuth()) || !(await ensureFamily()) || !(await ensureKid())) return
    try {
      const list = await actionApi.list(type)
      setActions(list)
    } catch (error) {
      showError(error)
    }
  }

  const handlePick = async (action: PointAction) => {
    if (!kidId) return
    const ok = await confirm('确认操作', `${type === 'add' ? '增加' : '减少'} ${action.points} 分：${action.name}`)
    if (!ok) return

    setLoading(true)
    try {
      await recordApi.create({ kid_id: kidId, action_id: action.id })
      Taro.showToast({ title: '操作成功', icon: 'success' })
    } catch (error) {
      showError(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className={`page point-pick-page ${type}`}>
      <View className='point-hero'>
        <View className='point-hero-copy'>
          <Text className='point-eyebrow'>{type === 'add' ? '记录闪光时刻' : '温和提醒行为'}</Text>
          <Text className='point-title'>{type === 'add' ? '增加积分' : '减少积分'}</Text>
          <Text className='point-subtitle'>
            {type === 'add' ? '选择孩子完成的好习惯，马上累积成长积分。' : '记录需要改进的行为，帮助规则持续稳定。'}
          </Text>
        </View>
        <Image className='point-hero-icon' src={type === 'add' ? uiImages.actionStar : uiImages.actionAlert} mode='aspectFit' />
      </View>

      {groups.length === 0 ? (
        <View className='empty-card'>暂无{type === 'add' ? '加分' : '减分'}行为，请先在设置页导入 Excel</View>
      ) : (
        <>
          <View className='point-tabs'>
            {groups.map((group) => (
              <View
                key={group.points}
                className={`point-tab ${currentGroup?.points === group.points ? 'active' : ''}`}
                onClick={() => setActivePoints(group.points)}
              >
                {group.points} 分
              </View>
            ))}
          </View>
          <View className='action-list'>
            {currentGroup?.list.map((action) => (
              <View className='action-card card' key={action.id} onClick={() => !loading && handlePick(action)}>
                <Image className='action-icon' src={type === 'add' ? uiImages.actionStar : uiImages.actionAlert} mode='aspectFit' />
                <View className='action-head'>
                  <Text className='action-name'>{action.name}</Text>
                  <Text className='action-points'>{action.points} 分</Text>
                </View>
                {action.category && <Text className='action-category'>{action.category}</Text>}
                {action.description && <Text className='action-desc'>{action.description}</Text>}
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  )
}
