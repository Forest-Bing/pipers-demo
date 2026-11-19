/**
 * 兼容入口：早期地图页从 '@/lib/mock-marks' 导入，
 * 数据已迁到 '@/lib/mock/marks'，这里只做转发，勿在此新增数据。
 */
export { marks, markCounts, pendingCount, findMark } from './mock/marks'
export type { Mark as MarkItem, MarkKind } from './mock/types'
