export type AppMode = 'student' | 'teacher' | 'personal';

export type UserRole = 'student' | 'teacher' | 'personal';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  schoolName?: string;
  className?: string; // e.g. "3학년 1반"
  seatNo?: number;
  roomCode?: string; // Connected class room code e.g. "ROOM-3A1"
  createdAt: string;
}

export type FocusStatus = 'focus' | 'drowsy' | 'talking' | 'distracted' | 'absent';

export interface VisionMetrics {
  ear: number; // Eye Aspect Ratio (0.10 ~ 0.35) - Sleep/Drowsiness
  mar: number; // Mouth Aspect Ratio (0.05 ~ 0.80) - Talking/Chatting
  gazeX: number; // Gaze offset X (-1.0 to 1.0)
  gazeY: number; // Gaze offset Y (-1.0 to 1.0)
  headPitch: number; // Head angle up/down (-45 to 45 deg)
  headYaw: number; // Head angle left/right (-45 to 45 deg)
  headRoll: number; // Head tilt (-45 to 45 deg)
  upperBodyJitter: number; // Jitter movement score (0 ~ 10)
  handNearFace: boolean; // Hand landmark near face/phone
  phoneObjectDetected: boolean; // Object detection phone bounding box present
  skeletonVisible: boolean; // Upper body landmarks detected
  fps: number; // Vision stream processing FPS (e.g. 8~10 FPS)
  faceDetected: boolean;
}

export interface ClassSessionConfig {
  targetStudyMinutes: number; // Target focus duration in minutes (e.g. 50 mins)
  breakMinutes: number; // Break duration in minutes (e.g. 10 mins)
  isRunning: boolean;
  startTime: number | null; // Timestamp
  remainingSeconds: number;
}

export interface StudentData {
  id: string;
  seatNo: number;
  name: string;
  avatarUrl?: string;
  status: FocusStatus;
  cameraInstalled: boolean; // 카메라 기기 설치/연동 여부
  cameraConnected: boolean; // 카메라 활성 스트리밍 여부
  googleMeetConnected: boolean; // Google Meet 화상연동 참여 여부
  focusSeconds: number;
  totalSeconds: number;
  drowsyCount: number;
  talkingCount: number; // 떠듦 감지 횟수
  distractedCount: number;
  absentSeconds: number;
  metrics: VisionMetrics;
  lastUpdated: string;
  privacyAvatar: {
    joints: { x: number; y: number }[];
    gazeVector: { x: number; y: number };
  };
  videoSnapshot?: string; // Optional base64 snapshot for teacher live inspection
}

export interface ClassroomStats {
  classId: string;
  className: string;
  googleMeetUrl: string;
  totalStudents: number;
  cameraInstalledCount: number; // 카메라 설치 완료 학생 수
  cameraOnlineCount: number; // 카메라 라이브 연결 학생 수
  focusCount: number;
  drowsyCount: number;
  talkingCount: number; // 떠드는 학생 수
  distractedCount: number;
  absentCount: number;
  averageImmersionScore: number; // 0 - 100
  hourlyImmersionHistory: { time: string; focusRate: number; drowsyRate: number; talkingRate: number }[];
}

export interface AlertNotification {
  id: string;
  studentId: string;
  studentName: string;
  seatNo: number;
  type: FocusStatus;
  durationSeconds: number;
  timestamp: string;
  resolved: boolean;
  message: string;
}

