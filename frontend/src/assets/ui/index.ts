import actionAlert from './action-alert.svg'
import actionStar from './action-star.svg'
import guideHero from './guide-hero.svg'
import heroGrowth from './hero-growth.svg'
import kidAvatar from './kid-avatar.svg'
import rewardGift from './reward-gift.svg'

export const uiImages = {
  actionAlert,
  actionStar,
  guideHero,
  heroGrowth,
  kidAvatar,
  rewardGift
}

export function remoteUiAsset(filename: string) {
  return `${API_BASE}/static/ui/${filename}`
}

export function resolveImageUrl(url?: string) {
  if (!url) return ''
  if (/^https?:\/\//.test(url)) return url
  if (url.startsWith('/')) return `${API_BASE}${url}`
  return url
}
