import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  backend,
  emptySubs,
  rememberUser,
  rememberedUser,
  type JobCard,
  type Note,
  type PlanB,
  type Profile,
  type ReactionValue,
  type SubName,
  type Subs,
} from './store'

export const MAX_JOB_CARDS = 3

interface Ctx {
  status: 'loading' | 'out' | 'in'
  userId: string | null
  profile: Profile | null
  data: Subs
  saving: boolean
  saveError: boolean
  enter(id: string, profile: Profile): Promise<void>
  logout(): void
  toggleScrap(itemId: string): void
  setReaction(itemId: string, value: ReactionValue | null): void
  saveNote(itemId: string, note: Omit<Note, 'updatedAt'>): void
  recordView(itemId: string): void
  addJobCard(jobId: string): boolean
  removeJobCard(jobId: string): void
  saveJobCard(jobId: string, card: Omit<JobCard, 'updatedAt'>): void
  savePlanB(plan: PlanB): void
}

const UserCtx = createContext<Ctx | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Ctx['status']>('loading')
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [data, setData] = useState<Subs>(emptySubs)
  const [pending, setPending] = useState(0)
  const [saveError, setSaveError] = useState(false)
  const dataRef = useRef(data)
  dataRef.current = data

  const open = useCallback(async (id: string, p: Profile) => {
    const now = Date.now()
    const next = { ...p, lastVisitAt: now }
    await backend.setProfile(id, next)
    const subs = await backend.loadSubs(id)
    setUserId(id)
    setProfile(next)
    setData(subs)
    rememberUser(id)
    setStatus('in')
  }, [])

  // 기기에 기억된 사용자는 바로 들어간다. 멘토가 삭제했다면 첫 화면으로.
  useEffect(() => {
    const id = rememberedUser()
    if (!id) {
      setStatus('out')
      return
    }
    backend
      .getProfile(id)
      .then((p) => {
        if (p) return open(id, p)
        rememberUser(null)
        setStatus('out')
      })
      .catch(() => setStatus('out'))
  }, [open])

  const write = useCallback(
    (sub: SubName, docId: string, value: object | null) => {
      if (!userId) return
      setPending((n) => n + 1)
      backend
        .write(userId, sub, docId, value)
        .then(() => setSaveError(false))
        .catch(() => setSaveError(true))
        .finally(() => setPending((n) => n - 1))
    },
    [userId],
  )

  const patch = useCallback(<K extends SubName>(sub: K, docId: string, value: Subs[K][string] | null) => {
    setData((d) => {
      const nextSub = { ...d[sub] } as Record<string, unknown>
      if (value === null) delete nextSub[docId]
      else nextSub[docId] = value
      return { ...d, [sub]: nextSub }
    })
  }, [])

  const api = useMemo<Ctx>(
    () => ({
      status,
      userId,
      profile,
      data,
      saving: pending > 0,
      saveError,
      enter: open,
      logout() {
        rememberUser(null)
        setUserId(null)
        setProfile(null)
        setData(emptySubs())
        setStatus('out')
      },
      toggleScrap(itemId) {
        const has = !!dataRef.current.scraps[itemId]
        const v = has ? null : { createdAt: Date.now() }
        patch('scraps', itemId, v)
        write('scraps', itemId, v)
      },
      setReaction(itemId, value) {
        const v = value ? { value, updatedAt: Date.now() } : null
        patch('reactions', itemId, v)
        write('reactions', itemId, v)
      },
      saveNote(itemId, note) {
        const empty = !note.text.trim() && !note.lookForAnswer.trim()
        const v = empty ? null : { ...note, updatedAt: Date.now() }
        patch('notes', itemId, v)
        write('notes', itemId, v)
      },
      recordView(itemId) {
        const now = Date.now()
        const prev = dataRef.current.views[itemId]
        const v = prev
          ? { ...prev, lastViewedAt: now, count: prev.count + 1 }
          : { firstViewedAt: now, lastViewedAt: now, count: 1 }
        patch('views', itemId, v)
        write('views', itemId, v)
      },
      addJobCard(jobId) {
        const cards = dataRef.current.jobCards
        if (cards[jobId]) return true
        if (Object.keys(cards).length >= MAX_JOB_CARDS) return false
        const v: JobCard = {
          whatTheyDo: '',
          skills: '',
          preparation: '',
          relatedMajors: '',
          workplace: '',
          outlook: '',
          sources: '',
          updatedAt: Date.now(),
        }
        patch('jobCards', jobId, v)
        write('jobCards', jobId, v)
        return true
      },
      removeJobCard(jobId) {
        patch('jobCards', jobId, null)
        write('jobCards', jobId, null)
      },
      saveJobCard(jobId, card) {
        const v = { ...card, updatedAt: Date.now() }
        patch('jobCards', jobId, v)
        write('jobCards', jobId, v)
      },
      savePlanB(plan) {
        patch('planB', 'main', plan)
        write('planB', 'main', plan)
      },
    }),
    [status, userId, profile, data, pending, saveError, open, patch, write],
  )

  return <UserCtx.Provider value={api}>{children}</UserCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUser() {
  const c = useContext(UserCtx)
  if (!c) throw new Error('UserProvider 밖에서 useUser를 썼습니다')
  return c
}

/** 입력이 멈추면 자동 저장 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAutosave<T>(value: T, save: (v: T) => void, delay = 700) {
  const saved = useRef(JSON.stringify(value))
  const pending = useRef<{ v: T } | null>(null)
  const saveRef = useRef(save)
  saveRef.current = save
  useEffect(() => {
    if (JSON.stringify(value) === saved.current) return
    pending.current = { v: value }
    const t = setTimeout(() => {
      saved.current = JSON.stringify(value)
      pending.current = null
      saveRef.current(value)
    }, delay)
    return () => clearTimeout(t)
  }, [value, delay])
  // 화면을 떠날 때 아직 저장 안 된 내용이 있으면 바로 저장
  useEffect(
    () => () => {
      if (pending.current) {
        saved.current = JSON.stringify(pending.current.v)
        saveRef.current(pending.current.v)
        pending.current = null
      }
    },
    [],
  )
}
