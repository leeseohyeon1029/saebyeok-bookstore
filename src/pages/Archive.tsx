import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ItemCard, PageTitle } from '../components/ui'
import { FIELDS, ITEMS, matches, TYPE_LABEL, TYPE_ORDER, type ItemType } from '../lib/content'
import { SearchBox } from './Home'

export default function Archive() {
  const [params, setParams] = useSearchParams()
  const type = (params.get('type') ?? 'all') as ItemType | 'all'
  const q = params.get('q') ?? ''
  const sort = params.get('sort') === 'abc' ? 'abc' : 'rec'
  const fields = useMemo(() => (params.get('fields') ?? '').split(',').filter(Boolean), [params])

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k)
      else next.set(k, v)
    }
    setParams(next, { replace: true })
  }
  const toggleField = (id: string) => {
    const next = fields.includes(id) ? fields.filter((f) => f !== id) : [...fields, id]
    update({ fields: next.join(',') || null })
  }

  const list = useMemo(() => {
    const out = ITEMS.filter(
      (it) =>
        (type === 'all' || it.type === type) &&
        (fields.length === 0 || it.fields.some((f) => fields.includes(f))) &&
        matches(it, q),
    )
    return sort === 'abc' ? [...out].sort((a, b) => a.title.localeCompare(b.title, 'ko')) : out
  }, [type, fields, q, sort])

  const typeTabs: (ItemType | 'all')[] = ['all', ...TYPE_ORDER]

  return (
    <>
      <PageTitle sub="모든 자료에는 출처가 붙어 있어요">아카이브</PageTitle>
      <div className="mt-3">
        <SearchBox key={q} initial={q} onSearch={(v) => update({ q: v || null })} />
      </div>

      <div className="-mx-4 mt-3 overflow-x-auto px-4 [scrollbar-width:none]" role="tablist" aria-label="유형">
        <div className="flex w-max gap-1 border-b border-line">
          {typeTabs.map((t) => {
            const on = t === type
            return (
              <button
                key={t}
                role="tab"
                aria-selected={on}
                onClick={() => update({ type: t === 'all' ? null : t })}
                className={`min-h-11 whitespace-nowrap border-b-2 px-3 text-sm font-medium ${on ? 'border-accent text-accent' : 'border-transparent text-sub'}`}
              >
                {t === 'all' ? '전체' : TYPE_LABEL[t]}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5" aria-label="계열 필터">
        {FIELDS.map((f) => {
          const on = fields.includes(f.id)
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggleField(f.id)}
              className={`inline-flex min-h-9 items-center rounded-full border px-3 text-[13px] ${on ? 'border-accent bg-accent text-white' : 'border-line bg-card text-sub'}`}
            >
              {f.name}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-sub">
          {q && <span className="font-medium text-ink">‘{q}’ </span>}
          {list.length}개
        </p>
        <div className="flex rounded-lg border border-line bg-card p-0.5 text-[13px]">
          {(
            [
              ['rec', '추천순'],
              ['abc', '가나다순'],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => update({ sort: v === 'rec' ? null : v })}
              className={`min-h-9 rounded-md px-3 ${sort === v ? 'bg-accent-soft font-semibold text-accent-dark' : 'text-sub'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {list.map((it) => (
          <ItemCard key={it.id} item={it} />
        ))}
        {list.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-sm text-faint">조건에 맞는 자료가 없어요</p>
            <button type="button" className="mt-2 min-h-11 text-sm text-accent underline" onClick={() => setParams({}, { replace: true })}>
              조건 모두 지우기
            </button>
          </div>
        )}
      </div>
    </>
  )
}
