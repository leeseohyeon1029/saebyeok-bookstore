import { useState } from 'react'
import { NOTICE } from '../lib/site'

const key = (id: string) => `career-archive:notice-closed:${id}`

function isClosed(id: string) {
  try {
    return localStorage.getItem(key(id)) === '1'
  } catch {
    return false
  }
}

/** 화면 맨 위 공지 띠. 닫으면 이 기기에서는 같은 공지가 다시 안 보인다. */
export default function Notice() {
  const [closed, setClosed] = useState(() => (NOTICE ? isClosed(NOTICE.id) : true))
  if (!NOTICE || closed) return null
  const id = NOTICE.id

  const close = () => {
    try {
      localStorage.setItem(key(id), '1')
    } catch {
      /* 저장이 안 되면 이번 방문에서만 닫힘 */
    }
    setClosed(true)
  }

  return (
    <div role="status" className="-mx-4 border-b border-accent/20 bg-accent-soft px-4 py-3">
      <div className="flex items-start gap-3">
        <span aria-hidden className="mt-0.5 text-lg leading-none">📋</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-accent-dark">{NOTICE.title}</p>
          <p className="mt-0.5 break-keep text-[13px] leading-relaxed text-ink">{NOTICE.text}</p>
          <a
            href={NOTICE.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex min-h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-dark"
          >
            {NOTICE.linkLabel} ↗
          </a>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="공지 닫기"
          className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sub hover:bg-black/5"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
