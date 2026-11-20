import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { UserProvider, useUser } from './lib/UserContext'
import Archive from './pages/Archive'
import Compare from './pages/Compare'
import Detail from './pages/Detail'
import Drawer from './pages/Drawer'
import Entry from './pages/Entry'
import Home from './pages/Home'
import JobCardEdit from './pages/JobCardEdit'
import { MentorLogin, MentorStudent, MentorStudents } from './pages/mentor/Mentor'

function RequireUser() {
  const { status } = useUser()
  if (status === 'loading')
    return <div className="flex min-h-dvh items-center justify-center text-sm text-faint">불러오는 중…</div>
  if (status === 'out') return <Navigate to="/" replace />
  return <Outlet />
}

function Start() {
  const { status } = useUser()
  if (status === 'loading')
    return <div className="flex min-h-dvh items-center justify-center text-sm text-faint">불러오는 중…</div>
  return <Entry />
}

// GitHub Pages는 새로고침 시 하위 경로를 찾지 못하므로 HashRouter(#/경로)를 쓴다
export default function App() {
  return (
    <HashRouter>
      <UserProvider>
        <Routes>
          <Route path="/" element={<Start />} />
          <Route path="/mentor" element={<MentorLogin />} />
          <Route path="/mentor/students" element={<MentorStudents />} />
          <Route path="/mentor/students/:id" element={<MentorStudent />} />
          <Route element={<RequireUser />}>
            <Route element={<Layout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/archive" element={<Archive />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/drawer" element={<Drawer />} />
            </Route>
            <Route path="/item/:id" element={<Detail />} />
            <Route path="/drawer/job/:id" element={<JobCardEdit />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </UserProvider>
    </HashRouter>
  )
}
