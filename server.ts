import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Initialize Gemini API client (server-side only)
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API Endpoint: Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "StudyFlow AI Vision Engine API" });
});

// API Endpoint: Generate AI Study Insights & Report Analysis
app.post("/api/gemini/report-insights", async (req, res) => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({
        error: "GEMINI_API_KEY가 설정되지 않았습니다.",
      });
    }

    const { mode, focusTimeSeconds, totalTimeSeconds, drowsinessCount, distractionCount, peakHours } = req.body;

    const prompt = `
당신은 학습 태도 분석 및 인공지능 비전 코칭 전문가 "StudyFlow AI 리포트 어드바이저"입니다.
다음 사용자의 학습 데이터를 바탕으로 전문적이고 격려하는 어조의 개인 맞춤형 분석 리포트를 작성해주세요.

[학습 데이터]
- 모드: ${mode || "개인 모드"}
- 총 순공 시간: ${Math.floor((focusTimeSeconds || 0) / 60)}분 / 총 학습 시간: ${Math.floor((totalTimeSeconds || 0) / 60)}분
- 몰입률: ${totalTimeSeconds ? Math.round(((focusTimeSeconds || 0) / totalTimeSeconds) * 100) : 85}%
- 졸음 감지 횟수: ${drowsinessCount || 0}회
- 스마트폰/딴짓 감지 횟수: ${distractionCount || 0}회
- 주요 집중 시간대: ${peakHours || "14:00 - 16:00"}

[작성 요구사항]
1. 오늘 학습 몰입도에 대한 총평 (2~3문장)
2. 시선 및 자세 비전 분석 피드백 (졸음/딴짓 방지 솔루션 포함)
3. 내일 학습 효과 극대화를 위한 AI 추천 팁 3가지 (구체적 액션 플랜)
한국어로 가독성 높고 친절하며 명확한 마크다운 형식으로 작성해주세요.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    return res.json({
      insightText: response.text,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({
      error: "AI 리포트 생성 중 오류가 발생했습니다: " + (error?.message || "Internal server error"),
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StudyFlow Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
