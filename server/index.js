// server/index.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { WebSocketServer } from "ws";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// HTTP 서버 생성
const server = app.listen(port, () => {
  console.log("🚀 Server started on port", port);
});

// WebSocket 서버 생성
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("🔥 WebSocket 클라이언트 연결됨");

  // 🎯 각 클라이언트별 대화 히스토리
  // Gemini에 그대로 넘길 구조로 유지
  let history = [];

  ws.on("message", async (raw) => {
    let msg;

    // 1) JSON인지 시도 → 실패하면 그냥 텍스트로 취급
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      msg = { type: "text", data: raw.toString() };
    }

    console.log("📌 수신 타입:", msg.type);

    // 공통: 모델 인스턴스
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // ------------------------------
    // 1) 텍스트 메시지 처리
    // ------------------------------
    if (msg.type === "text") {
      // 히스토리에 추가
      history.push({
        role: "user",
        parts: [{ text: msg.data }]
      });

      try {
        const result = await model.generateContentStream({
          contents: history   // 👉 전체 히스토리 기반으로 답변
        });

        let assistantReply = "";

        for await (const chunk of result.stream) {
          const text = chunk?.text();
          if (text) {
            ws.send(text);
            assistantReply += text;
          }
        }

        ws.send("[[END]]");

        // AI 응답도 히스토리에 저장
        history.push({
          role: "model",
          parts: [{ text: assistantReply }]
        });

      } catch (e) {
        console.error(e);
        ws.send("[[ERROR]]");
      }

      return;
    }

    // ------------------------------
    // 2) 이미지 메시지 처리 (간단 버전)
    // ------------------------------
    if (msg.type === "image") {
      const visionModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      // 유저가 이미지를 보냈다는 정보만 history에 넣음
      history.push({
        role: "user",
        parts: [{ text: "이미지 업로드: " }, {
          inlineData: {
            mimeType: "image/png",
            data: msg.data.split(",")[1]  // dataURL 기준
          }
        }]
      });

      try {
        const result = await visionModel.generateContentStream({
          contents: history
        });

        let assistantReply = "";

        for await (const chunk of result.stream) {
          const text = chunk?.text();
          if (text) {
            ws.send(text);
            assistantReply += text;
          }
        }

        ws.send("[[END]]");

        history.push({
          role: "model",
          parts: [{ text: assistantReply }]
        });

      } catch (e) {
        console.error(e);
        ws.send("[[ERROR]]");
      }

      return;
    }

    // ------------------------------
    // 3) 엑셀 HTML 테이블
    // ------------------------------
    if (msg.type === "excel") {
      const cleanText = msg.data
        .replace(/<\/td><td>/g, " | ")
        .replace(/<\/tr>/g, "\n")
        .replace(/<[^>]+>/g, "");

      const promptText = "아래의 표 데이터를 기억하고, 이후 질문에 이 테이블 기준으로 답변해줘.\n\n" + cleanText;

      history.push({
        role: "user",
        parts: [{ text: promptText }]
      });

      try {
        const result = await model.generateContentStream({
          contents: history
        });

        let assistantReply = "";

        for await (const chunk of result.stream) {
          const text = chunk?.text();
          if (text) {
            ws.send(text);
            assistantReply += text;
          }
        }

        ws.send("[[END]]");

        history.push({
          role: "model",
          parts: [{ text: assistantReply }]
        });

      } catch (e) {
        console.error(e);
        ws.send("[[ERROR]]");
      }

      return;
    }

    // ------------------------------
    // 4) 엑셀 TSV 데이터 (엑셀에서 직접 복사한 텍스트)
    // ------------------------------
    if (msg.type === "excel-tsv") {
      const promptText = "아래의 엑셀(탭 구분) 데이터를 기억하고, 이후 질문에 이 테이블 기준으로 답변해줘.\n\n" + msg.data;

      history.push({
        role: "user",
        parts: [{ text: promptText }]
      });

      try {
        const result = await model.generateContentStream({
          contents: history
        });

        let assistantReply = "";

        for await (const chunk of result.stream) {
          const text = chunk?.text();
          if (text) {
            ws.send(text);
            assistantReply += text;
          }
        }

        ws.send("[[END]]");

        history.push({
          role: "model",
          parts: [{ text: assistantReply }]
        });

      } catch (e) {
        console.error(e);
        ws.send("[[ERROR]]");
      }

      return;
    }

  });
});
