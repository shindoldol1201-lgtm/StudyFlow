import { StudentData, ClassroomStats, AlertNotification } from './types';

export const INITIAL_STUDENTS: StudentData[] = Array.from({ length: 28 }).map((_, idx) => {
  const id = `std-${idx + 1}`;
  const seatNo = idx + 1;
  const names = [
    '김철수', '이영희', '박민수', '최지우', '정우성', '강하늘', '윤서준', '한소희',
    '송중기', '배수지', '임윤아', '신민아', '서강준', '도경수', '안효섭', '김유정',
    '남주혁', '장기용', '박보검', '이종석', '지창욱', '이도현', '변우석', '김지원',
    '손흥민', '황희찬', '이강인', '김민재'
  ];
  const name = names[idx] || `학생 ${seatNo}`;

  // Assign realistic status distribution including talking/chatting
  let status: 'focus' | 'drowsy' | 'talking' | 'distracted' | 'absent' = 'focus';
  if (idx === 2 || idx === 11) status = 'drowsy';
  else if (idx === 4 || idx === 16) status = 'talking';
  else if (idx === 5 || idx === 18) status = 'distracted';
  else if (idx === 14) status = 'absent';

  // Camera installation/connection check
  // Students 25, 26, 27 have camera disconnected or uninstalled to test feature 1
  const cameraInstalled = idx !== 26; // 27번 학생 미설치
  const cameraConnected = cameraInstalled && idx !== 24 && idx !== 25; // 25, 26번 학생 연결 끊김
  const googleMeetConnected = cameraConnected && status !== 'absent';

  const isFocus = status === 'focus';
  const totalSeconds = 7200 + Math.floor(Math.random() * 1800);
  const focusSeconds = isFocus ? Math.floor(totalSeconds * (0.85 + Math.random() * 0.12)) : Math.floor(totalSeconds * 0.5);

  return {
    id,
    seatNo,
    name,
    status: cameraConnected ? status : 'absent',
    cameraInstalled,
    cameraConnected,
    googleMeetConnected,
    focusSeconds,
    totalSeconds,
    drowsyCount: status === 'drowsy' ? 3 : Math.floor(Math.random() * 2),
    talkingCount: status === 'talking' ? 5 : Math.floor(Math.random() * 2),
    distractedCount: status === 'distracted' ? 4 : Math.floor(Math.random() * 3),
    absentSeconds: status === 'absent' || !cameraConnected ? 420 : 0,
    metrics: {
      ear: status === 'drowsy' ? 0.12 : 0.28,
      mar: status === 'talking' ? 0.65 : 0.08, // High MAR when talking
      gazeX: status === 'distracted' ? 0.65 : 0.05,
      gazeY: status === 'distracted' ? -0.4 : 0.02,
      headPitch: status === 'drowsy' ? 32 : (status === 'talking' ? 12 : (status === 'distracted' ? -18 : 5)),
      headYaw: status === 'talking' ? 30 : (status === 'distracted' ? 25 : 2),
      headRoll: 1,
      upperBodyJitter: status === 'talking' ? 6.5 : (status === 'focus' ? 1.2 : 4.8),
      handNearFace: status === 'distracted',
      phoneObjectDetected: status === 'distracted',
      skeletonVisible: status !== 'absent' && cameraConnected,
      fps: 9.8,
      faceDetected: status !== 'absent' && cameraConnected,
    },
    lastUpdated: cameraConnected ? '방금 전' : '12분 전',
    privacyAvatar: {
      joints: [
        { x: 50, y: 25 }, // Head
        { x: 50, y: 40 }, // Neck
        { x: 35, y: 45 }, // Left Shoulder
        { x: 65, y: 45 }, // Right Shoulder
        { x: 30, y: 70 }, // Left Elbow
        { x: 70, y: 70 }, // Right Elbow
        { x: 38, y: 90 }, // Left Wrist
        { x: 62, y: 90 }, // Right Wrist
      ],
      gazeVector: {
        x: status === 'distracted' ? 25 : 0,
        y: status === 'drowsy' ? 30 : 0
      }
    }
  };
});

export const INITIAL_CLASS_STATS: ClassroomStats = {
  classId: 'cls-3a',
  className: '3학년 1반 Google Meet 원격/자율 학습실',
  googleMeetUrl: 'https://meet.google.com/studyflow-3a-2026',
  totalStudents: 28,
  cameraInstalledCount: 27,
  cameraOnlineCount: 25,
  focusCount: 18,
  drowsyCount: 2,
  talkingCount: 2,
  distractedCount: 2,
  absentCount: 4,
  averageImmersionScore: 86,
  hourlyImmersionHistory: [
    { time: '19:00', focusRate: 92, drowsyRate: 4, talkingRate: 4 },
    { time: '19:30', focusRate: 89, drowsyRate: 6, talkingRate: 5 },
    { time: '20:00', focusRate: 86, drowsyRate: 8, talkingRate: 6 },
    { time: '20:30', focusRate: 81, drowsyRate: 14, talkingRate: 5 },
    { time: '21:00', focusRate: 85, drowsyRate: 10, talkingRate: 5 },
    { time: '21:30', focusRate: 86, drowsyRate: 7, talkingRate: 7 },
  ],
};

export const INITIAL_ALERTS: AlertNotification[] = [
  {
    id: 'alt-1',
    studentId: 'std-3',
    studentName: '박민수',
    seatNo: 3,
    type: 'drowsy',
    durationSeconds: 210,
    timestamp: '21:28:15',
    resolved: false,
    message: '🚨 수면/깊은 졸음 감지됨 (EAR 0.12 - 3분 10초)'
  },
  {
    id: 'alt-2',
    studentId: 'std-5',
    studentName: '정우성',
    seatNo: 5,
    type: 'talking',
    durationSeconds: 120,
    timestamp: '21:27:02',
    resolved: false,
    message: '🗣️ 옆자리와 연속 소란/떠듦 감지 (MAR 0.68)'
  },
  {
    id: 'alt-3',
    studentId: 'std-15',
    studentName: '안효섭',
    seatNo: 15,
    type: 'absent',
    durationSeconds: 320,
    timestamp: '21:26:40',
    resolved: false,
    message: '⚠️ 5분 이상 자리 이탈 상태 지속'
  },
  {
    id: 'alt-4',
    studentId: 'std-6',
    studentName: '강하늘',
    seatNo: 6,
    type: 'distracted',
    durationSeconds: 150,
    timestamp: '21:22:10',
    resolved: true,
    message: '📱 스마트폰 사용 감지 (Phone Object BBox)'
  }
];
