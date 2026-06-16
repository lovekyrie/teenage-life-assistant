declare const API_BASE: string

declare module '*.scss' {
  const content: { [className: string]: string }
  export default content
}

declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.gif'
declare module '*.svg'
