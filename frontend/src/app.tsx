import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { getToken } from '@/services/request'
import { restoreSessionIfLoggedIn } from '@/utils/auth'
import './app.scss'

export default function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    if (getToken()) {
      restoreSessionIfLoggedIn()
    }
  })

  return children
}
