export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/rewards/index',
    'pages/settings/index',
    'pages/login/index',
    'pages/family-setup/index',
    'pages/point-pick/index',
    'pages/records/index',
    'pages/redemptions/index',
    'pages/guide/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#22b8ad',
    navigationBarTitleText: '成长积分',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#6e8582',
    selectedColor: '#18afa3',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/ui/tab-home.png',
        selectedIconPath: 'assets/ui/tab-home-active.png'
      },
      {
        pagePath: 'pages/rewards/index',
        text: '奖励',
        iconPath: 'assets/ui/tab-rewards.png',
        selectedIconPath: 'assets/ui/tab-rewards-active.png'
      },
      {
        pagePath: 'pages/settings/index',
        text: '设置',
        iconPath: 'assets/ui/tab-settings.png',
        selectedIconPath: 'assets/ui/tab-settings-active.png'
      }
    ]
  }
})
