import { View, Text, Image } from '@tarojs/components'
import { Button } from '@taroify/core'
import Taro from '@tarojs/taro'
import AppNavBar from '@/components/AppNavBar'
import AssetImage from '@/components/AssetImage'
import { remoteStaticUiAsset, uiImages } from '@/assets/ui'
import { downloadFile } from '@/services/request'
import { showError } from '@/utils/auth'
import './index.scss'

const steps = [
  {
    title: '创建家庭',
    desc: '登录后创建家庭空间，复制邀请码给其他家长加入。',
    icon: uiImages.iconGroup
  },
  {
    title: '添加孩子',
    desc: '在设置页添加孩子姓名，日常积分会按孩子分别统计。',
    icon: uiImages.iconChild
  },
  {
    title: '准备模板',
    desc: '下载 Excel 模板，按表头填写加分行为、扣分行为和奖励。',
    icon: uiImages.iconFileExcel
  },
  {
    title: '上传导入',
    desc: '上传填好的 Excel 后，模板里的行为和奖励会立即生效。',
    icon: uiImages.iconUpload
  },
  {
    title: '日常记录',
    desc: '在首页选择增加积分或减少积分，点击对应行为即可完成记录。',
    icon: uiImages.iconPencil
  },
  {
    title: '兑换奖励',
    desc: '孩子积分足够后可兑换奖励，家长可在兑换记录中标记发放。',
    icon: uiImages.iconGiftLine
  }
]

export default function GuidePage() {
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

  return (
    <View className='page guide-page'>
      <View className='guide-top'>
        <AppNavBar title='使用说明' showBack />
      </View>

      <View className='guide-hero'>
        <View className='guide-hero-copy'>
          <Text className='eyebrow'>使用说明</Text>
          <Text className='guide-title'>从模板到积分记录</Text>
          <Text className='guide-subtitle'>按顺序完成配置后，就可以开始记录成长积分和兑换奖励。</Text>
        </View>
        <AssetImage
          className='guide-hero-image'
          src={remoteStaticUiAsset('guideHero')}
          fallback={uiImages.guideHero}
        />
      </View>

      <View className='guide-section'>
        <Text className='section-title'>配置步骤</Text>
        {steps.map((step, index) => (
          <View className='step-row' key={step.title}>
            <Text className='step-index'>{index + 1}</Text>
            <Image className='step-icon' src={step.icon} mode='aspectFit' />
            <View className='step-content'>
              <Text className='step-title'>{step.title}</Text>
              <Text className='step-desc'>{step.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View className='bottom-bar'>
        <Button color='primary' block onClick={handleDownloadTemplate}>下载 Excel 模板</Button>
      </View>
    </View>
  )
}
