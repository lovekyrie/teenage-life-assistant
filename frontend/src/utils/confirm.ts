import Taro from '@tarojs/taro'

export function confirm(title: string, content: string): Promise<boolean> {
  return new Promise((resolve) => {
    Taro.showModal({
      title,
      content,
      success: (res) => resolve(!!res.confirm)
    })
  })
}
