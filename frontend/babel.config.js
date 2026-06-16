module.exports = {
  presets: [
    ['taro', {
      framework: 'react',
      ts: true
    }]
  ],
  plugins: [
    ['import', {
      libraryName: '@taroify/core',
      libraryDirectory: '',
      style: false
    }, '@taroify/core']
  ]
}
