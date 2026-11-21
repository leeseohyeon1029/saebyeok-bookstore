import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Shell } from '../components/Layout'
import Notice from '../components/Notice'
import { btnGhost, btnPrimary, inputCls } from '../components/ui'
import { ITEMS } from '../lib/content'
import { backend, userIdOf, validateNickname, validatePin, type Profile } from '../lib/store'
import { useUser } from '../lib/UserContext'

export default function Entry() {
  const { status, enter } = useUser()
  const nav = useNavigate()
  const [nickname, setNickname] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [consent, setConsent] = useState<{ id: string; nickname: string } | null>(null)

  if (status === 'in') return <Navigate to="/home" replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    const msg = validateNickname(nickname) ?? validatePin(pin)
    if (msg) return setError(msg)
    setError('')
    setBusy(true)
    try {
      const id = userIdOf(nickname, pin)
      const p = await backend.getProfile(id)
      if (p) {
        await enter(id, p)
        nav('/home', { replace: true })
      } else {
        setConsent({ id, nickname: nickname.trim() })
      }
    } catch {
      setError('연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요')
    } finally {
      setBusy(false)
    }
  }

  async function agree() {
    if (!consent) return
    setBusy(true)
    try {
      const now = Date.now()
      const p: Profile = { nickname: consent.nickname, consentAt: now, createdAt: now, lastVisitAt: now }
      await enter(consent.id, p)
      nav('/home', { replace: true })
    } catch {
      setError('연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요')
      setConsent(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell>
      <Notice />
      <div className="flex min-h-dvh flex-col">
        <div className="flex flex-1 flex-col justify-center py-10">
          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="#f8f5ef" strokeWidth={1.8}>
                <rect x="4" y="4" width="16" height="5" rx="1" />
                <path d="M5.5 9v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9M10 13h4" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="text-[26px] font-bold leading-tight tracking-tight">진로 아카이브</h1>
            <p className="mt-2 break-keep text-[15px] leading-relaxed text-sub">
              학과·직업·대학 수업 사례를 출처와 함께 모아 둔 자료실이에요.
              <br />
              지금 {ITEMS.length}개의 자료가 있어요.
            </p>
          </div>

          {consent ? (
            <div className="rounded-2xl border border-line bg-card p-5">
              <p className="text-[15px] font-semibold">처음 오셨네요, {consent.nickname}님</p>
              <p className="mt-2 break-keep text-sm leading-relaxed text-sub">
                내 기록(스크랩, 메모, 관심 직업 정리)은 멘토 선생님도 볼 수 있어요.
              </p>
              <div className="mt-5 flex gap-2">
                <button type="button" className={btnGhost} onClick={() => setConsent(null)} disabled={busy}>
                  돌아가기
                </button>
                <button type="button" className={`${btnPrimary} flex-1`} onClick={agree} disabled={busy}>
                  확인했어요
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3" noValidate>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-sub">닉네임</span>
                <input
                  className={inputCls}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={12}
                  autoComplete="off"
                  placeholder="예: 새벽"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-sub">숫자 4자리</span>
                <input
                  className={inputCls}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="다음에 들어올 때도 같은 숫자를 써요"
                />
              </label>
              {error && <p className="text-sm text-[#a04040]">{error}</p>}
              <button type="submit" className={`${btnPrimary} mt-2 w-full`} disabled={busy}>
                {busy ? '확인 중…' : '들어가기'}
              </button>
              <p className="break-keep pt-1 text-xs leading-relaxed text-faint">
                처음이면 새 서랍이 만들어지고, 전에 쓴 닉네임과 숫자면 기록을 불러와요. 다른 기기에서도 같은 값으로 들어오면 돼요.
              </p>
            </form>
          )}
        </div>
        <div className="flex justify-center pb-6">
          <Link to="/mentor" className="inline-flex min-h-11 items-center px-3 text-xs text-[#b5afa4] underline underline-offset-2">
            멘토 로그인
          </Link>
        </div>
      </div>
    </Shell>
  )
}
