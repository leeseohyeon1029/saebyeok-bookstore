import { useSearchParams } from 'react-router-dom'
import { DrawerView, type DrawerTab } from '../components/DrawerView'
import { PageTitle } from '../components/ui'
import { useUser } from '../lib/UserContext'

const TABS: DrawerTab[] = ['scraps', 'notes', 'jobs', 'plan', 'history']

export default function Drawer() {
  const { profile, data, removeJobCard, savePlanB, logout, saving } = useUser()
  const [params, setParams] = useSearchParams()
  const t = params.get('tab') as DrawerTab
  const tab = TABS.includes(t) ? t : 'scraps'

  return (
    <>
      <PageTitle sub={saving ? '저장 중…' : `${profile?.nickname}님이 모은 것들`}>내 서랍</PageTitle>
      <div className="mt-3">
        <DrawerView
          data={data}
          tab={tab}
          onTab={(next) => setParams({ tab: next }, { replace: true })}
          onRemoveJob={removeJobCard}
          onSavePlan={savePlanB}
        />
      </div>
      <div className="mt-10 border-t border-line pt-4 text-center">
        <button
          type="button"
          className="min-h-11 px-3 text-xs text-faint underline underline-offset-2"
          onClick={() => confirm('이 기기에서 나갈까요? 같은 닉네임과 숫자로 다시 들어오면 기록이 그대로 있어요.') && logout()}
        >
          이 기기에서 나가기
        </button>
      </div>
    </>
  )
}
