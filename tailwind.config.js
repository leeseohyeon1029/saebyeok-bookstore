/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f8f5ef',
        card: '#ffffff',
        ink: '#2b2925',
        sub: '#6b665d',
        faint: '#9c968b',
        line: '#e7e1d6',
        accent: { DEFAULT: '#3f6b5b', soft: '#e6efe9', dark: '#2f5446' },
        warm: { DEFAULT: '#b4683c', soft: '#f6e9df' },
      },
      fontFamily: {
        sans: ['Pretendard', '"Apple SD Gothic Neo"', '"Noto Sans KR"', '"Malgun Gothic"', 'system-ui', 'sans-serif'],
      },
      maxWidth: { app: '720px' },
    },
  },
  plugins: [],
}
