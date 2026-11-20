// 콘텐츠는 data/content.json에서만 읽는다. 출처가 없는 항목은 앱에 노출하지 않는다.
import raw from '../../data/content.json'

export type ItemType = 'major' | 'job' | 'case' | 'video' | 'resource'
export interface Source {
  label: string
  url: string
}
export interface Item {
  id: string
  type: ItemType
  title: string
  fields: string[]
  summary: string
  points: string[]
  lookFor: string
  sources: Source[]
  related: string[]
  tags: string[]
  courses?: string[]
  careers?: string[]
  group?: string
  path?: string
  source?: string
  episode?: string
}
export interface Field {
  id: string
  name: string
}

const data = raw as unknown as { fields: Field[]; items: Item[] }

export const FIELDS: Field[] = data.fields
export const fieldName = (id: string) => FIELDS.find((f) => f.id === id)?.name ?? id

const hasSource = (it: Item) =>
  Array.isArray(it.sources) && it.sources.some((s) => s && typeof s.url === 'string' && s.url.trim() !== '')

/** 화면에 보여줄 수 있는 항목(출처 1개 이상), content.json 순서 = 추천순 */
export const ITEMS: Item[] = data.items.filter(hasSource)
const byId = new Map(ITEMS.map((it) => [it.id, it]))

export const getItem = (id: string | undefined) => (id ? byId.get(id) : undefined)
export const relatedOf = (it: Item) => it.related.map((r) => byId.get(r)).filter((x): x is Item => !!x)

export const TYPE_LABEL: Record<ItemType, string> = {
  major: '학과',
  job: '직업',
  case: '수업·직무 사례',
  video: '영상',
  resource: '자료',
}
export const TYPE_ORDER: ItemType[] = ['major', 'job', 'case', 'video', 'resource']

/** 날짜 기반 순환 추천: 같은 날에는 같은 항목 */
export function todayItem(date = new Date()): Item | undefined {
  const pool = ITEMS.filter((it) => it.type !== 'resource')
  if (!pool.length) return undefined
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000)
  return pool[day % pool.length]
}

/** 커리어넷 링크도 content.json의 자료 항목에서 읽는다 */
export const careernetUrl = getItem('r-careernet')?.sources[0]?.url

// ---- 검색 (제목·요약·태그, 한글 초성 검색 지원) ----
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
function toChosung(s: string) {
  let out = ''
  for (const ch of s) {
    const c = ch.charCodeAt(0) - 0xac00
    out += c >= 0 && c < 11172 ? CHO[Math.floor(c / 588)] : ch
  }
  return out
}
const isAllChosung = (q: string) => /^[ㄱ-ㅎ\s]+$/.test(q)
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '')

export function matches(it: Item, query: string): boolean {
  const q = norm(query)
  if (!q) return true
  const hay = norm([it.title, it.summary, ...it.tags].join(' '))
  if (hay.includes(q)) return true
  // 초성 검색은 제목·태그에서만 (요약까지 넣으면 엉뚱한 결과가 많아진다)
  if (isAllChosung(q)) return [it.title, ...it.tags].some((t) => toChosung(norm(t)).includes(q))
  return false
}

/** 영상 '보러 가기' 링크: YouTube 출처 우선 */
export const watchUrl = (it: Item) =>
  (it.sources.find((s) => /youtube\.com|youtu\.be/.test(s.url)) ?? it.sources[0]).url
