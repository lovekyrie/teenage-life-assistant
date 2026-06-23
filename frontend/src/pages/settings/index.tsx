import { View, Text } from '@tarojs/components'
import { Button, Cell, Field, Input, Tag } from '@taroify/core'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { actionApi, familyApi, kidApi, rewardApi } from '@/services/api'
import { downloadFile, uploadFile } from '@/services/request'
import { useAppStore } from '@/store/app'
import { ensureAuth, ensureFamily, showError } from '@/utils/auth'
import { confirm } from '@/utils/confirm'
import type { PointAction, Reward } from '@/types'
import './index.scss'

export default function SettingsPage() {
  const { family, kids, setFamilyData, logout } = useAppStore()
  const [kidName, setKidName] = useState('')
  const [actions, setActions] = useState<PointAction[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(false)

  const reload = async () => {
    if (!(await ensureAuth()) || !(await ensureFamily())) return
    try {
      const [data, actionList, rewardList] = await Promise.all([
        familyApi.me(),
        actionApi.list(),
        rewardApi.list()
      ])
      setFamilyData(data.family, data.kids)
      setActions(actionList)
      setRewards(rewardList)
    } catch (error) {
      showError(error)
    }
  }

  useDidShow(() => {
    reload()
  })

  const copyInviteCode = () => {
    if (!family?.invite_code) return
    Taro.setClipboardData({
      data: family.invite_code,
      success: () => Taro.showToast({ title: '邀请码已复制', icon: 'success' })
    })
  }

  const handleAddKid = async () => {
    if (!kidName.trim()) {
      Taro.showToast({ title: '请输入孩子姓名', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      await kidApi.create({ name: kidName.trim(), gender: '' })
      setKidName('')
      Taro.showToast({ title: '添加成功', icon: 'success' })
      reload()
    } catch (error) {
      showError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleImportExcel = async () => {
    try {
      const res = await Taro.chooseMessageFile({ count: 1, type: 'file', extension: ['xlsx', 'xls'] })
      const file = res.tempFiles[0]
      if (!file) return
      Taro.showLoading({ title: '导入中' })
      const result = await uploadFile<{ actions_count: number; rewards_count: number; warnings?: string[] }>(
        '/api/point-actions/import',
        file.path
      )
      Taro.hideLoading()
      const warningText = result.warnings?.length ? `\n\n${result.warnings.join('\n')}` : ''
      Taro.showModal({
        title: '导入完成',
        content: `行为 ${result.actions_count} 条，奖励 ${result.rewards_count} 条${warningText}`,
        showCancel: false
      })
      reload()
    } catch (error) {
      Taro.hideLoading()
      showError(error)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      Taro.showLoading({ title: '下载中' })
      const filePath = await downloadFile('/api/point-actions/import-template')
      Taro.hideLoading()
      await Taro.openDocument({
        filePath,
        fileType: 'xlsx',
        showMenu: true
      } as any)
    } catch (error) {
      Taro.hideLoading()
      showError(error)
    }
  }

  const handleDeleteAction = async (action: PointAction) => {
    const ok = await confirm('停用行为', `确定停用「${action.name}」吗？历史记录会保留。`)
    if (!ok) return
    try {
      await actionApi.remove(action.id)
      Taro.showToast({ title: '已停用', icon: 'success' })
      reload()
    } catch (error) {
      showError(error)
    }
  }

  const handleDeleteReward = async (reward: Reward) => {
    const ok = await confirm('停用奖励', `确定停用「${reward.name}」吗？已发放的兑换记录会保留。`)
    if (!ok) return
    try {
      await rewardApi.remove(reward.id)
      Taro.showToast({ title: '已停用', icon: 'success' })
      reload()
    } catch (error) {
      showError(error)
    }
  }

  const handleLogout = () => {
    logout()
    Taro.reLaunch({ url: '/pages/login/index' })
  }

  return (
    <View className='page settings-page'>
      <View className='settings-hero'>
        <View>
          <Text className='eyebrow'>家庭管理</Text>
          <Text className='settings-title'>{family?.name || '成长积分'}</Text>
          <Text className='settings-subtitle'>管理孩子、积分行为和奖励模板</Text>
        </View>
        <View className='invite-pill' onClick={copyInviteCode}>
          <Text className='invite-label'>邀请码</Text>
          <Text className='invite-code'>{family?.invite_code || '-'}</Text>
        </View>
      </View>

      <View className='card import-card'>
        <View className='card-header'>
          <View>
            <Text className='section-title'>数据导入</Text>
            <Text className='hint'>下载模板后按表头填写，再上传 Excel。再次导入会按模板启用行为和奖励，历史记录保留。</Text>
          </View>
        </View>
        <View className='import-actions'>
          <Button color='primary' block onClick={handleDownloadTemplate}>下载模板</Button>
          <Button block variant='outlined' onClick={handleImportExcel}>上传 Excel</Button>
        </View>
        <Text className='guide-link' onClick={() => Taro.navigateTo({ url: '/pages/guide/index' })}>查看使用说明</Text>
      </View>

      <View className='card'>
        <Text className='section-title'>孩子管理</Text>
        {kids.map((kid) => (
          <Cell key={kid.id} title={kid.name} brief={`ID: ${kid.id}`} />
        ))}
        <Field label='孩子姓名'>
          <Input
            placeholder='例如：宝宝'
            value={kidName}
            onChange={(e) => setKidName(e.detail.value)}
          />
        </Field>
        <Button color='primary' block loading={loading} onClick={handleAddKid}>添加孩子</Button>
      </View>

      <View className='card'>
        <Text className='section-title'>积分行为 ({actions.length})</Text>
        {actions.length === 0 ? (
          <Text className='empty-inline'>暂无行为</Text>
        ) : (
          actions.map((a) => (
            <View className='manage-row' key={a.id}>
              <View className='manage-info'>
                <Text className='manage-name'>{a.name}</Text>
                <View className='manage-meta'>
                  <Tag color={a.type === 'add' ? 'success' : 'danger'}>
                    {a.type === 'add' ? '+' : '-'}{a.points} 分
                  </Tag>
                  {a.category && <Text className='meta-text'>{a.category}</Text>}
                </View>
              </View>
              <Button size='small' variant='outlined' color='danger' onClick={() => handleDeleteAction(a)}>停用</Button>
            </View>
          ))
        )}
      </View>

      <View className='card'>
        <Text className='section-title'>奖励 ({rewards.length})</Text>
        {rewards.length === 0 ? (
          <Text className='empty-inline'>暂无奖励</Text>
        ) : (
          rewards.map((r) => (
            <View className='manage-row' key={r.id}>
              <View className='manage-info'>
                <Text className='manage-name'>{r.name}</Text>
                <View className='manage-meta'>
                  <Tag color='primary'>{r.points_cost} 分</Tag>
                  <Text className='meta-text'>库存：{r.stock < 0 ? '无限' : r.stock}</Text>
                </View>
              </View>
              <Button size='small' variant='outlined' color='danger' onClick={() => handleDeleteReward(r)}>停用</Button>
            </View>
          ))
        )}
      </View>

      <View className='card'>
        <Button block variant='outlined' color='danger' onClick={handleLogout}>退出登录</Button>
      </View>
    </View>
  )
}
