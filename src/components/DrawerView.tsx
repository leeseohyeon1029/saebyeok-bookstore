import { formatDate } from '../lib/format'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { fieldName, getItem, ITEMS, TYPE_LABEL, TYPE_ORDER, type Item } from '../lib/content'
import { filledCount, JOB_CARD_FIELDS } from '../lib/jobcard'
import type { PlanB, Subs } from '../lib/store'
import { MAX_JOB_CARDS, useAutosave } from '../lib/UserContext'
import { Empty, inputCls, ItemCard } from './ui'

export type DrawerTab = 'scraps' | 'notes' | 'jobs' | 'plan' | 'history'
const TABS: { id: DrawerTab; label: string }[] = [
  { id: 'scraps', label: '스크랩' },
  { id: 'notes', label: '메모' },
  { id: 'jobs', label: '관심 직업' },
  { id: 'plan', label: '플랜 B·C' },
  { id: 'history', label: '탐색 기록' },
]

interface Props {
  data: Subs
  readOnly?: boolean
  tab: DrawerTab
  onTab: (t: DrawerTab) => void
  onRemoveJob?: (id: string) => void
  onSavePlan?: (p: PlanB) => void
}

export function DrawerView({ data, readOnly, tab, onTab, onRemoveJob, onSavePlan }: Props) {
  const counts: Record<DrawerTab, number | null> = {
    scraps: Object.keys(data.scraps).filter((id) => getItem(id)).length,
    notes: Object.keys(data.notes).filter((id) => getItem(id)).length,
    jobs: Object.keys(data.jobCards).filter((id) => getItem(id)).length,
    plan: null,
    history: null,
  }
  return (
    <>
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]" role="tablist">
        <div className="flex w-max gap-1.5">
          {TABS.map((t) => {
            const on = t.id === tab
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={on}
                onClick={() => onTab(t.id)}
                className={`inline-flex min-h-11 items-center gap-1 whitespace-nowrap rounded-full px-4 text-sm font-medium ${on ? 'bg-ink text-paper' : 'bg-card text-sub ring-1 ring-line'}`}
              >
                {t.label}
                {counts[t.id] !== null && <span className={on ? 'text-paper/70' : 'text-faint'}>{counts[t.id]}</span>}
              </button>
            )
          })}
        </div>
      </div>
      <div className="mt-4">
        {tab === 'scraps' && <Scraps data={data} />}
        {tab === 'notes' && <Notes data={data} />}
        {tab === 'jobs' && <Jobs data={data} readOnly={readOnly} onRemove={onRemoveJob} />}
        {tab === 'plan' && (readOnly ? <PlanView plan={data.planB.main} /> : <PlanEditor initial={data.planB.main} onSave={onSavePlan!} />)}
        {tab === 'history' && <History data={data} />}
      </div>
    </>
  )
}

function Scraps({ data }: { data: Subs }) {
  const groups = TYPE_ORDER.map((t) => ({
    type: t,
    items: Object.entries(data.scraps)
      .sort((a, b) => b[1].createdAt - a[1].createdAt)
      .map(([id]) => getItem(id))
      .filter((x): x is Item => x?.type === t),
  })).filter((g) => g.items.length)
  if (!groups.length) return <Empty>자료 상세에서 스크랩 버튼을 누르면 여기에 모여요</Empty>
  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g.type}>
          <h3 className="mb-2 text-sm font-bold text-sub">
            {TYPE_LABEL[g.type]} <span className="font-medium text-faint">{g.items.length}</span>
          </h3>
          <div className="space-y-2">
            {g.items.map((it) => (
              <ItemCard key={it.id} item={it} compact />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function Notes({ data }: { data: Subs }) {
  const notes = Object.entries(data.notes)
    .map(([id, n]) => ({ item: getItem(id), n }))
    .filter((x): x is { item: Item; n: (typeof x)['n'] } => !!x.item)
    .sort((a, b) => b.n.updatedAt - a.n.updatedAt)
  if (!notes.length) return <Empty>자료 상세의 메모 버튼으로 적은 내용이 최신순으로 모여요</Empty>
  return (
    <ul className="space-y-2">
      {notes.map(({ item, n }) => (
        <li key={item.id}>
          <Link to={`/item/${item.id}`} className="block rounded-2xl border border-line bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-sm font-semibold">{item.title}</p>
              <span className="shrink-0 text-xs text-faint">{formatDate(n.updatedAt)}</span>
            </div>
            {n.text && <p className="mt-2 whitespace-pre-wrap break-keep text-sm leading-relaxed text-ink">{n.text}</p>}
            {n.lookForAnswer && (
              <div className="mt-2 rounded-xl bg-accent-soft/70 p-3">
                <p className="text-xs text-accent-dark">찾을 것 · {item.lookFor}</p>
                <p className="mt-1 whitespace-pre-wrap break-keep text-sm leading-relaxed">{n.lookForAnswer}</p>
              </div>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}

function Jobs({ data, readOnly, onRemove }: { data: Subs; readOnly?: boolean; onRemove?: (id: string) => void }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const cards = Object.entries(data.jobCards)
    .map(([id, c]) => ({ job: getItem(id), c }))
    .filter((x): x is { job: Item; c: (typeof x)['c'] } => !!x.job)
  return (
    <div className="space-y-2">
      <p className="text-sm text-sub">
        관심 직업 {cards.length}/{MAX_JOB_CARDS}
        {!readOnly && cards.length < MAX_JOB_CARDS && (
          <>
            {' · '}
            <Link to="/archive?type=job" className="text-accent underline underline-offset-2">
              직업 둘러보기
            </Link>
          </>
        )}
      </p>
      {cards.length === 0 && <Empty>직업 상세의 ‘관심 직업에 추가’로 정리 카드를 만들어요</Empty>}
      {cards.map(({ job, c }) => {
        const n = filledCount(c)
        const head = (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold">{job.title}</p>
              <p className="mt-0.5 text-xs text-sub">
                {JOB_CARD_FIELDS.length}개 중 {n}개 채움 · {formatDate(c.updatedAt)}
              </p>
            </div>
            <div className="flex shrink-0 gap-0.5" aria-hidden>
              {JOB_CARD_FIELDS.map((f) => (
                <span key={f.key} className={`h-2 w-2 rounded-full ${c[f.key]?.trim() ? 'bg-accent' : 'bg-line'}`} />
              ))}
            </div>
          </div>
        )
        if (!readOnly)
          return (
            <div key={job.id} className="rounded-2xl border border-line bg-card">
              <Link to={`/drawer/job/${job.id}`} className="block p-4">
                {head}
              </Link>
              {onRemove && (
                <div className="flex justify-end border-t border-line px-2">
                  <button
                    type="button"
                    onClick={() => confirm(`‘${job.title}’ 카드를 관심 직업에서 뺄까요? 적은 내용도 함께 지워져요.`) && onRemove(job.id)}
                    className="min-h-11 px-2 text-xs text-faint hover:text-sub"
                  >
                    관심 직업에서 빼기
                  </button>
                </div>
              )}
            </div>
          )
        const open = openId === job.id
        return (
          <div key={job.id} className="rounded-2xl border border-line bg-card">
            <button type="button" onClick={() => setOpenId(open ? null : job.id)} className="block w-full p-4 text-left" aria-expanded={open}>
              {head}
            </button>
            {open && (
              <dl className="space-y-3 border-t border-line p-4">
                {[...JOB_CARD_FIELDS, { key: 'sources' as const, label: '출처' }].map((f) => (
                  <div key={f.key}>
                    <dt className="text-xs font-semibold text-sub">{f.label}</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap break-keep text-sm leading-relaxed">{c[f.key]?.trim() || <span className="text-faint">-</span>}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )
      })}
    </div>
  )
}

const emptyPlan = (): PlanB => ({
  options: [
    { major: '', job: '', reason: '' },
    { major: '', job: '', reason: '' },
  ],
  changePaths: '',
})

function PlanEditor({ initial, onSave }: { initial?: PlanB; onSave: (p: PlanB) => void }) {
  const [plan, setPlan] = useState<PlanB>(() => {
    const base = emptyPlan()
    if (!initial) return base
    return { options: base.options.map((o, i) => ({ ...o, ...initial.options?.[i] })), changePaths: initial.changePaths ?? '' }
  })
  useAutosave(plan, onSave)
  const setOpt = (i: number, k: 'major' | 'job' | 'reason', v: string) =>
    setPlan((p) => ({ ...p, options: p.options.map((o, j) => (j === i ? { ...o, [k]: v } : o)) }))

  return (
    <div className="space-y-4">
      <p className="break-keep text-sm leading-relaxed text-sub">지금 생각하는 길 말고, 다른 길도 적어 두면 진로를 바꿀 때 덜 막막해요. 쓰면 자동 저장돼요.</p>
      {plan.options.map((o, i) => (
        <section key={i} className="rounded-2xl border border-line bg-card p-4">
          <h3 className="text-sm font-bold">플랜 {i === 0 ? 'B' : 'C'}</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <input className={inputCls} placeholder="학과" value={o.major} onChange={(e) => setOpt(i, 'major', e.target.value)} />
            <input className={inputCls} placeholder="직업" value={o.job} onChange={(e) => setOpt(i, 'job', e.target.value)} />
          </div>
          <textarea
            className={`${inputCls} mt-2 resize-none leading-relaxed`}
            rows={2}
            placeholder="이 길을 고른 이유"
            value={o.reason}
            onChange={(e) => setOpt(i, 'reason', e.target.value)}
          />
        </section>
      ))}
      <section className="rounded-2xl border border-line bg-card p-4">
        <h3 className="text-sm font-bold">진로를 바꾸는 경로</h3>
        <p className="mt-1 text-xs text-sub">복수전공, 전과, 대학원, 자격증처럼 중간에 길을 바꿀 수 있는 방법</p>
        <textarea
          className={`${inputCls} mt-2 resize-none leading-relaxed`}
          rows={4}
          value={plan.changePaths}
          onChange={(e) => setPlan((p) => ({ ...p, changePaths: e.target.value }))}
        />
      </section>
    </div>
  )
}

function PlanView({ plan }: { plan?: PlanB }) {
  const opts = plan?.options?.filter((o) => o.major || o.job || o.reason) ?? []
  if (!opts.length && !plan?.changePaths) return <Empty>아직 적은 플랜이 없어요</Empty>
  return (
    <div className="space-y-2">
      {plan?.options?.map((o, i) =>
        o.major || o.job || o.reason ? (
          <div key={i} className="rounded-2xl border border-line bg-card p-4 text-sm">
            <p className="font-bold">플랜 {i === 0 ? 'B' : 'C'}</p>
            <p className="mt-1">
              {o.major || '-'} · {o.job || '-'}
            </p>
            {o.reason && <p className="mt-1 whitespace-pre-wrap text-sub">{o.reason}</p>}
          </div>
        ) : null,
      )}
      {plan?.changePaths && (
        <div className="rounded-2xl border border-line bg-card p-4 text-sm">
          <p className="font-bold">진로를 바꾸는 경로</p>
          <p className="mt-1 whitespace-pre-wrap text-sub">{plan.changePaths}</p>
        </div>
      )}
    </div>
  )
}

function History({ data }: { data: Subs }) {
  const s = useMemo(() => {
    const viewed = Object.keys(data.views)
      .map((id) => getItem(id))
      .filter((x): x is Item => !!x)
    const byField = new Map<string, number>()
    for (const it of viewed) for (const f of it.fields) byField.set(f, (byField.get(f) ?? 0) + 1)
    const wowField = new Map<string, number>()
    for (const [id, r] of Object.entries(data.reactions)) {
      const it = getItem(id)
      if (it && r.value === 'wow') for (const f of it.fields) wowField.set(f, (wowField.get(f) ?? 0) + 1)
    }
    const top = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
    const newJobs = viewed.filter((it) => it.type === 'job')
    return { viewed: viewed.length, total: ITEMS.length, fields: top(byField), wow: top(wowField), newJobs }
  }, [data])

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="본 자료">
          {s.viewed}
          <Unit>개</Unit>
        </Stat>
        <Stat label="새로 알게 된 직업">
          {s.newJobs.length}
          <Unit>개</Unit>
        </Stat>
      </div>
      <Ranking title="많이 본 분야" rows={s.fields} empty="자료를 열어 보면 쌓여요" />
      <Ranking title="😮 새로웠던 분야" rows={s.wow} empty="자료에 😮 반응을 남기면 쌓여요" />
      {s.newJobs.length > 0 && (
        <section className="rounded-2xl border border-line bg-card p-4">
          <h3 className="text-sm font-bold">새로 알게 된 직업</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {s.newJobs.map((j) => (
              <Link key={j.id} to={`/item/${j.id}`} className="inline-flex min-h-9 items-center rounded-full bg-warm-soft px-3 text-[13px] text-warm">
                {j.title}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

const Unit = ({ children }: { children: ReactNode }) => <span className="ml-0.5 text-sm font-medium text-sub">{children}</span>

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <p className="text-xs text-sub">{label}</p>
      <p className="mt-1 text-2xl font-bold">{children}</p>
    </div>
  )
}

function Ranking({ title, rows, empty }: { title: string; rows: [string, number][]; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r[1]))
  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <h3 className="text-sm font-bold">{title}</h3>
      {rows.length ? (
        <ul className="mt-3 space-y-2">
          {rows.map(([f, n]) => (
            <li key={f} className="flex items-center gap-3 text-sm">
              <span className="w-16 shrink-0">{fieldName(f)}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-paper">
                <span className="block h-full rounded-full bg-accent/70" style={{ width: `${(n / max) * 100}%` }} />
              </span>
              <span className="w-8 shrink-0 text-right text-sub">{n}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-faint">{empty}</p>
      )}
    </section>
  )
}
