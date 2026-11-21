// 사이트 운영 정보 (진로 콘텐츠가 아님). 바뀌면 여기만 고친다.
export const CONTACT_EMAIL = 'shyeon296@naver.com'

/**
 * 화면 맨 위 공지. 내리려면 NOTICE = null 로 바꾼다.
 * 새 공지를 올릴 때는 id를 바꿔야 전에 닫은 학생에게도 다시 보인다.
 */
export const NOTICE: { id: string; title: string; text: string; linkLabel: string; url: string } | null = {
  id: 'survey-2026-11',
  title: '설문 응답 부탁드려요',
  text: '멘토링을 마치며 짧은 설문을 준비했어요. 잠깐 시간 내서 응답해 주세요!',
  linkLabel: '설문 열기',
  url: 'https://naver.me/Fc6eb1ok',
}
