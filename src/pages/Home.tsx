import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ItemCard, Section } from '../components/ui'
import { fieldName, getItem, todayItem, TYPE_LABEL, TYPE_ORDER, type Item } from '../lib/content'
import { useUser } from '../lib/UserContext'

export function SearchBox({ initial = '', onSearch }: { initial?: string; onSearch: (q: string) => void }) {
  const [q, setQ] = useState(initial)
  return (
    <form
      role="search"
      onSubmit={(e: FormEvent) => {
        e.preventDefault()
        onSearch(q.trim())
      }}
      className="relative"
    >
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-faint" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="학과, 직업, 키워드 검색 (초성도 돼요)"
        className="h-12 w-full rounded-xl border border-line bg-card pl-11 pr-3 text-[15px] placeholder:text-faint focus:border-accent focus:outline-none"
      />
    </form>
  )
}

export default function Home() {
  const { profile, data } = useUser()
  const nav = useNavigate()
  const today = todayItem()

  const recent = Object.entries(data.views)
    .sort((a, b) => b[1].lastViewedAt - a[1].lastViewedAt)
    .map(([id]) => getItem(id))
    .filter((x): x is Item => !!x)
    .slice(0, 3)

  const scrapCount = Object.keys(data.scraps).filter((id) => getItem(id)).length
  const jobs = Object.keys(data.jobCards)
    .map((id) => getItem(id))
    .filter((x): x is Item => !!x)

  return (
    <>
      <div className="pb-4 pt-6">
        <p className="text-sm text-sub">{profile?.nickname}님의 자료실</p>
        <h1 className="mt-0.5 text-[22px] font-bold tracking-tight">오늘은 무엇을 찾아볼까요?</h1>
      </div>
      <SearchBox onSearch={(q) => nav(q ? `/archive?q=${encodeURIComponent(q)}` : '/archive')} />

      {today && (
        <Section title="오늘의 자료">
          <Link to={`/item/${today.id}`} className="block rounded-2xl bg-accent p-5 text-white">
            <div className="flex flex-wrap items-center gap-1.5 opacity-95">
              <span className="rounded-md bg-white/15 px-2 py-0.5 text-xs font-semibold">{TYPE_LABEL[today.type]}</span>
              {today.fields.slice(0, 2).map((f) => (
                <span key={f} className="rounded-md border border-white/25 px-2 py-0.5 text-xs">
                  {fieldName(f)}
                </span>
              ))}
            </div>
            <h3 className="mt-3 break-keep text-lg font-bold leading-snug">{today.title}</h3>
            <p className="mt-1.5 break-keep text-sm leading-relaxed text-white/85">{today.summary}</p>
            <p className="mt-4 rounded-xl bg-white/10 px-3.5 py-3 text-sm leading-relaxed">
              <span className="mr-1 font-semibold">보면서 찾을 것</span>
              {today.lookFor}
            </p>
          </Link>
        </Section>
      )}

      <Section title="이어서 보기">
        {recent.length ? (
          <div className="space-y-2">
            {recent.map((it) => (
              <ItemCard key={it.id} item={it} compact />
            ))}
          </div>
        ) : (
          <p className="text-sm text-faint">자료를 열어 보면 여기에 최근 본 3개가 나와요.</p>
        )}
      </Section>

      <Section
        title="내 서랍"
        action={
          <Link to="/drawer" className="flex min-h-11 items-center text-sm text-accent">
            열기
          </Link>
        }
      >
        <Link to="/drawer" className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-line bg-card p-4">
            <p className="text-xs text-sub">스크랩</p>
            <p className="mt-1 text-2xl font-bold">{scrapCount}<span className="ml-0.5 text-sm font-medium text-sub">개</span></p>
          </div>
          <div className="rounded-2xl border border-line bg-card p-4">
            <p className="text-xs text-sub">관심 직업</p>
            {jobs.length ? (
              <p className="mt-1.5 line-clamp-2 break-keep text-sm font-semibold leading-snug">{jobs.map((j) => j.title).join(', ')}</p>
            ) : (
              <p className="mt-1.5 text-sm text-faint">아직 없어요</p>
            )}
          </div>
        </Link>
      </Section>

      <Section title="둘러보기">
        <div className="flex flex-wrap gap-2">
          {TYPE_ORDER.map((t) => (
            <Link key={t} to={`/archive?type=${t}`} className="inline-flex min-h-11 items-center rounded-full border border-line bg-card px-4 text-sm">
              {TYPE_LABEL[t]}
            </Link>
          ))}
        </div>
      </Section>
    </>
  )
}

