<template>
  <div class="layout">

    <!-- 왼쪽: 통합 입력 패널 -->
    <div class="left-panel">
      <h2>입력</h2>

   <textarea 
      v-model="combinedInput"
      class="source-box"
      @paste="handlePaste"
      placeholder="여기에 코드, 설명, 질문을 모두 입력하세요."
      @keydown="handleKey"
    />


      <button class="send-btn" @click="sendMessage">전송</button>
    </div>

    <!-- 오른쪽: 챗봇 메시지 UI -->
    <div class="right-panel">
      <h2>Chatbot</h2>

      <div class="messages" ref="msgBox">
        <div 
          v-for="(msg, idx) in messages"
          :key="idx"
          :class="msg.role"
        >
          {{ msg.text }}
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { nextTick } from "vue";

export default {
  data() {
    return {
      ws: null,
      combinedInput: "",   // ← 하나로 통합된 입력값
      messages: [],
    };
  },

  mounted() {
    this.ws = new WebSocket("wss://server-vertex.onrender.com");
    //this.ws = new WebSocket("ws://localhost:3001");

    this.ws.onmessage = (event) => {
      const text = event.data;
      if (text === "[[END]]") return;
      if (text === "[[ERROR]]") {
        this.messages.push({
          role: "assistant",
          text: "(서버 에러 발생)"
        });
        return;
      }

      let lastMsg = this.messages[this.messages.length - 1];
      if (!lastMsg || lastMsg.role !== "assistant") {
        lastMsg = { role: "assistant", text: "" };
        this.messages.push(lastMsg);
      }

      // ❗ 글자 단위로 쪼개지 말고, chunk 단위로 그냥 붙이기
      lastMsg.text += text;

      this.$nextTick(() => {
        this.scrollToBottom();
      });
    };
  },

  methods: {
      async handlePaste(event) {
        const items = event.clipboardData.items;

        for (let item of items) {
          // 1) 이미지 붙여넣기
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            const reader = new FileReader();

            reader.onload = () => {
              const base64Img = reader.result;

              // this.messages.push({
              //   role: "user",
              //   text: "[이미지 붙여넣음]",
              //   image: base64Img
              // });

              // 서버로 전송
              // this.ws.send(JSON.stringify({
              //   type: "image",
              //   data: base64Img
              // }));
            };

            reader.readAsDataURL(file);
            event.preventDefault();
            return;
          }

          // 2) 엑셀 범위 붙여넣기 (TSV or HTML table)
          if (item.type === "text/html") {
            item.getAsString((html) => {
              if (html.includes("<table")) {
                // this.ws.send(JSON.stringify({
                //   type: "excel",
                //   data: html
                // }));

                // this.messages.push({
                //   role: "user",
                //   text: "[엑셀 표 붙여넣음]"
                // });

                event.preventDefault();
                return;
              }
            });
          }

          if (item.type === "text/plain") {
            item.getAsString((text) => {
              if (text.includes("\t")) {
                // TSV = 엑셀 복사본
                // this.ws.send(JSON.stringify({
                //   type: "excel-tsv",
                //   data: text
                // }));

                // this.messages.push({
                //   role: "user",
                //   text: "[엑셀(표) 텍스트 붙여넣음]"
                // });

                event.preventDefault();
                return;
              }
            });
          }
        }
      },

    scrollToBottom() {
      const box = this.$refs.msgBox;
      if (box) box.scrollTop = box.scrollHeight;
    },

    sendMessage() {
      if (!this.combinedInput.trim()) return;

      // 유저 메시지 표시
      this.messages.push({
        role: "user",
        text: this.combinedInput
      });

      this.$nextTick(() => {
        this.scrollToBottom(); // ← 메시지 추가 후 스크롤 내려가기
      });

      // WebSocket으로 그대로 전송
      this.ws.send(this.combinedInput);

      // 입력창 초기화
      this.combinedInput = "";
    },
      handleKey(e) {
      // Ctrl + Enter → 개행
      if (e.key === "Enter" && e.ctrlKey) {
        const textarea = e.target;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        this.combinedInput =
          this.combinedInput.substring(0, start) +
          "\n" +
          this.combinedInput.substring(end);

        // 커서 위치를 개행 후로 이동
        this.$nextTick(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1;
        });

        e.preventDefault();
        return;
      }

      // Enter 단독 입력 → 전송
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    },

    scrollToBottom() {
      const box = this.$refs.msgBox;
      if (box) box.scrollTop = box.scrollHeight;
    },

    sendMessage() {
      if (!this.combinedInput.trim()) return;

      this.messages.push({
        role: "user",
        text: this.combinedInput
      });

      this.ws.send(this.combinedInput);
      this.combinedInput = "";
    }
  }
};
</script>

<style>
/* ---- 글로벌 레이아웃 강제 정리 ---- */
body {
  margin: 0;
  padding: 0;
  background: #111;
  color: #eaeaea;
  overflow: hidden;        /* 바깥 스크롤 제거 */
}

/* Vite 기본 템플릿 #app 중앙 정렬 깨기 */
#app {
  max-width: none;
  margin: 0;
  padding: 0;
  text-align: left;
  width: 100vw;
  height: 100vh;
}

/* ---- 두 패널 레이아웃 ---- */
.layout {
  display: flex;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

/* 왼쪽 패널 */
.left-panel {
  flex: 1;
  padding: 20px;
  background: #1e1e1e;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.left-panel h2 {
  margin: 0 0 4px;
  text-align: center;
}

.source-box {
  flex: 1;
  background: #252526;
  color: #f2f2f2;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  padding: 12px;
  font-family: Consolas, "JetBrains Mono", monospace;
  font-size: 14px;
  resize: none;
}

/* 전송 버튼 */
.send-btn {
  margin-top: 8px;
  padding: 12px;
  background: #0a84ff;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 15px;
}
.send-btn:hover {
  background: #3798ff;
}

/* 오른쪽 패널 */
.right-panel {
  flex: 1;
  padding: 20px;
  background: #181818;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.right-panel h2 {
  margin: 0 0 8px;
  text-align: center;
}

/* 채팅 영역 */
.messages {
  flex: 1;
  background: #111;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 12px;
  box-sizing: border-box;
  overflow-y: auto;

  display: flex;              /* 세로로 쌓이는 플렉스 컨테이너 */
  flex-direction: column;
  gap: 8px;
}

/* 공통 말풍선 기본 */
.messages > div {
  max-width: 70%;             /* 말풍선 폭 제한 */
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
  white-space: pre-wrap;      /* 줄바꿈/개행 유지 */
}

/* 사용자 말풍선: 오른쪽 정렬 */
.user {
  align-self: flex-end;
  background: #0078d4;
  color: #fff;
}

/* AI 말풍선: 왼쪽 정렬 */
.assistant {
  align-self: flex-start;
  background: #2d2d30;
  color: #f2f2f2;
}
</style>

