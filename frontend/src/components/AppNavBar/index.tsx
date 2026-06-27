import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { CSSProperties, ReactNode } from 'react'
import './index.scss'

interface AppNavBarProps {
  title?: string
  showBack?: boolean
  children?: ReactNode
  className?: string
  onBack?: () => void
}

function getNavStyle() {
  try {
    const system = Taro.getSystemInfoSync()
    const menu = Taro.getMenuButtonBoundingClientRect?.()
    const statusBarHeight = system.statusBarHeight || 0
    const navHeight = menu
      ? menu.height + Math.max(0, menu.top - statusBarHeight) * 2
      : 48

    return {
      paddingTop: `${statusBarHeight}px`,
      height: `${statusBarHeight + navHeight}px`,
      '--app-nav-height': `${navHeight}px`
    } as CSSProperties
  } catch {
    return {
      paddingTop: '24px',
      height: '88px',
      '--app-nav-height': '64px'
    } as CSSProperties
  }
}

export default function AppNavBar({ title, showBack, children, className = '', onBack }: AppNavBarProps) {
  const handleBack = async () => {
    if (onBack) {
      onBack()
      return
    }

    const pages = Taro.getCurrentPages()
    if (pages.length > 1) {
      await Taro.navigateBack()
      return
    }
    await Taro.switchTab({ url: '/pages/index/index' })
  }

  return (
    <View className={`app-nav ${className}`} style={getNavStyle()}>
      <View className='app-nav-inner'>
        {showBack && (
          <View className='app-nav-back' onClick={handleBack}>
            <Text className='app-nav-back-mark'>‹</Text>
          </View>
        )}
        {children || <Text className='app-nav-title'>{title}</Text>}
      </View>
    </View>
  )
}
