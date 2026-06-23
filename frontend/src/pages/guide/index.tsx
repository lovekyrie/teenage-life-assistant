import { View, Text } from '@tarojs/components'
import { Button } from '@taroify/core'
import Taro from '@tarojs/taro'
import { downloadFile } from '@/services/request'
import { showError } from '@/utils/auth'
import './index.scss'

const steps = [
  {
    title: '创建家庭',
    desc: '登录后创建家庭空间，复制邀请码给其他家长加入。'
  },
  {
    title: '添加孩子',
    desc: '在设置页添加孩子姓名，日常积分会按孩子分别统计。'
  },
  {
    title: '准备模板',
    desc: '下载 Excel 模板，按表头填写加分行为、扣分行为和奖励。'
  },
  {
    title: '上传导入',
    desc: '上传填好的 Excel 后，模板里的行为和奖励会立即生效。'
  },
  {
    title: '日常记录',
    desc: '在首页选择增加积分或减少积分，点击对应行为即可完成记录。'
  },
  {
    title: '兑换奖励',
    desc: '孩子积分足够后可兑换奖励，家长可在兑换记录中标记发放。'
  }
]

const fields = [
  { name: '类型', value: 'add 表示加分，subtract 表示扣分' },
  { name: '类别', value: '用于分组展示，如生活、学习、礼貌' },
  { name: '行为名称', value: '孩子看到的具体行为名称' },
  { name: '分值', value: '正整数，只填写数字' },
  { name: '每日上限', value: '可留空；填写后限制当天使用次数' },
  { name: '库存', value: '奖励库存留空表示不限量，0 表示暂不可兑换' }
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
      <View className='guide-hero'>
        <Text className='eyebrow'>使用说明</Text>
        <Text className='guide-title'>从模板到积分记录</Text>
        <Text className='guide-subtitle'>按顺序完成配置后，就可以开始记录成长积分和兑换奖励。</Text>
      </View>

      <View className='guide-section'>
        <Text className='section-title'>配置步骤</Text>
        {steps.map((step, index) => (
          <View className='step-row' key={step.title}>
            <Text className='step-index'>{index + 1}</Text>
            <View className='step-content'>
              <Text className='step-title'>{step.title}</Text>
              <Text className='step-desc'>{step.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View className='guide-section'>
        <Text className='section-title'>模板填写</Text>
        {fields.map((field) => (
          <View className='field-row' key={field.name}>
            <Text className='field-name'>{field.name}</Text>
            <Text className='field-value'>{field.value}</Text>
          </View>
        ))}
      </View>

      <View className='guide-section notice-section'>
        <Text className='section-title'>导入规则</Text>
        <Text className='notice-text'>请保留工作表名称和表头顺序，不要合并单元格。</Text>
        <Text className='notice-text'>再次导入时，未出现在新模板里的旧行为和旧奖励会停用，历史记录不会删除。</Text>
      </View>

      <View className='bottom-bar'>
        <Button color='primary' block onClick={handleDownloadTemplate}>下载 Excel 模板</Button>
      </View>
    </View>
  )
}
