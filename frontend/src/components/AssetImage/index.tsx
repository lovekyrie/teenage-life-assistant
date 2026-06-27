import { Image, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import type { CommonEventFunction } from '@tarojs/components'
import './index.scss'

interface AssetImageProps {
  src?: string
  fallback: string
  className?: string
  imageClassName?: string
  mode?: 'scaleToFill' | 'aspectFit' | 'aspectFill' | 'widthFix' | 'heightFix'
}

export default function AssetImage({
  src,
  fallback,
  className = '',
  imageClassName = '',
  mode = 'aspectFit'
}: AssetImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallback)

  useEffect(() => {
    setCurrentSrc(src || fallback)
  }, [src, fallback])

  const handleError: CommonEventFunction = () => {
    if (currentSrc !== fallback) setCurrentSrc(fallback)
  }

  return (
    <View className={`asset-image ${className}`}>
      <Image className={`asset-image-node ${imageClassName}`} src={currentSrc} mode={mode} onError={handleError} />
    </View>
  )
}
