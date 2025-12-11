import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

app.post('/api/gpt', async (req, res) => {
  const { message } = req.body
  console.log('📩 받은 질문:', message)

  // ✅ 실제 GPT 호출 대신, 임시로 응답 반환
  const fakeResponse = {
    role: 'assistant',
    content: `💡 [모의 GPT 응답] "${message}"에 대한 개발 가이드를 제공해 드릴게요!\n\n- 예: Vue 컴포넌트는 Composition API 기반으로 작성하세요.\n- 주석은 반드시 한글로 설명 추가\n- 스타일은 Tailwind 사용 권장\n\n궁금한 점 더 말씀해주세요!`
  }

  return res.json(fakeResponse)
})

app.listen(3001, () => console.log('✅ 백엔드 서버 실행 중: http://localhost:3001'))
