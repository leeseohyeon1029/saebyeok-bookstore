import { useMemo, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageTitle } from '../components/ui'
import { getItem, ITEMS, relatedOf, type Item } from '../lib/content'

// SPEC 5-4 기본 추천 비교 세트 (id만 지정, 내용은 content.json에서 읽음)
const DEFAULT_SET = ['m-chinese', 'm-bizchinese', 'm-interp']
const MAX = 3

const MAJORS = ITEMS.filter((it) => it.type === 'major')

export default function Compare() {
  const [params, setParams] = useSearchParams()
  const selected = useMemo(() => {
    const raw = params.get('m')
    const ids = raw === null ? DEFAULT_SET : raw.split(',').filter(Boolean)
    return ids.map((id) => getItem(id)).filter((x): x is Item => x?.type === 'major').slice(0, MAX)
  }, [params])

  const toggle = (id: string) => {
    const ids = selected.map((s) => s.id)
    const next = ids.includes(id) ? ids.filter((x) => x !== id) : ids.length < MAX ? [...ids, id] : ids
    setParams({ m: next.join(',') }, { replace: true })
  }

  const cols = selected.length
  const grid = cols === 3 ? 'grid-cols-3' : cols === 2 ? 'grid-cols-2' : 'grid-cols-1'

  return (
    <>
      <PageTitle sub={`학과를 2~${MAX}개 골라 나란히 봐요`}>비교</PageTitle>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {MAJORS.map((m) => {
          const on = selected.some((s) => s.id === m.id)
          const disabled = !on && selected.length >= MAX
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={on}
              disabled={disabled}
              onClick={() => toggle(m.id)}
              className={`inline-flex min-h-10 items-center rounded-full border px-3 text-[13px] disabled:opacity-40 ${on ? 'border-accent bg-accent text-white' : 'border-line bg-card text-sub'}`}
            >
              {m.title}
            </button>
          )
        })}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-faint">
        <span>{selected.length}개 선택됨{selected.length >= MAX ? ` (최대 ${MAX}개)` : ''}</span>
        <button type="button" onClick={() => setParams({}, { replace: true })} className="min-h-11 px-1 text-accent underline underline-offset-2">
          추천 세트로
        </button>
      </div>

      {cols < 2 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-faint">학과를 2개 이상 골라 주세요</p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-card">
          <div className={`grid ${grid} divide-x divide-line border-b border-line bg-accent-soft/60`}>
            {selected.map((m) => (
              <Link key={m.id} to={`/item/${m.id}`} className="min-w-0 p-2.5 sm:p-3">
                <p className="break-keep text-[13px] font-bold leading-snug text-accent-dark sm:text-sm">{m.title}</p>
              </Link>
            ))}
          </div>
          <Row title="배우는 과목" grid={grid}>
            {selected.map((m) => (
              <List key={m.id} items={m.courses ?? []} />
            ))}
          </Row>
          <Row title="졸업 후 진출" grid={grid}>
            {selected.map((m) => (
              <List key={m.id} items={m.careers ?? []} />
            ))}
          </Row>
          <Row title="관련 직업" grid={grid}>
            {selected.map((m) => (
              <Links key={m.id} items={relatedOf(m).filter((r) => r.type === 'job')} />
            ))}
          </Row>
          <Row title="관련 영상" grid={grid} last>
            {selected.map((m) => (
              <Links key={m.id} items={relatedOf(m).filter((r) => r.type === 'video')} />
            ))}
          </Row>
        </div>
      )}
      <p className="mt-3 text-xs leading-relaxed text-faint">각 학과의 출처는 학과 이름을 눌러 상세 화면에서 볼 수 있어요.</p>
    </>
  )
}

function Row({ title, grid, children, last }: { title: string; grid: string; children: ReactNode; last?: boolean }) {
  return (
    <div className={last ? '' : 'border-b border-line'}>
      <p className="bg-paper/60 px-3 py-1.5 text-xs font-semibold text-sub">{title}</p>
      <div className={`grid ${grid} divide-x divide-line`}>{children}</div>
    </div>
  )
}

function List({ items }: { items: string[] }) {
  if (!items.length) return <p className="p-2.5 text-xs text-faint">-</p>
  return (
    <ul className="min-w-0 space-y-1.5 p-2.5 sm:p-3">
      {items.map((c) => (
        <li key={c} className="break-keep text-[12.5px] leading-snug text-ink [overflow-wrap:anywhere] sm:text-sm">
          {c}
        </li>
      ))}
    </ul>
  )
}

function Links({ items }: { items: Item[] }) {
  if (!items.length) return <p className="p-2.5 text-xs text-faint">-</p>
  return (
    <ul className="min-w-0 space-y-0.5 p-1.5 sm:p-2">
      {items.map((it) => (
        <li key={it.id}>
          <Link to={`/item/${it.id}`} className="block rounded-lg px-1 py-1.5 text-[12.5px] leading-snug text-accent underline-offset-2 [overflow-wrap:anywhere] hover:underline sm:text-sm">
            {it.title}
          </Link>
        </li>
      ))}
    </ul>
  )
}
