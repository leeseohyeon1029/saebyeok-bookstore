import { NavLink, Outlet } from 'react-router-dom'
import type { ReactNode } from 'react'
import { usingFirebase } from '../lib/store'
import Notice from './Notice'
import { useUser } from '../lib/UserContext'

const tabs: { to: string; label: string; icon: ReactNode }[] = [
  {
    to: '/home',
    label: '홈',
    icon: <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" strokeLinejoin="round" />,
  },
  {
    to: '/archive',
    label: '아카이브',
    icon: (
      <>
        <rect x="4" y="4" width="16" height="5" rx="1" />
        <path d="M5.5 9v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9M10 13h4" strokeLinecap="round" />
      </>
    ),
  },
  {
    to: '/compare',
    label: '비교',
    icon: (
      <>
        <rect x="3.5" y="5" width="7" height="14" rx="1.5" />
        <rect x="13.5" y="5" width="7" height="14" rx="1.5" />
      </>
    ),
  },
  {
    to: '/drawer',
    label: '내 서랍',
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M4 12h16M10 8h4M10 16h4" strokeLinecap="round" />
      </>
    ),
  },
]

export function Shell({ children }: { children: ReactNode }) {
  return <div className="mx-auto min-h-dvh w-full max-w-app px-4">{children}</div>
}

export default function Layout() {
  const { saveError } = useUser()
  return (
    <Shell>
      <Notice />
      {!usingFirebase && (
        <p className="-mx-4 bg-warm-soft px-4 py-2 text-center text-xs text-warm">
          개발 모드: 기록이 이 기기에만 저장돼요
        </p>
      )}
      {saveError && (
        <p className="-mx-4 bg-[#f6e3e3] px-4 py-2 text-center text-xs text-[#8a3a3a]">
          저장이 잠시 안 되고 있어요. 인터넷 연결을 확인해 주세요
        </p>
      )}
      <main className="pb-28">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <ul className="mx-auto flex max-w-app">
          {tabs.map((t) => (
            <li key={t.to} className="flex-1">
              <NavLink
                to={t.to}
                className={({ isActive }) =>
                  `flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${isActive ? 'text-accent' : 'text-faint'}`
                }
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  {t.icon}
                </svg>
                {t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </Shell>
  )
}
