import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 배포 주소(저장소 이름)가 바뀌면 이 값만 고친다. 예: '/new-repo-name/'
const BASE_PATH = '/saebyeok-bookstore/'

export default defineConfig({
  base: BASE_PATH,
  plugins: [react()],
  build: {
    rollupOptions: {
      output: { manualChunks: { firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'] } },
    },
  },
})
