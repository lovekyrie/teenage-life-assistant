import path from 'path'
import devConfig from './dev'
import prodConfig from './prod'

const config = {
  projectName: 'teenage-life-assistant',
  date: '2026-6-15',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    375: 2,
    828: 1.81 / 2
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [],
  defineConstants: {},
  copy: {
    patterns: [
      { from: 'src/assets/ui/tab-home.png', to: 'dist/assets/ui/tab-home.png' },
      { from: 'src/assets/ui/tab-home-active.png', to: 'dist/assets/ui/tab-home-active.png' },
      { from: 'src/assets/ui/tab-rewards.png', to: 'dist/assets/ui/tab-rewards.png' },
      { from: 'src/assets/ui/tab-rewards-active.png', to: 'dist/assets/ui/tab-rewards-active.png' },
      { from: 'src/assets/ui/tab-settings.png', to: 'dist/assets/ui/tab-settings.png' },
      { from: 'src/assets/ui/tab-settings-active.png', to: 'dist/assets/ui/tab-settings-active.png' }
    ],
    options: {}
  },
  framework: 'react',
  compiler: 'webpack5',
  cache: {
    enable: true
  },
  alias: {
    '@': path.resolve(__dirname, '..', 'src')
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {}
      },
      cssModules: {
        enable: false
      }
    }
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    postcss: {
      autoprefixer: {
        enable: true
      },
      cssModules: {
        enable: false
      }
    }
  }
}

export default function (merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, devConfig)
  }
  return merge({}, config, prodConfig)
}
