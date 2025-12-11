// src/api/gpt.js

export async function askGPT(message) {
  try {
    const response = await fetch('http://localhost:3001/api/gpt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })

    const data = await response.json()
    console.log('✅ 백엔드 응답:', data)

    return data.content ?? '(응답 없음)'

  } catch (error) {
    console.error('❌ 백엔드 호출 실패:', error)
    return '(GPT 호출 중 에러 발생)'
  }
}
