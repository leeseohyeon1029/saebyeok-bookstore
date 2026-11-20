// data/content.json 검사: id 중복, 필수 필드, sources 1개 이상, related id 존재, URL 형식
// 실행: npm run validate (npm run build 전에 자동 실행)
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const path = resolve(here, '../data/content.json')

type Json = Record<string, unknown>
const errors: string[] = []
const warnings: string[] = []

let data: Json
try {
  data = JSON.parse(readFileSync(path, 'utf-8'))
} catch (e) {
  console.error(`✗ content.json을 읽을 수 없습니다: ${(e as Error).message}`)
  process.exit(1)
}

const TYPES = ['major', 'job', 'case', 'video', 'resource']
const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string')

function isUrl(v: unknown): boolean {
  if (!isStr(v)) return false
  try {
    const u = new URL(v)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

// fields 정의
const fieldIds = new Set<string>()
if (!Array.isArray(data.fields)) errors.push('최상위 "fields" 배열이 없습니다')
else
  for (const f of data.fields as Json[]) {
    if (!isStr(f.id) || !isStr(f.name)) errors.push(`fields 항목에 id/name이 없습니다: ${JSON.stringify(f)}`)
    else if (fieldIds.has(f.id)) errors.push(`fields id 중복: ${f.id}`)
    else fieldIds.add(f.id)
  }

if (!Array.isArray(data.items)) {
  errors.push('최상위 "items" 배열이 없습니다')
} else {
  const items = data.items as Json[]
  const ids = new Set<string>()
  for (const it of items) {
    if (!isStr(it.id)) continue
    if (ids.has(it.id)) errors.push(`id 중복: ${it.id}`)
    ids.add(it.id)
  }

  items.forEach((it, i) => {
    const where = isStr(it.id) ? `[${it.id}]` : `[items ${i}번째]`
    const err = (m: string) => errors.push(`${where} ${m}`)

    // 공통 필수 필드
    if (!isStr(it.id)) err('id가 없습니다')
    if (!isStr(it.type) || !TYPES.includes(it.type)) err(`type은 ${TYPES.join(', ')} 중 하나여야 합니다 (현재: ${String(it.type)})`)
    if (!isStr(it.title)) err('title이 없습니다')
    if (!isStr(it.summary)) err('summary가 없습니다')
    if (!isStr(it.lookFor)) err('lookFor가 없습니다')
    if (!isStrArr(it.points)) err('points는 문자열 배열이어야 합니다 (없으면 [])')
    if (!isStrArr(it.tags)) err('tags는 문자열 배열이어야 합니다 (없으면 [])')

    if (!isStrArr(it.fields) || it.fields.length === 0) err('fields는 1개 이상의 문자열 배열이어야 합니다')
    else for (const f of it.fields) if (!fieldIds.has(f)) err(`알 수 없는 계열 "${f}" (fields 정의에 없음)`)

    // 출처
    if (!Array.isArray(it.sources) || it.sources.length === 0) err('sources가 1개 이상 있어야 합니다')
    else
      (it.sources as Json[]).forEach((s, j) => {
        if (!isStr(s.label)) err(`sources[${j}] label이 없습니다`)
        if (!isUrl(s.url)) err(`sources[${j}] URL 형식이 올바르지 않습니다: ${String(s.url)}`)
      })

    // 관련 항목
    if (!isStrArr(it.related)) err('related는 문자열 배열이어야 합니다 (없으면 [])')
    else
      for (const r of it.related) {
        if (!ids.has(r)) err(`related에 없는 id가 있습니다: ${r}`)
        if (r === it.id) err('related에 자기 자신이 들어 있습니다')
      }

    // 유형별 필드
    if (it.type === 'major') {
      if (!isStrArr(it.courses) || it.courses.length === 0) err('학과(major)에는 courses가 필요합니다')
      if (!isStrArr(it.careers) || it.careers.length === 0) err('학과(major)에는 careers가 필요합니다')
    }
    if (it.type === 'job') {
      if (!isStr(it.group)) err('직업(job)에는 group이 필요합니다')
      if (!isStr(it.path)) err('직업(job)에는 path(되는 길)가 필요합니다')
    }
    if (it.type === 'video') {
      if (!isStr(it.source)) err('영상(video)에는 source(채널 이름)가 필요합니다')
      if (it.episode !== undefined && !isStr(it.episode)) err('episode는 문자열이어야 합니다')
    }
  })

  if (errors.length === 0) {
    const count: Record<string, number> = {}
    for (const it of items) count[it.type as string] = (count[it.type as string] ?? 0) + 1
    console.log(`✓ content.json 검사 통과: 항목 ${items.length}개 (${Object.entries(count).map(([k, v]) => `${k} ${v}`).join(', ')})`)
  }
}

for (const w of warnings) console.warn(`! ${w}`)
if (errors.length) {
  console.error(`✗ content.json 검사 실패 (${errors.length}건)`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
