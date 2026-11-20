// 사용자 데이터 저장소. Firebase 설정이 있으면 Firestore, 없으면(개발용) 이 기기 localStorage.
import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  type Firestore,
} from 'firebase/firestore'

export interface Profile {
  nickname: string
  consentAt: number
  createdAt: number
  lastVisitAt: number
}
export interface Note {
  text: string
  lookForAnswer: string
  updatedAt: number
}
export type ReactionValue = 'wow' | 'ok' | 'meh'
export interface Reaction {
  value: ReactionValue
  updatedAt: number
}
export interface View {
  firstViewedAt: number
  lastViewedAt: number
  count: number
}
export interface JobCard {
  whatTheyDo: string
  skills: string
  preparation: string
  relatedMajors: string
  workplace: string
  outlook: string
  sources: string
  updatedAt: number
}
export interface PlanOption {
  major: string
  job: string
  reason: string
}
export interface PlanB {
  options: PlanOption[]
  changePaths: string
}
export interface Subs {
  scraps: Record<string, { createdAt: number }>
  notes: Record<string, Note>
  reactions: Record<string, Reaction>
  views: Record<string, View>
  jobCards: Record<string, JobCard>
  planB: Record<string, PlanB>
}
export type SubName = keyof Subs
export const SUB_NAMES: SubName[] = ['scraps', 'notes', 'reactions', 'views', 'jobCards', 'planB']

export interface UserData extends Subs {
  id: string
  profile: Profile
}

export const emptySubs = (): Subs => ({ scraps: {}, notes: {}, reactions: {}, views: {}, jobCards: {}, planB: {} })

interface Backend {
  getProfile(id: string): Promise<Profile | null>
  setProfile(id: string, p: Profile): Promise<void>
  loadSubs(id: string): Promise<Subs>
  write(id: string, sub: SubName, docId: string, value: object | null): Promise<void>
  listUsers(): Promise<UserData[]>
  deleteUser(id: string): Promise<void>
}

// ---------- Firestore ----------
const env = import.meta.env
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}
export const usingFirebase = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId)

function firestoreBackend(): Backend {
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db: Firestore = getFirestore(app)
  let ready: Promise<unknown> | null = null
  // 익명 로그인은 보안 규칙용으로만 조용히 사용
  const authed = () => (ready ??= auth.currentUser ? Promise.resolve() : signInAnonymously(auth))

  async function loadSubs(id: string): Promise<Subs> {
    await authed()
    const subs = emptySubs()
    await Promise.all(
      SUB_NAMES.map(async (name) => {
        const snap = await getDocs(collection(db, 'users', id, name))
        const target = subs[name] as Record<string, unknown>
        snap.forEach((d) => (target[d.id] = d.data()))
      }),
    )
    return subs
  }

  return {
    async getProfile(id) {
      await authed()
      const snap = await getDoc(doc(db, 'users', id))
      return snap.exists() ? (snap.data() as Profile) : null
    },
    async setProfile(id, p) {
      await authed()
      await setDoc(doc(db, 'users', id), p)
    },
    loadSubs,
    async write(id, sub, docId, value) {
      await authed()
      const ref = doc(db, 'users', id, sub, docId)
      if (value === null) await deleteDoc(ref)
      else await setDoc(ref, value)
    },
    async listUsers() {
      await authed()
      const snap = await getDocs(collection(db, 'users'))
      return Promise.all(
        snap.docs.map(async (d) => ({ id: d.id, profile: d.data() as Profile, ...(await loadSubs(d.id)) })),
      )
    },
    async deleteUser(id) {
      await authed()
      // 하위 컬렉션 문서를 하나씩 지운 뒤 사용자 문서를 지운다
      for (const name of SUB_NAMES) {
        const snap = await getDocs(collection(db, 'users', id, name))
        for (const d of snap.docs) await deleteDoc(d.ref)
      }
      await deleteDoc(doc(db, 'users', id))
    },
  }
}

// ---------- 개발용: 이 기기에만 저장 ----------
function localBackend(): Backend {
  const KEY = 'career-archive:local-db'
  type DB = Record<string, { profile: Profile; subs: Subs }>
  const read = (): DB => {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? '{}') as DB
    } catch {
      return {}
    }
  }
  const save = (db: DB) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(db))
    } catch {
      /* 저장 불가 환경 */
    }
  }
  return {
    async getProfile(id) {
      return read()[id]?.profile ?? null
    },
    async setProfile(id, p) {
      const db = read()
      db[id] = { profile: p, subs: db[id]?.subs ?? emptySubs() }
      save(db)
    },
    async loadSubs(id) {
      return { ...emptySubs(), ...(read()[id]?.subs ?? {}) }
    },
    async write(id, sub, docId, value) {
      const db = read()
      if (!db[id]) return
      const target = db[id].subs[sub] as Record<string, unknown>
      if (value === null) delete target[docId]
      else target[docId] = value
      save(db)
    },
    async listUsers() {
      return Object.entries(read()).map(([id, u]) => ({ id, profile: u.profile, ...emptySubs(), ...u.subs }))
    },
    async deleteUser(id) {
      const db = read()
      delete db[id]
      save(db)
    },
  }
}

export const backend: Backend = usingFirebase ? firestoreBackend() : localBackend()

// ---------- 입장 ----------
/** 닉네임: 1~12자, 문서 ID에 쓸 수 없는 '/'와 공백 제외 */
export function validateNickname(n: string): string | null {
  const t = n.trim()
  if (!t) return '닉네임을 입력해 주세요'
  if (t.length > 12) return '닉네임은 12자까지 쓸 수 있어요'
  if (/[\s/]/.test(t) || t === '.' || t === '..') return '닉네임에는 띄어쓰기와 / 를 쓸 수 없어요'
  return null
}
export const validatePin = (p: string) => (/^\d{4}$/.test(p) ? null : '숫자 4자리를 입력해 주세요')
export const userIdOf = (nickname: string, pin: string) => `${nickname.trim()}_${pin}`

const REMEMBER_KEY = 'career-archive:user'
export function rememberedUser(): string | null {
  try {
    return localStorage.getItem(REMEMBER_KEY)
  } catch {
    return null
  }
}
export function rememberUser(id: string | null) {
  try {
    if (id) localStorage.setItem(REMEMBER_KEY, id)
    else localStorage.removeItem(REMEMBER_KEY)
  } catch {
    /* noop */
  }
}
