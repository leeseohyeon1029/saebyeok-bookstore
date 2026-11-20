import { relatedOf, type Item } from './content'
import type { JobCard } from './store'

export type JobCardKey = Exclude<keyof JobCard, 'updatedAt'>

export const JOB_CARD_FIELDS: { key: JobCardKey; label: string; hint: string; find: (job: Item) => Item[] }[] = [
  { key: 'whatTheyDo', label: '하는 일', hint: '이 직업은 하루에 어떤 일을 할까?', find: (j) => [j, ...rel(j, 'case')] },
  { key: 'skills', label: '필요한 능력·지식', hint: '외국어 말고 필요한 것도 적어 보기', find: (j) => [j, ...rel(j, 'case')] },
  { key: 'preparation', label: '준비 과정', hint: '자격, 대학원, 시험 등', find: (j) => [j, ...rel(j, 'major')] },
  { key: 'relatedMajors', label: '관련 학과·과목', hint: '어떤 학과, 어떤 수업과 이어질까?', find: (j) => rel(j, 'major', 'case') },
  { key: 'workplace', label: '근무환경', hint: '어디서, 누구와 일할까?', find: (j) => [j, ...rel(j, 'video')] },
  { key: 'outlook', label: '미래 전망', hint: 'AI·산업 변화와 함께 어떻게 달라질까?', find: (j) => [j, ...rel(j, 'job', 'video')] },
]

function rel(job: Item, ...types: Item['type'][]) {
  return relatedOf(job).filter((r) => types.includes(r.type))
}

export const filledCount = (c: JobCard | undefined) =>
  c ? JOB_CARD_FIELDS.filter((f) => c[f.key]?.trim()).length : 0
