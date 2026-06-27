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
import iconDownloadWhite from './icon-download-white.svg'
import iconFamily from './icon-family.svg'
import iconFileExcel from './icon-file-excel.svg'
import iconGiftLine from './icon-gift-line.svg'
import iconGroup from './icon-group.svg'
import iconMinus from './icon-minus.svg'
import iconPencil from './icon-pencil.svg'
import iconShield from './icon-shield.svg'
import iconSun from './icon-sun.svg'
import iconTrend from './icon-trend.svg'
import iconUpload from './icon-upload.svg'
import iconUploadPlain from './icon-upload-plain.svg'
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
  iconDownloadWhite,
  iconFamily,
  iconFileExcel,
  iconGiftLine,
  iconGroup,
  iconMinus,
  iconPencil,
  iconShield,
  iconSun,
  iconTrend,
  iconUpload,
  iconUploadPlain,
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
  actionVegetables: 'action-vegetables.svg',
  actionSleep: 'action-sleep.svg',
  actionSchool: 'action-school.svg',
  actionWakeup: 'action-wakeup.svg',
  actionHousework: 'action-housework.svg',
  actionFriends: 'action-friends.svg',
  actionSports: 'action-sports.svg',
  actionCleanup: 'action-cleanup.svg',
  actionEnglish: 'action-english.svg',
  actionReading: 'action-reading.svg',
  actionExercise: 'action-exercise.svg',
  actionMedal: 'action-medal.svg',
  actionDishonest: 'action-dishonest.svg',
  actionTantrum: 'action-tantrum.svg',
  actionAggression: 'action-aggression.svg'
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

export function resolveActionFallback(name: string, category = '') {
  const text = `${name} ${category}`
  if (/说话不算数|骗人|撒谎|不诚实|赖账/.test(text)) return remoteStaticUiAsset('actionDishonest')
  if (/幼儿园|上学|上课|课堂|老师/.test(text)) return remoteStaticUiAsset('actionSchool')
  if (/发脾气|大哭|哭闹|大闹|情绪失控/.test(text)) return remoteStaticUiAsset('actionTantrum')
  if (/打人|咬人|推人|踢人|攻击/.test(text)) return remoteStaticUiAsset('actionAggression')
  if (/刷牙|牙/.test(text)) return remoteStaticUiAsset('actionToothbrush')
  if (/衣服|穿衣|整理衣/.test(text)) return remoteStaticUiAsset('actionClothes')
  if (/蔬菜|青菜|吃菜/.test(text)) return remoteStaticUiAsset('actionVegetables')
  if (/睡觉|上床|午睡|早睡|熄灯/.test(text)) return remoteStaticUiAsset('actionSleep')
  if (/起床|洗漱|早/.test(text)) return remoteStaticUiAsset('actionWakeup')
  if (/家务|帮忙|收拾餐|扫地|拖地|洗碗/.test(text)) return remoteStaticUiAsset('actionHousework')
  if (/朋友|打招呼|分享|合作|礼貌|问好/.test(text)) return remoteStaticUiAsset('actionFriends')
  if (/骑车|滑板|拍球|运动|跑步|跳绳|户外/.test(text)) return remoteStaticUiAsset('actionSports')
  if (/玩具|整理|书包|书桌|收拾/.test(text)) return remoteStaticUiAsset('actionCleanup')
  if (/英语|磨耳朵|听/.test(text)) return remoteStaticUiAsset('actionEnglish')
  if (/阅读|看书|绘本|作业|学习|本领/.test(text)) return remoteStaticUiAsset('actionReading')
  if (/训练|练习|唇肌|体能/.test(text)) return remoteStaticUiAsset('actionExercise')
  if (/表扬|奖励|进步|认真/.test(text)) return remoteStaticUiAsset('actionMedal')
  return ''
}
