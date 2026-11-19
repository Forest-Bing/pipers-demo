import type { Pipeline } from './types'

/** TODO: 接后端后由 GET /api/pipelines 替换 */
export const pipelines: Pipeline[] = [
  {
    id: 'pl-1',
    code: 'XQDS-E2-ZWJB',
    name: '西气东输二线 · 中卫—靖边段',
  },
]

export const activePipeline = pipelines[0]
