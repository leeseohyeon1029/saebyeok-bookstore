import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Shell } from '../components/Layout'
import { BackHeader, btnGhost, btnPrimary, FieldBadges, ItemCard, ScrapIcon, TypeBadge } from '../components/ui'
import { getItem, relatedOf, watchUrl, type Item } from '../lib/content'
import type { ReactionValue } from '../lib/store'
import { MAX_JOB_CARDS, useAutosave, useUser } from '../lib/UserContext'

const REACTIONS: { value: ReactionValue; emoji: string; label: string }[] = [
  { value: 'wow', emoji: '😮', label: '새로웠다' },
  { value: 'ok', emoji: '🙂', label: '괜찮았다' },
  { value: 'meh', emoji: '😐', label: '별로' },
]

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-bold text-ink">{title}</h2>
      {children}
    </section>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((p, i) => (
        <li key={i} className="flex gap-2 break-keep text-[15px] leading-relaxed text-ink">
          <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
          <span>{p}</span>
        </li>
      ))}
    </ul>
  )
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((c) => (
        <span key={c} className="break-keep rounded-lg bg-card px-3 py-2 text-sm leading-snug text-ink ring-1 ring-line">
          {c}
        </span>
      ))}
    </div>
  )
}

function ExternalButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${btnPrimary} mt-5 w-full gap-1.5`}>
      {children}
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  )
}

function TypeBlocks({ item }: { item: Item }) {
  switch (item.type) {
    case 'major':
      return (
        <>
          {item.points.length > 0 && (
            <Block title="핵심 포인트">
              <Bullets items={item.points} />
            </Block>
          )}
          {item.courses?.length ? (
            <Block title="배우는 과목">
              <Chips items={item.courses} />
            </Block>
          ) : null}
          {item.careers?.length ? (
            <Block title="졸업 후 진출">
              <Chips items={item.careers} />
            </Block>
          ) : null}
        </>
      )
    case 'job':
      return (
        <>
          <Block title="하는 일">
            <Bullets items={[item.summary, ...item.points]} />
          </Block>
          {item.path && (
            <Block title="되는 길">
              <p className="break-keep rounded-xl bg-card p-4 text-[15px] leading-relaxed ring-1 ring-line">{item.path}</p>
            </Block>
          )}
        </>
      )
    case 'case':
      return (
        <Block title="무엇을 보여주는지">
          <Bullets items={item.points} />
        </Block>
      )
    case 'video':
      return (
        <>
          {item.source && <p className="mt-3 text-sm text-sub">{item.source}{item.episode ? ` · ${item.episode}` : ''}</p>}
          {item.points.length > 0 && (
            <Block title="핵심 포인트">
              <Bullets items={item.points} />
            </Block>
          )}
          <ExternalButton href={watchUrl(item)}>영상 보러 가기</ExternalButton>
          <p className="mt-2 text-center text-xs text-faint">새 창에서 열려요</p>
        </>
      )
    case 'resource':
      return (
        <>
          {item.points.length > 0 && (
            <Block title="핵심 포인트">
              <Bullets items={item.points} />
            </Block>
          )}
          <ExternalButton href={item.sources[0].url}>사이트 열기</ExternalButton>
        </>
      )
  }
}

function JobCardButton({ id }: { id: string }) {
  const { data, addJobCard } = useUser()
  const [full, setFull] = useState(false)
  const added = !!data.jobCards[id]
  if (added)
    return (
      <Link to={`/drawer/job/${id}`} className={`${btnGhost} mt-6 w-full border-accent text-accent`}>
        관심 직업에 담겨 있어요 · 정리 카드 열기
      </Link>
    )
  return (
    <div className="mt-6">
      <button type="button" className={`${btnGhost} w-full`} onClick={() => setFull(!addJobCard(id))}>
        + 관심 직업에 추가
      </button>
      {full && (
        <p className="mt-2 text-center text-xs text-sub">
          관심 직업은 {MAX_JOB_CARDS}개까지 담을 수 있어요.{' '}
          <Link to="/drawer" className="text-accent underline">
            내 서랍
          </Link>
          에서 하나를 빼고 다시 추가해 주세요.
        </p>
      )}
    </div>
  )
}

function MemoSheet({ item, onClose }: { item: Item; onClose: () => void }) {
  const { data, saveNote } = useUser()
  const prev = data.notes[item.id]
  const [note, setNote] = useState({ text: prev?.text ?? '', lookForAnswer: prev?.lookForAnswer ?? '' })
  const [savedAt, setSavedAt] = useState<number | null>(null)
  useAutosave(note, (n) => {
    saveNote(item.id, n)
    setSavedAt(Date.now())
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div
        role="dialog"
        aria-label="메모"
        className="max-h-[90dvh] w-full max-w-app overflow-y-auto rounded-t-3xl bg-paper px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">메모</h2>
          <span className="text-xs text-faint">{savedAt ? '자동 저장됨' : '쓰면 자동으로 저장돼요'}</span>
        </div>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-sm font-medium text-sub">자유 메모</span>
          <textarea
            value={note.text}
            onChange={(e) => setNote((n) => ({ ...n, text: e.target.value }))}
            rows={4}
            className="w-full resize-none rounded-xl border border-line bg-card p-3.5 text-[15px] leading-relaxed focus:border-accent focus:outline-none"
            placeholder="새로 알게 된 것, 궁금한 것"
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1.5 block break-keep text-sm font-medium text-sub">
            <span className="text-accent">찾을 것</span> · {item.lookFor} <span className="text-faint">(선택)</span>
          </span>
          <textarea
            value={note.lookForAnswer}
            onChange={(e) => setNote((n) => ({ ...n, lookForAnswer: e.target.value }))}
            rows={3}
            className="w-full resize-none rounded-xl border border-line bg-card p-3.5 text-[15px] leading-relaxed focus:border-accent focus:outline-none"
            placeholder="내 답"
          />
        </label>
        <button type="button" className={`${btnPrimary} mt-3 w-full`} onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  )
}

export default function Detail() {
  const { id } = useParams()
  const item = getItem(id)
  const { data, recordView, toggleScrap, setReaction } = useUser()
  const [memoOpen, setMemoOpen] = useState(false)
  const closeMemo = useCallback(() => setMemoOpen(false), [])

  useEffect(() => {
    if (item) recordView(item.id)
    window.scrollTo(0, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id])

  if (!item)
    return (
      <Shell>
        <BackHeader />
        <p className="py-16 text-center text-sm text-faint">찾는 자료가 없어요</p>
      </Shell>
    )

  const scrapped = !!data.scraps[item.id]
  const reaction = data.reactions[item.id]?.value
  const hasNote = !!data.notes[item.id]
  const related = relatedOf(item)

  return (
    <Shell>
      <BackHeader title={item.title} />
      <article className="pb-36 pt-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <TypeBadge type={item.type} />
          <FieldBadges fields={item.fields} max={4} />
          {item.type === 'job' && item.group && <span className="text-xs text-faint">· {item.group}</span>}
        </div>
        <h1 className="mt-3 break-keep text-[22px] font-bold leading-snug tracking-tight">{item.title}</h1>
        {item.type !== 'job' && <p className="mt-2 break-keep text-[15px] leading-relaxed text-sub">{item.summary}</p>}

        <TypeBlocks item={item} />

        <section className="mt-6 rounded-2xl border border-accent/25 bg-accent-soft p-4">
          <p className="text-xs font-bold text-accent-dark">보면서 찾을 것</p>
          <p className="mt-1 break-keep text-[15px] font-medium leading-relaxed text-ink">{item.lookFor}</p>
          <button type="button" onClick={() => setMemoOpen(true)} className="mt-2 min-h-11 text-sm font-medium text-accent underline underline-offset-2">
            {data.notes[item.id]?.lookForAnswer ? '내 답 보기·고치기' : '내 답 적어 두기'}
          </button>
        </section>

        {item.type === 'job' && <JobCardButton id={item.id} />}

        <Block title="출처">
          <ul className="divide-y divide-line overflow-hidden rounded-xl bg-card ring-1 ring-line">
            {item.sources.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center justify-between gap-2 px-4 py-2.5 text-sm text-ink hover:bg-black/[0.02]"
                >
                  <span className="min-w-0 break-keep">{s.label}</span>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-faint" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M14 4h6v6M20 4l-9 9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </Block>

        {item.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {item.tags.map((t) => (
              <Link key={t} to={`/archive?q=${encodeURIComponent(t)}`} className="inline-flex min-h-8 items-center text-[13px] text-faint hover:text-sub">
                #{t}
              </Link>
            ))}
          </div>
        )}

        {related.length > 0 && (
          <Block title="함께 보면 좋은 자료">
            <div className="space-y-2">
              {related.map((r) => (
                <ItemCard key={r.id} item={r} compact />
              ))}
            </div>
          </Block>
        )}
      </article>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-app items-center gap-1 px-2 py-1.5">
          <button
            type="button"
            onClick={() => toggleScrap(item.id)}
            aria-pressed={scrapped}
            className={`flex min-h-12 w-14 shrink-0 flex-col items-center justify-center rounded-xl text-[11px] ${scrapped ? 'text-accent' : 'text-sub'}`}
          >
            <ScrapIcon on={scrapped} className="h-5 w-5" />
            스크랩
          </button>
          <div className="flex flex-1 justify-center gap-0.5" role="group" aria-label="반응">
            {REACTIONS.map((r) => {
              const on = reaction === r.value
              return (
                <button
                  key={r.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setReaction(item.id, on ? null : r.value)}
                  className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center rounded-xl text-[11px] ${on ? 'bg-accent-soft font-semibold text-accent-dark' : 'text-sub'}`}
                >
                  <span className={`text-lg leading-none ${on ? '' : 'opacity-70 grayscale-[40%]'}`}>{r.emoji}</span>
                  <span className="mt-0.5 whitespace-nowrap">{r.label}</span>
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => setMemoOpen(true)}
            className={`flex min-h-12 w-14 shrink-0 flex-col items-center justify-center rounded-xl text-[11px] ${hasNote ? 'text-accent' : 'text-sub'}`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill={hasNote ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8}>
              <path d="M5 4h10l4 4v12H5z" strokeLinejoin="round" />
              <path d="M9 12h6M9 16h4" stroke={hasNote ? '#f8f5ef' : 'currentColor'} strokeLinecap="round" />
            </svg>
            메모
          </button>
        </div>
      </div>

      {memoOpen && <MemoSheet item={item} onClose={closeMemo} />}
    </Shell>
  )
}
