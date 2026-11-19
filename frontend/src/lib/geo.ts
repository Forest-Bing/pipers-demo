/** 经纬度小工具：距离与沿折线取点。仅前端展示用，不追求测绘精度。 */

const EARTH_R = 6371008.8

/** 两点球面距离（米） */
export function distanceMeters(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b[1] - a[1])
  const dLng = toRad(b[0] - a[0])
  const lat1 = toRad(a[1])
  const lat2 = toRad(b[1])
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_R * Math.asin(Math.sqrt(h))
}

/** 折线累计长度（米）与每段端点，供插值复用 */
function measure(path: [number, number][]) {
  const segs: number[] = []
  let total = 0
  for (let i = 1; i < path.length; i += 1) {
    const d = distanceMeters(path[i - 1], path[i])
    segs.push(d)
    total += d
  }
  return { segs, total }
}

/**
 * 沿折线按弧长比例取点。t ∈ [0,1]，0 为起点、1 为终点。
 * 台账点、标记点都靠它沿管线铺开，避免手写几十个坐标。
 */
export function pointAt(path: [number, number][], t: number): [number, number] {
  if (path.length === 0) return [0, 0]
  if (path.length === 1) return path[0]
  const { segs, total } = measure(path)
  const target = Math.min(Math.max(t, 0), 1) * total
  let acc = 0
  for (let i = 0; i < segs.length; i += 1) {
    if (acc + segs[i] >= target) {
      const k = segs[i] === 0 ? 0 : (target - acc) / segs[i]
      const [x1, y1] = path[i]
      const [x2, y2] = path[i + 1]
      return [Number((x1 + (x2 - x1) * k).toFixed(6)), Number((y1 + (y2 - y1) * k).toFixed(6))]
    }
    acc += segs[i]
  }
  return path[path.length - 1]
}

/** 在点位上做约 ±meters 米的随机偏移（确定性 PRNG 驱动，见 mock/rng.ts） */
export function offsetPoint(
  point: [number, number],
  dLngMeters: number,
  dLatMeters: number,
): [number, number] {
  const dLat = dLatMeters / 110540
  const dLng = dLngMeters / (111320 * Math.cos((point[1] * Math.PI) / 180))
  return [Number((point[0] + dLng).toFixed(6)), Number((point[1] + dLat).toFixed(6))]
}
