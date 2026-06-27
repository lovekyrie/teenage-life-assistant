import actionAlert from './action-alert.svg'
import actionStar from './action-star.svg'
import guideHero from './guide-hero.svg'
import heroGrowth from './hero-growth.svg'
import iconAdd from './icon-add.svg'
import iconArrowRight from './icon-arrow-right.svg'
import iconBook from './icon-book.svg'
import iconChair from './icon-chair.svg'
import iconChild from './icon-child.svg'
import iconClock from './icon-clock.svg'
import iconDownload from './icon-download.svg'
import iconFamily from './icon-family.svg'
import iconFileExcel from './icon-file-excel.svg'
import iconGiftLine from './icon-gift-line.svg'
import iconGroup from './icon-group.svg'
import iconMinus from './icon-minus.svg'
import iconPencil from './icon-pencil.svg'
import iconShield from './icon-shield.svg'
import iconSun from './icon-sun.svg'
import iconUpload from './icon-upload.svg'
import iconUser from './icon-user.svg'
import kidAvatar from './kid-avatar.svg'
import rewardGift from './reward-gift.svg'

export const uiImages = {
  actionAlert,
  actionStar,
  guideHero,
  heroGrowth,
  iconAdd,
  iconArrowRight,
  iconBook,
  iconChair,
  iconChild,
  iconClock,
  iconDownload,
  iconFamily,
  iconFileExcel,
  iconGiftLine,
  iconGroup,
  iconMinus,
  iconPencil,
  iconShield,
  iconSun,
  iconUpload,
  iconUser,
  kidAvatar,
  rewardGift
}

export const staticUiAssets = {
  homeHero: 'home-hero-growth.svg',
  settingsFamily: 'settings-family-hero.svg',
  guideHero: 'guide-hero-steps.svg',
  rewardHero: 'reward-hero-gift.svg',
  rewardVideo: 'reward-video.svg',
  rewardLollipop: 'reward-lollipop.svg',
  rewardSnack: 'reward-snack.svg',
  rewardJuice: 'reward-juice.svg',
  rewardToy: 'reward-toy.svg',
  actionToothbrush: 'action-toothbrush.svg',
  actionClothes: 'action-clothes.svg',
  actionVegetables: 'action-vegetables.svg'
} as const

export function remoteUiAsset(filename: string) {
  return `${API_BASE}/static/ui/${filename}`
}

export function resolveImageUrl(url?: string) {
  if (!url) return ''
  if (/^https?:\/\//.test(url)) return url
  if (url.startsWith('/')) return `${API_BASE}${url}`
  return url
}

export function remoteStaticUiAsset(key: keyof typeof staticUiAssets) {
  return remoteUiAsset(staticUiAssets[key])
}

export function resolveRewardFallback(name: string) {
  if (/动画|电影|视频/.test(name)) return remoteStaticUiAsset('rewardVideo')
  if (/糖|棒棒/.test(name)) return remoteStaticUiAsset('rewardLollipop')
  if (/零食|早餐|饼干|点心|小吃/.test(name)) return remoteStaticUiAsset('rewardSnack')
  if (/果汁|饮料|牛奶/.test(name)) return remoteStaticUiAsset('rewardJuice')
  if (/玩具|娃娃|积木/.test(name)) return remoteStaticUiAsset('rewardToy')
  return remoteStaticUiAsset('rewardHero')
}

export function resolveActionFallback(name: string) {
  if (/刷牙|牙/.test(name)) return remoteStaticUiAsset('actionToothbrush')
  if (/衣服|穿衣|整理衣/.test(name)) return remoteStaticUiAsset('actionClothes')
  if (/蔬菜|青菜|吃菜/.test(name)) return remoteStaticUiAsset('actionVegetables')
  return ''
}
