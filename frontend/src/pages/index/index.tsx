import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage } from '@tarojs/taro'
import { useState } from 'react'
import AppNavBar from '@/components/AppNavBar'
import AssetImage from '@/components/AssetImage'
import { remoteStaticUiAsset, resolveActionFallback, uiImages } from '@/assets/ui'
import { familyApi, recordApi, rewardApi } from '@/services/api'
import { getToken } from '@/services/request'
import { useAppStore } from '@/store/app'
import { ensureFamily, showError } from '@/utils/auth'
import { formatDateTime } from '@/utils/format'
import type { PointRecord, PointSummary, Reward } from '@/types'
import './index.scss'

const guestSummary: PointSummary = {
  total_points: 36,
  today_add: 5,
  today_sub: 0,
  today_net: 5
}

const guestRecords: PointRecord[] = [
  {
    id: -1,
    kid_id: 0,
    action_id: -1,
    type: 'add',
    points: 3,
    note: '',
    created_at: '2026-06-01T08:30:00+08:00',
    action: {
      id: -1,
      type: 'add',
      category: '学习',
      name: '主动完成作业',
      points: 3,
      description: '',
      sort_order: 1,
      enabled: true
    }
  },
  {
    id: -2,
    kid_id: 0,
    action_id: -2,
    type: 'add',
    points: 2,
    note: '',
    created_at: '2026-06-01T07:50:00+08:00',
    action: {
      id: -2,
      type: 'add',
      category: '生活',
      name: '按时起床洗漱',
      points: 2,
      description: '',
      sort_order: 2,
      enabled: true
    }
  },
  {
    id: -3,
    kid_id: 0,
    action_id: -3,
    type: 'subtract',
    points: 1,
    note: '',
    created_at: '2026-05-31T20:10:00+08:00',
    action: {
      id: -3,
      type: 'subtract',
      category: '习惯',
      name: '提醒整理书桌',
      points: 1,
      description: '',
      sort_order: 3,
      enabled: true
    }
  }
]

const guestRewards: Reward[] = [
  {
    id: -1,
    name: '看一集动画片',
    description: '',
    image_url: '',
    points_cost: 20,
    stock: 0,
    enabled: true
  },
  {
    id: -2,
    name: '棒棒糖1个',
    description: '',
    image_url: '',
    points_cost: 50,
    stock: 0,
    enabled: true
  },
  {
    id: -3,
    name: '挑选一份早餐',
    description: '',
    image_url: '',
    points_cost: 50,
    stock: 0,
    enabled: true
  }
]

export default function IndexPage() {
  const { family, kids, currentKidId, setFamilyData, setCurrentKidId } = useAppStore()
  const [summary, setSummary] = useState<PointSummary | null>(null)
  const [records, setRecords] = useState<PointRecord[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])

  const isLoggedIn = Boolean(getToken())
  const visibleKids = isLoggedIn ? kids : []
  const currentKid = visibleKids.find((k) => k.id === currentKidId) || visibleKids[0]
  const heroKidName = currentKid?.name || (isLoggedIn ? '宝贝' : '体验宝贝')
  const displayedSummary = isLoggedIn ? summary : guestSummary
  const displayedRecords = isLoggedIn ? records : guestRecords
  const displayedRewards = isLoggedIn ? rewards : guestRewards
  const familyName = isLoggedIn ? family?.name || '成长积分' : '我们家'

  useShareAppMessage(() => ({
    title: `${family?.name || '成长积分'}：记录每一次进步，兑换小小奖励`,
    path: '/pages/index/index'
  }))

  const loadKidData = async (kidId: number) => {
    const [summaryData, recordList, rewardList] = await Promise.all([
      recordApi.summary(kidId),
      recordApi.list(kidId),
      rewardApi.list()
    ])
    setSummary(summaryData)
    setRecords(recordList.slice(0, 5))
    setRewards(rewardList.slice(0, 6))
  }

  const loadData = async () => {
    if (!getToken() || !(await ensureFamily())) return
    try {
      const familyData = await familyApi.me()
      setFamilyData(familyData.family, familyData.kids)
      const kidId = currentKidId && familyData.kids.some((kid) => kid.id === currentKidId)
        ? currentKidId
        : familyData.kids[0]?.id
      if (!kidId) return
      await loadKidData(kidId)
    } catch (error) {
      showError(error)
    }
  }

  useDidShow(() => {
    loadData()
  })

  const goLogin = async () => {
    await Taro.navigateTo({ url: '/pages/login/index' })
  }

  const requireLogin = async (url: string, mode: 'navigate' | 'switchTab' = 'navigate') => {
    if (getToken()) {
      if (mode === 'switchTab') {
        await Taro.switchTab({ url })
      } else {
        await Taro.navigateTo({ url })
      }
      return
    }

    const result = await Taro.showModal({
      title: '登录后使用',
      content: '当前可以先浏览功能服务。登录后可创建家庭、记录积分并保存奖励兑换数据。',
      confirmText: '去登录',
      cancelText: '继续浏览'
    })
    if (result.confirm) await goLogin()
  }

  const goPointPick = (type: 'add' | 'subtract') => {
    requireLogin(`/pages/point-pick/index?type=${type}`)
  }

  const handleKidChange = async (kidId: number) => {
    setCurrentKidId(kidId)
    try {
      await loadKidData(kidId)
    } catch (error) {
      showError(error)
    }
  }

  return (
    <View className='page home-page'>
      <View className='home-top'>
        <AppNavBar className='home-nav'>
          <View className='home-nav-brand'>
            <Image className='kid-avatar' src={uiImages.kidAvatar} mode='aspectFit' />
            <View className='hero-copy'>
              <Text className='hero-title'>成长积分</Text>
              <Text className='family-label'>{familyName} · {heroKidName}</Text>
            </View>
          </View>
        </AppNavBar>

        {visibleKids.length > 1 && (
          <ScrollView scrollX className='kid-scroll'>
            {visibleKids.map((kid) => (
              <View
                key={kid.id}
                className={`kid-chip ${currentKid?.id === kid.id ? 'active' : ''}`}
                onClick={() => handleKidChange(kid.id)}
              >
                <Text>{kid.name}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        <View className='home-hero'>
          <View className='hero-main'>
            <View className='hero-copy-block'>
              <Text className='hero-card-title'>{heroKidName}的成长积分</Text>
              <Text className='hero-card-desc'>记录每一次成长，积累每一份美好</Text>
              <View className='score-ring'>
                <View className='score-ring-inner'>
                  <Text className='points-label'>当前积分</Text>
                  <Text className='total-points'>{displayedSummary?.total_points ?? 0}</Text>
                  <Text className='ring-star'>★</Text>
                </View>
              </View>
            </View>
            <AssetImage
              className='hero-art-wrap'
              imageClassName='hero-art'
              src={remoteStaticUiAsset('homeHero')}
              fallback={uiImages.heroGrowth}
            />
          </View>

          <View className='today-stats'>
            <View className='stat-card'>
              <Image className='stat-icon' src={uiImages.iconTrend} mode='aspectFit' />
              <Text className='stat-label'>今日净变化</Text>
              <Text className='stat-value add'>
                {displayedSummary && displayedSummary.today_net >= 0 ? '+' : ''}{displayedSummary?.today_net ?? 0}
              </Text>
            </View>
            <View className='stat-card'>
              <Image className='stat-icon' src={uiImages.iconAdd} mode='aspectFit' />
              <Text className='stat-label'>今日加分</Text>
              <Text className='stat-value add'>+{displayedSummary?.today_add ?? 0}</Text>
            </View>
            <View className='stat-card'>
              <Image className='stat-icon' src={uiImages.iconMinus} mode='aspectFit' />
              <Text className='stat-label'>今日扣分</Text>
              <Text className='stat-value sub'>-{displayedSummary?.today_sub ?? 0}</Text>
            </View>
            <View className='stat-card'>
              <Image className='stat-icon' src={uiImages.iconGiftLine} mode='aspectFit' />
              <Text className='stat-label'>奖励数量</Text>
              <Text className='stat-value reward'>{displayedRewards.length}</Text>
            </View>
          </View>
        </View>
      </View>

      {!isLoggedIn && (
        <View className='guest-notice'>
          <Image className='guest-icon' src={uiImages.iconShield} mode='aspectFit' />
          <View className='guest-copy'>
            <Text className='guest-title'>先浏览功能服务</Text>
            <Text className='guest-desc'>当前展示示例数据，登录后再记录真实积分、管理奖励和家庭成员。</Text>
          </View>
          <Text className='guest-login' onClick={goLogin}>登录保存</Text>
        </View>
      )}

      <View className='quick-grid'>
        <View className='quick-card add' onClick={() => goPointPick('add')}>
          <Image className='quick-icon-img' src={uiImages.iconAdd} mode='aspectFit' />
          <Text className='quick-title'>增加积分</Text>
          <Text className='quick-desc'>记录宝贝进步</Text>
          <Image className='quick-arrow' src={uiImages.iconArrowRight} mode='aspectFit' />
        </View>
        <View className='quick-card subtract' onClick={() => goPointPick('subtract')}>
          <Image className='quick-icon-img' src={uiImages.iconMinus} mode='aspectFit' />
          <Text className='quick-title'>减少积分</Text>
          <Text className='quick-desc'>记录提醒行为</Text>
          <Image className='quick-arrow red' src={uiImages.iconArrowRight} mode='aspectFit' />
        </View>
        <View className='quick-card reward' onClick={() => requireLogin('/pages/rewards/index', 'switchTab')}>
          <Image className='quick-icon-img' src={uiImages.rewardGift} mode='aspectFit' />
          <Text className='quick-title'>兑换奖励</Text>
          <Text className='quick-desc'>查看兑换项目</Text>
          <Image className='quick-arrow gold' src={uiImages.iconArrowRight} mode='aspectFit' />
        </View>
      </View>

      <View className='card content-card'>
        <View className='card-header'>
          <Text className='card-title'>最近记录</Text>
          <Text className='link' onClick={() => requireLogin('/pages/records/index')}>全部</Text>
        </View>
        {displayedRecords.length === 0 ? (
          <Text className='empty-inline'>暂无记录，使用上方入口开始记录</Text>
        ) : (
          displayedRecords.map((item) => (
            <View className='record-row' key={item.id}>
              <AssetImage
                className='record-icon'
                src={resolveActionFallback(item.action?.name || item.note, item.action?.category)}
                fallback={item.type === 'subtract' ? uiImages.actionAlert : uiImages.actionStar}
              />
              <View className='record-copy'>
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
    </View>
  )
}
