// 사이트 운영 정보 (진로 콘텐츠가 아님). 바뀌면 여기만 고친다.
export const CONTACT_EMAIL = 'shyeon296@naver.com'

/**
 * 화면 맨 위 공지. 내리려면 NOTICE = null 로 바꾼다.
 * 새 공지를 올릴 때는 id를 바꿔야 전에 닫은 학생에게도 다시 보인다.
 */
export const NOTICE: { id: string; title: string; text: string; linkLabel: string; url: string } | null = {
  id: 'survey-2026-11',
  title: '마지막 멘토링 설문',
  text: '마지막 멘토링 설문이 필요하다고 해서 전달합니다! 아래 버튼 눌러서 응답해 주세요.',
  linkLabel: '설문 열기',
  url: 'https://naver.me/Fc6eb1ok',
}
