import { Link, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { fieldName, TYPE_LABEL, type Item, type ItemType } from '../lib/content'
import { useUser } from '../lib/UserContext'

const TYPE_STYLE: Record<ItemType, string> = {
  major: 'bg-accent-soft text-accent-dark',
  job: 'bg-warm-soft text-warm',
  case: 'bg-[#eae8f3] text-[#4f4a7a]',
  video: 'bg-[#f3e6e6] text-[#8a4444]',
  resource: 'bg-[#e8eef3] text-[#3e5a70]',
}

export function TypeBadge({ type }: { type: ItemType }) {
  return (
    <span className={`inline-flex h-6 items-center rounded-md px-2 text-xs font-semibold ${TYPE_STYLE[type]}`}>
      {TYPE_LABEL[type]}
    </span>
  )
}

export function FieldBadges({ fields, max = 2 }: { fields: string[]; max?: number }) {
  const shown = fields.slice(0, max)
  return (
    <>
      {shown.map((f) => (
        <span key={f} className="inline-flex h-6 items-center rounded-md border border-line px-2 text-xs text-sub">
          {fieldName(f)}
        </span>
      ))}
      {fields.length > max && <span className="text-xs text-faint">+{fields.length - max}</span>}
    </>
  )
}

export function ScrapIcon({ on, className = 'h-5 w-5' }: { on: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8}>
      <path d="M6 3.5h12a.5.5 0 0 1 .5.5v16.3a.4.4 0 0 1-.64.32L12 16.5l-5.86 4.12a.4.4 0 0 1-.64-.32V4a.5.5 0 0 1 .5-.5z" strokeLinejoin="round" />
    </svg>
  )
}

export function ScrapButton({ id, className = '' }: { id: string; className?: string }) {
  const { data, toggleScrap } = useUser()
  const on = !!data.scraps[id]
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleScrap(id)
      }}
      aria-pressed={on}
      aria-label={on ? '스크랩 취소' : '스크랩'}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${on ? 'text-accent' : 'text-faint hover:text-sub'} ${className}`}
    >
      <ScrapIcon on={on} />
    </button>
  )
}

export function ItemCard({ item, compact = false }: { item: Item; compact?: boolean }) {
  return (
    <Link
      to={`/item/${item.id}`}
      className="flex items-start gap-2 rounded-2xl border border-line bg-card p-4 transition-colors hover:border-[#d6cebf]"
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <TypeBadge type={item.type} />
          {!compact && <FieldBadges fields={item.fields} />}
        </div>
        <h3 className="break-keep text-[15px] font-semibold leading-snug text-ink">{item.title}</h3>
        <p className={`mt-1 break-keep text-sm leading-relaxed text-sub ${compact ? 'line-clamp-1' : 'line-clamp-2'}`}>
          {item.summary}
        </p>
      </div>
      <ScrapButton id={item.id} className="-mr-2 -mt-2" />
    </Link>
  )
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-7">
      <div className="mb-2.5 flex items-end justify-between gap-2">
        <h2 className="text-[15px] font-bold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function BackHeader({ title, right }: { title?: string; right?: ReactNode }) {
  const nav = useNavigate()
  return (
    <header className="sticky top-0 z-20 -mx-4 flex h-14 items-center gap-1 border-b border-line bg-paper/95 px-2 backdrop-blur">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? nav(-1) : nav('/home'))}
        className="flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-black/5"
        aria-label="뒤로"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <h1 className="min-w-0 flex-1 truncate text-base font-semibold">{title}</h1>
      {right}
    </header>
  )
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="pb-1 pt-6">
      <h1 className="text-[22px] font-bold tracking-tight text-ink">{children}</h1>
      {sub && <p className="mt-1 text-sm text-sub">{sub}</p>}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-faint">{children}</p>
}

export const inputCls =
  'w-full rounded-xl border border-line bg-card px-3.5 py-3 text-[15px] text-ink placeholder:text-faint focus:border-accent focus:outline-none'
export const btnPrimary =
  'inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-5 text-[15px] font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-40'
export const btnGhost =
  'inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-card px-4 text-sm font-medium text-ink hover:bg-black/[0.03]'

