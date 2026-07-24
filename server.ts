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

// In-memory Room State Store for real multi-user/multi-device connection
interface RoomState {
  roomCode: string;
  className: string;
  googleMeetUrl: string;
  targetStudyMinutes: number;
  breakMinutes: number;
  timerRunning: boolean;
  students: Record<string, any>;
  alerts: any[];
  directMessages: Record<string, string>;
  kickedStudents?: Record<string, boolean>;
  lastUpdated: number;
}

const roomsStore: Record<string, RoomState> = {};

// Helper to get or create room
function getOrCreateRoom(roomCode: string, className?: string): RoomState {
  const code = (roomCode || "ROOM-3A1").toUpperCase().trim().replace(/\s+/g, "");
  if (!roomsStore[code]) {
    roomsStore[code] = {
      roomCode: code,
      className: className || "3학년 1반 자율학습실",
      googleMeetUrl: "https://meet.google.com/studyflow-3a-2026",
      targetStudyMinutes: 50,
      breakMinutes: 10,
      timerRunning: true,
      students: {},
      alerts: [],
      directMessages: {},
      kickedStudents: {},
      lastUpdated: Date.now(),
    };
  }
  return roomsStore[code];
}

// API Endpoint: Get Room State (For Teacher and Students)
app.get("/api/rooms/:roomCode", (req, res) => {
  const room = getOrCreateRoom(req.params.roomCode);
  
  // Filter out students inactive for over 30 seconds or explicitly kicked
  const now = Date.now();
  const activeStudents = Object.values(room.students)
    .filter((s: any) => !room.kickedStudents || !room.kickedStudents[s.id])
    .map((s: any) => {
      const isOnline = now - (s.lastHeartbeat || 0) < 30000;
      return {
        ...s,
        cameraConnected: isOnline,
        status: isOnline ? s.status : "absent",
      };
    });

  res.json({
    roomCode: room.roomCode,
    className: room.className,
    googleMeetUrl: room.googleMeetUrl,
    targetStudyMinutes: room.targetStudyMinutes,
    breakMinutes: room.breakMinutes,
    timerRunning: room.timerRunning,
    students: activeStudents,
    alerts: room.alerts,
  });
});

// API Endpoint: Student Heartbeat / Real-time Camera AI Vision Sync
app.post("/api/rooms/:roomCode/student-sync", (req, res) => {
  const { student } = req.body;
  if (!student || !student.id) {
    return res.status(400).json({ error: "학생 데이터가 올바르지 않습니다." });
  }

  const room = getOrCreateRoom(req.params.roomCode, req.body.className);
  
  // Check if student was kicked by teacher
  if (room.kickedStudents && room.kickedStudents[student.id]) {
    delete room.students[student.id];
    return res.json({
      success: false,
      kicked: true,
      message: "교사에 의해 클래스에서 내보내기(퇴장)되었습니다.",
    });
  }

  room.students[student.id] = {
    ...student,
    lastHeartbeat: Date.now(),
    cameraConnected: true,
    lastUpdated: "방금 전",
  };

  // Check for pending direct message from teacher to this student
  let directMessage: string | null = null;
  if (room.directMessages && room.directMessages[student.id]) {
    directMessage = room.directMessages[student.id];
    delete room.directMessages[student.id];
  }

  // Add alert if student status is drowsy or talking
  if (student.status === "drowsy" || student.status === "talking") {
    const alertId = `alt-${student.id}-${Date.now()}`;
    const exists = room.alerts.some(
      (a) => a.studentId === student.id && a.type === student.status && !a.resolved
    );
    if (!exists) {
      room.alerts.unshift({
        id: alertId,
        studentId: student.id,
        studentName: student.name,
        seatNo: student.seatNo || 1,
        type: student.status,
        durationSeconds: 10,
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        resolved: false,
        message: student.status === "drowsy"
          ? `🚨 ${student.name} 학생 실시간 수면/깊은 졸음 감지됨 (EAR ${student.metrics?.ear?.toFixed(2) || "0.12"})`
          : `🗣️ ${student.name} 학생 실시간 소란/떠듦 감지됨 (MAR ${student.metrics?.mar?.toFixed(2) || "0.65"})`,
      });
      // Keep max 20 alerts
      room.alerts = room.alerts.slice(0, 20);
    }
  }

  room.lastUpdated = Date.now();
  return res.json({
    success: true,
    roomCode: room.roomCode,
    activeCount: Object.keys(room.students).length,
    targetStudyMinutes: room.targetStudyMinutes,
    directMessage,
  });
});

// API Endpoint: Teacher Kicks / Expels a student from the room
app.delete("/api/rooms/:roomCode/students/:studentId", (req, res) => {
  const { roomCode, studentId } = req.params;
  const room = getOrCreateRoom(roomCode);

  if (room.students && room.students[studentId]) {
    delete room.students[studentId];
  }
  if (!room.kickedStudents) room.kickedStudents = {};
  room.kickedStudents[studentId] = true;

  res.json({
    success: true,
    studentId,
    message: "학생이 클래스에서 퇴장(내보내기) 되었습니다.",
  });
});

// API Endpoint: Allow student to unkick / rejoin
app.post("/api/rooms/:roomCode/unkick", (req, res) => {
  const { studentId } = req.body;
  const room = getOrCreateRoom(req.params.roomCode);

  if (room.kickedStudents && studentId) {
    delete room.kickedStudents[studentId];
  }

  res.json({ success: true });
});

// API Endpoint: Teacher sends warning/direct message to student
app.post("/api/rooms/:roomCode/message", (req, res) => {
  const { studentId, message } = req.body;
  if (!studentId || !message) {
    return res.status(400).json({ error: "studentId and message are required" });
  }

  const room = getOrCreateRoom(req.params.roomCode);
  if (!room.directMessages) room.directMessages = {};
  room.directMessages[studentId] = message;

  res.json({ success: true, studentId, message });
});

// API Endpoint: Teacher Updates Session Target Time / Room Settings
app.post("/api/rooms/:roomCode/timer", (req, res) => {
  const { targetStudyMinutes, breakMinutes, timerRunning } = req.body;
  const room = getOrCreateRoom(req.params.roomCode);

  if (targetStudyMinutes !== undefined) room.targetStudyMinutes = Number(targetStudyMinutes);
  if (breakMinutes !== undefined) room.breakMinutes = Number(breakMinutes);
  if (timerRunning !== undefined) room.timerRunning = Boolean(timerRunning);

  room.lastUpdated = Date.now();
  res.json({ success: true, roomCode: room.roomCode, targetStudyMinutes: room.targetStudyMinutes });
});

// API Endpoint: Teacher Clears / Resolves Alert
app.post("/api/rooms/:roomCode/resolve-alert", (req, res) => {
  const { alertId } = req.body;
  const room = getOrCreateRoom(req.params.roomCode);
  room.alerts = room.alerts.map((a) => (a.id === alertId ? { ...a, resolved: true } : a));
  res.json({ success: true });
});

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
