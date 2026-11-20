import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Shell } from '../components/Layout'
import { BackHeader, inputCls } from '../components/ui'
import { careernetUrl, getItem } from '../lib/content'
import { filledCount, JOB_CARD_FIELDS, type JobCardKey } from '../lib/jobcard'
import type { JobCard } from '../lib/store'
import { useAutosave, useUser } from '../lib/UserContext'

type Draft = Omit<JobCard, 'updatedAt'>

export default function JobCardEdit() {
  const { id } = useParams()
  const job = getItem(id)
  const { data } = useUser()
  const card = id ? data.jobCards[id] : undefined
  if (!job || job.type !== 'job' || !card) return <Navigate to="/drawer?tab=jobs" replace />
  return <Editor jobId={job.id} title={job.title} initial={card} />
}

function Editor({ jobId, title, initial }: { jobId: string; title: string; initial: JobCard }) {
  const { saveJobCard, saving } = useUser()
  const job = getItem(jobId)!
  const [draft, setDraft] = useState<Draft>(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { updatedAt, ...rest } = initial
    return rest
  })
  const [openFind, setOpenFind] = useState<JobCardKey | null>(null)
  useAutosave(draft, (d) => saveJobCard(jobId, d))
  const n = filledCount({ ...draft, updatedAt: 0 })

  return (
    <Shell>
      <BackHeader title={`${title} 정리 카드`} right={<span className="pr-3 text-xs text-faint">{saving ? '저장 중…' : '자동 저장'}</span>} />
      <div className="pb-16 pt-5">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-xs text-sub">관심 직업 정리 카드</p>
            <h1 className="mt-0.5 text-xl font-bold">{title}</h1>
          </div>
          <p className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-dark">
            {JOB_CARD_FIELDS.length}개 중 {n}개
          </p>
        </div>
        <p className="mt-2 break-keep text-sm leading-relaxed text-sub">
          자료를 읽고 내 말로 옮겨 적어요. 모든 칸을 한 번에 채우지 않아도 괜찮아요.
        </p>

        <div className="mt-5 space-y-4">
          {JOB_CARD_FIELDS.map((f) => {
            const found = f.find(job)
            const open = openFind === f.key
            return (
              <section key={f.key} className="rounded-2xl border border-line bg-card p-4">
                <label className="block">
                  <span className="flex items-center justify-between">
                    <span className="text-sm font-bold">{f.label}</span>
                    {draft[f.key].trim() && <span className="text-xs text-accent">✓</span>}
                  </span>
                  <textarea
                    className={`${inputCls} mt-2 resize-none leading-relaxed`}
                    rows={3}
                    placeholder={f.hint}
                    value={draft[f.key]}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                  />
                </label>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[13px]">
                  {found.length > 0 && (
                    <button type="button" onClick={() => setOpenFind(open ? null : f.key)} className="min-h-11 text-accent" aria-expanded={open}>
                      이 아카이브에서 찾기 {open ? '▴' : '▾'}
                    </button>
                  )}
                  {careernetUrl && (
                    <a href={careernetUrl} target="_blank" rel="noopener noreferrer" className="min-h-11 content-center text-sub underline underline-offset-2">
                      커리어넷에서 찾기 ↗
                    </a>
                  )}
                </div>
                {open && (
                  <ul className="mt-1 space-y-1">
                    {found.map((it) => (
                      <li key={it.id}>
                        <Link to={`/item/${it.id}`} className="flex min-h-11 items-center rounded-lg bg-paper px-3 text-sm">
                          {it.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
          <section className="rounded-2xl border border-line bg-card p-4">
            <label className="block">
              <span className="text-sm font-bold">출처</span>
              <span className="ml-1 text-xs text-sub">어디서 보고 적었는지 (사이트 이름이나 링크)</span>
              <textarea
                className={`${inputCls} mt-2 resize-none leading-relaxed`}
                rows={2}
                value={draft.sources}
                onChange={(e) => setDraft((d) => ({ ...d, sources: e.target.value }))}
              />
            </label>
          </section>
        </div>
      </div>
    </Shell>
  )
}
