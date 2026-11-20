import { formatDate } from '../../lib/format'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { DrawerView, type DrawerTab } from '../../components/DrawerView'
import { Shell } from '../../components/Layout'
import { BackHeader, btnPrimary, inputCls } from '../../components/ui'
import { getItem } from '../../lib/content'
import { backend, type UserData } from '../../lib/store'

const KEY = 'career-archive:mentor'
const isMentor = () => {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}
const setMentor = (on: boolean) => {
  try {
    if (on) sessionStorage.setItem(KEY, '1')
    else sessionStorage.removeItem(KEY)
  } catch {
    /* noop */
  }
}

export function MentorLogin() {
  const nav = useNavigate()
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  if (isMentor()) return <Navigate to="/mentor/students" replace />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const expected = import.meta.env.VITE_MENTOR_PASSWORD
    if (expected && pw === expected) {
      setMentor(true)
      nav('/mentor/students', { replace: true })
    } else setError('비밀번호가 맞지 않아요')
  }

  return (
    <Shell>
      <BackHeader title="멘토 로그인" />
      <form onSubmit={submit} className="space-y-3 pt-8">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-sub">비밀번호</span>
          <input type="password" className={inputCls} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
        </label>
        {error && <p className="text-sm text-[#a04040]">{error}</p>}
        <button type="submit" className={`${btnPrimary} w-full`} disabled={!pw}>
          들어가기
        </button>
      </form>
    </Shell>
  )
}

const count = (rec: Record<string, unknown>) => Object.keys(rec).filter((id) => getItem(id)).length

export function MentorStudents() {
  const nav = useNavigate()
  const [users, setUsers] = useState<UserData[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!isMentor()) return
    backend
      .listUsers()
      .then((u) => setUsers(u.sort((a, b) => (b.profile?.lastVisitAt ?? 0) - (a.profile?.lastVisitAt ?? 0))))
      .catch(() => setError(true))
  }, [])

  if (!isMentor()) return <Navigate to="/mentor" replace />

  return (
    <Shell>
      <header className="flex items-center justify-between pb-2 pt-6">
        <h1 className="text-[22px] font-bold">학생 기록</h1>
        <button
          type="button"
          className="min-h-11 px-2 text-sm text-sub underline underline-offset-2"
          onClick={() => {
            setMentor(false)
            nav('/', { replace: true })
          }}
        >
          나가기
        </button>
      </header>
      {error && <p className="py-6 text-sm text-[#a04040]">학생 목록을 불러오지 못했어요</p>}
      {!users && !error && <p className="py-6 text-sm text-faint">불러오는 중…</p>}
      {users?.length === 0 && <p className="py-6 text-sm text-faint">아직 들어온 학생이 없어요</p>}
      <ul className="space-y-2 pb-10">
        {users?.map((u) => {
          const jobs = Object.keys(u.jobCards)
            .map((id) => getItem(id)?.title)
            .filter(Boolean)
          return (
            <li key={u.id}>
              <Link to={`/mentor/students/${encodeURIComponent(u.id)}`} className="block rounded-2xl border border-line bg-card p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[15px] font-semibold">{u.profile?.nickname ?? u.id}</p>
                  <p className="text-xs text-faint">마지막 접속 {formatDate(u.profile?.lastVisitAt)}</p>
                </div>
                <p className="mt-1 text-sm text-sub">
                  스크랩 {count(u.scraps)} · 메모 {count(u.notes)} · 본 자료 {count(u.views)}
                </p>
                <p className="mt-0.5 truncate text-sm text-sub">관심 직업: {jobs.length ? jobs.join(', ') : '-'}</p>
              </Link>
            </li>
          )
        })}
      </ul>
    </Shell>
  )
}

export function MentorStudent() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const [user, setUser] = useState<UserData | null | undefined>(undefined)
  const [tab, setTab] = useState<DrawerTab>('scraps')
  const [confirmText, setConfirmText] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    const p = await backend.getProfile(id)
    if (!p) return setUser(null)
    setUser({ id, profile: p, ...(await backend.loadSubs(id)) })
  }, [id])

  useEffect(() => {
    if (isMentor()) load().catch(() => setUser(null))
  }, [load])

  if (!isMentor()) return <Navigate to="/mentor" replace />

  async function remove() {
    if (!user || confirmText !== user.profile.nickname) return
    setDeleting(true)
    try {
      await backend.deleteUser(user.id)
      nav('/mentor/students', { replace: true })
    } catch {
      alert('삭제하지 못했어요. 다시 시도해 주세요')
      setDeleting(false)
    }
  }

  return (
    <Shell>
      <BackHeader title={user?.profile.nickname ?? '학생'} />
      {user === undefined && <p className="py-8 text-sm text-faint">불러오는 중…</p>}
      {user === null && <p className="py-8 text-sm text-faint">기록이 없어요</p>}
      {user && (
        <div className="pb-12 pt-4">
          <p className="text-xs text-sub">
            처음 접속 {formatDate(user.profile.createdAt)} · 마지막 접속 {formatDate(user.profile.lastVisitAt)} · 읽기 전용
          </p>
          <div className="mt-4">
            <DrawerView data={user} readOnly tab={tab} onTab={setTab} />
          </div>

          <div className="mt-14 border-t border-line pt-4">
            {!showDelete ? (
              <button type="button" onClick={() => setShowDelete(true)} className="min-h-11 text-xs text-[#b04848]">
                학생 삭제
              </button>
            ) : (
              <div className="rounded-2xl border border-[#ecd0d0] bg-[#fbf3f3] p-4">
                <p className="break-keep text-sm text-[#8a3a3a]">
                  ‘{user.profile.nickname}’의 모든 기록(스크랩, 메모, 반응, 탐색 기록, 관심 직업, 플랜)을 지워요. 되돌릴 수 없어요.
                </p>
                <label className="mt-3 block">
                  <span className="mb-1 block text-xs text-sub">확인을 위해 닉네임을 그대로 입력해 주세요</span>
                  <input className={inputCls} value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
                </label>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="min-h-11 flex-1 rounded-xl border border-line bg-card text-sm"
                    onClick={() => {
                      setShowDelete(false)
                      setConfirmText('')
                    }}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    disabled={confirmText !== user.profile.nickname || deleting}
                    onClick={remove}
                    className="min-h-11 flex-1 rounded-xl bg-[#b04848] text-sm font-semibold text-white disabled:opacity-30"
                  >
                    {deleting ? '삭제 중…' : '삭제'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Shell>
  )
}
