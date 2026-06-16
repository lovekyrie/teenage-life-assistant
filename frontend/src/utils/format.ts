export function formatDateTime(value: string) {
  const date = new Date(value)
  const pad = (n: number) => `${n}`.padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatDate(value: string) {
  const date = new Date(value)
  const pad = (n: number) => `${n}`.padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function groupByDate<T extends { created_at: string }>(items: T[]) {
  const map = new Map<string, T[]>()
  items.forEach((item) => {
    const key = formatDate(item.created_at)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  })
  return Array.from(map.entries()).map(([date, list]) => ({ date, list }))
}

export function groupActionsByPoints<T extends { points: number }>(actions: T[]) {
  const map = new Map<number, T[]>()
  actions.forEach((action) => {
    if (!map.has(action.points)) map.set(action.points, [])
    map.get(action.points)!.push(action)
  })
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([points, list]) => ({ points, list }))
}
