import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useMemo, useState } from 'react'
import AppNavBar from '@/components/AppNavBar'
import AssetImage from '@/components/AssetImage'
import { resolveActionFallback, uiImages } from '@/assets/ui'
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
      <View className='point-top'>
        <AppNavBar title={type === 'add' ? '增加积分' : '减少积分'} showBack />
      </View>

      {groups.length === 0 ? (
        <View className='empty-card'>暂无{type === 'add' ? '加分' : '减分'}行为，请先在设置页导入 Excel</View>
      ) : (
        <>
          <ScrollView scrollX className='point-tabs'>
            {groups.map((group) => (
              <View
                key={group.points}
                className={`point-tab ${currentGroup?.points === group.points ? 'active' : ''}`}
                onClick={() => setActivePoints(group.points)}
              >
                <Text>{group.points} 分</Text>
                {type === 'add' && group.points === 1 && <Text className='tab-star'>★</Text>}
              </View>
            ))}
          </ScrollView>
          <View className='action-list'>
            {currentGroup?.list.map((action) => (
              <View className='action-card' key={action.id} onClick={() => !loading && handlePick(action)}>
                <AssetImage
                  className='action-icon'
                  src={resolveActionFallback(action.name, action.category)}
                  fallback={type === 'add' ? uiImages.actionStar : uiImages.actionAlert}
                />
                <View className='action-head'>
                  <Text className='action-name'>{action.name}</Text>
                  <Text className='action-points'>{action.points} 分</Text>
                </View>
                {action.category && <Text className='action-category'>{action.category}</Text>}
                {action.description && <Text className='action-desc'>{action.description}</Text>}
                <Text className='action-watermark'>★</Text>
                <Text className='action-arrow'>›</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  )
}
