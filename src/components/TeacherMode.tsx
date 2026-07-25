import React, { useState, useEffect } from 'react';
import { StudentData, ClassroomStats, AlertNotification, ClassSessionConfig, UserProfile, FocusStatus } from '../types';
import { CameraVisionCanvas } from './CameraVisionCanvas';
import { roomChannel } from '../lib/roomChannel';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Users, Shield, Bell, Filter, CheckCircle, AlertTriangle, Smartphone, UserX, Send, Video, Volume2, VolumeX, Clock, Play, Pause, RotateCcw, Copy, ExternalLink, RefreshCw, BarChart2, ShieldCheck, ChevronRight, Camera, Target, QrCode, Edit3, X } from 'lucide-react';

interface TeacherModeProps {
  currentUser?: UserProfile | null;
}

export const TeacherMode: React.FC<TeacherModeProps> = ({ currentUser }) => {
  // Class Room Code & Connected Real Students State
  const [roomCode, setRoomCode] = useState<string>(
    (currentUser?.roomCode || 'ROOM-3A1').toUpperCase().trim().replace(/\s+/g, '')
  );
  const [showRoomCodeModal, setShowRoomCodeModal] = useState<boolean>(false);
  const [roomCodeInput, setRoomCodeInput] = useState<string>(roomCode);
  const [className, setClassName] = useState<string>('3학년 1반 자율학습실');
  const [googleMeetUrl, setGoogleMeetUrl] = useState<string>('https://meet.google.com/studyflow-3a-2026');
  
  // Real Connected Students from Backend API
  const [students, setStudents] = useState<StudentData[]>([]);
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);

  // Class Session Timer State (교사용 시간 설정 기능)
  const [targetStudyMinutes, setTargetStudyMinutes] = useState<number>(50); // 50분
  const [customMinutesInput, setCustomMinutesInput] = useState<string>('50');
  const [breakMinutes, setBreakMinutes] = useState<number>(10);
  const [timerRunning, setTimerRunning] = useState<boolean>(true);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(50 * 60);

  // Filters & Audio Settings
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [privacyModeEnabled, setPrivacyModeEnabled] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [directMessageText, setDirectMessageText] = useState<string>('');
  const [messageSentToast, setMessageSentToast] = useState<string | null>(null);
  const [soundAlertEnabled, setSoundAlertEnabled] = useState<boolean>(true);
  const [showSampleStudents, setShowSampleStudents] = useState<boolean>(false);

  // Audio Alarm Generator
  const playAlarmSound = () => {
    if (!soundAlertEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.log('Audio Context playback policy.');
    }
  };

  // Kicked student IDs ref to guarantee instantaneous removal
  const kickedIdsRef = React.useRef<Set<string>>(new Set());

  // Subscribe to roomChannel for instant real-time student updates and leave events
  useEffect(() => {
    const cleanRoom = roomCode.toUpperCase().trim().replace(/\s+/g, '');
    const unsubscribe = roomChannel.subscribe(cleanRoom, (msg) => {
      if (msg.type === 'STUDENT_SYNC' && msg.student) {
        if (kickedIdsRef.current.has(msg.studentId!)) return;

        setStudents((prev) => {
          const existingIdx = prev.findIndex((s) => s.id === msg.studentId);
          const updatedStd: StudentData = {
            id: msg.studentId!,
            seatNo: msg.student.seatNo || 1,
            name: msg.student.name || '학생',
            status: msg.student.status || 'focus',
            cameraInstalled: true,
            cameraConnected: true,
            googleMeetConnected: true,
            focusSeconds: msg.student.focusSeconds || 0,
            totalSeconds: msg.student.totalSeconds || 0,
            drowsyCount: msg.student.drowsyCount || 0,
            talkingCount: msg.student.talkingCount || 0,
            distractedCount: msg.student.distractedCount || 0,
            absentSeconds: msg.student.absentSeconds || 0,
            metrics: msg.student.metrics || {},
            lastUpdated: '방금 전',
            privacyAvatar: { joints: [], gazeVector: { x: 0, y: 0 } },
          };

          if (existingIdx >= 0) {
            const list = [...prev];
            list[existingIdx] = updatedStd;
            return list;
          } else {
            return [...prev, updatedStd];
          }
        });
      } else if (msg.type === 'STUDENT_LEAVE' && msg.studentId) {
        setStudents((prev) => prev.filter((s) => s.id !== msg.studentId));
      } else if (msg.type === 'TEACHER_KICK' && msg.studentId) {
        kickedIdsRef.current.add(msg.studentId);
        setStudents((prev) => prev.filter((s) => s.id !== msg.studentId));
      }
    });

    return () => unsubscribe();
  }, [roomCode]);

  // Poll Real Connected Students from Backend API
  const fetchRoomData = async () => {
    try {
      const cleanRoom = roomCode.toUpperCase().trim().replace(/\s+/g, '');
      const res = await fetch(`/api/rooms/${cleanRoom}`);
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          let apiStudents: StudentData[] = (data.students || []).filter(
            (s: StudentData) => !kickedIdsRef.current.has(s.id)
          );

          // If sample toggle is active and no real students yet, add sample devices
          if (showSampleStudents && apiStudents.length === 0) {
            apiStudents = [
              {
                id: 'sample-1',
                seatNo: 1,
                name: '김샘플 (테스트 기기 1)',
                status: 'focus' as FocusStatus,
                cameraInstalled: true,
                cameraConnected: true,
                googleMeetConnected: true,
                focusSeconds: 2400,
                totalSeconds: 2700,
                drowsyCount: 0,
                talkingCount: 0,
                distractedCount: 0,
                absentSeconds: 0,
                metrics: { ear: 0.28, mar: 0.08, gazeX: 0, gazeY: 0, headPitch: 2, headYaw: 0, headRoll: 0, upperBodyJitter: 0.5, handNearFace: false, phoneObjectDetected: false, skeletonVisible: true, fps: 12, faceDetected: true },
                lastUpdated: '방금 전',
                privacyAvatar: { joints: [], gazeVector: { x: 0, y: 0 } },
              },
              {
                id: 'sample-2',
                seatNo: 2,
                name: '박테스트 (테스트 기기 2)',
                status: 'drowsy' as FocusStatus,
                cameraInstalled: true,
                cameraConnected: true,
                googleMeetConnected: true,
                focusSeconds: 1800,
                totalSeconds: 2700,
                drowsyCount: 3,
                talkingCount: 0,
                distractedCount: 0,
                absentSeconds: 0,
                metrics: { ear: 0.12, mar: 0.06, gazeX: 0, gazeY: 0.5, headPitch: 30, headYaw: 0, headRoll: 0, upperBodyJitter: 0.2, handNearFace: false, phoneObjectDetected: false, skeletonVisible: true, fps: 12, faceDetected: true },
                lastUpdated: '방금 전',
                privacyAvatar: { joints: [], gazeVector: { x: 0, y: 0 } },
              },
            ].filter((s) => !kickedIdsRef.current.has(s.id));
          }

          if (apiStudents.length > 0) {
            setStudents(apiStudents);
          }
          if (data.alerts) setAlerts(data.alerts);
          if (data.googleMeetUrl) setGoogleMeetUrl(data.googleMeetUrl);
        }
      }
    } catch (err) {
      // ignore offline API sync errors on static hosts
    }
  };

  useEffect(() => {
    fetchRoomData();
    const interval = setInterval(fetchRoomData, 1500); // Sync every 1.5s
    return () => clearInterval(interval);
  }, [roomCode, showSampleStudents]);

  // Session Timer Countdown
  useEffect(() => {
    let timer: any = null;
    if (timerRunning) {
      timer = setInterval(() => {
        setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : targetStudyMinutes * 60));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timerRunning, targetStudyMinutes]);

  // Teacher Updates Target Class Study Time
  const handleSetClassTargetTime = (mins: number) => {
    setTargetStudyMinutes(mins);
    setRemainingSeconds(mins * 60);
    setCustomMinutesInput(mins.toString());

    // Sync timer to backend
    const cleanRoom = roomCode.toUpperCase().trim().replace(/\s+/g, '');
    fetch(`/api/rooms/${cleanRoom}/timer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetStudyMinutes: mins, timerRunning: true }),
    });
  };

  const handleApplyCustomMinutes = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customMinutesInput, 10);
    if (val && val > 0) {
      handleSetClassTargetTime(val);
    }
  };

  // Filter students based on selection
  const filteredStudents = students.filter((s) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'uninstalled') return !s.cameraInstalled || !s.cameraConnected;
    return s.status === filterStatus;
  });

  const focusCount = students.filter((s) => s.cameraConnected && s.status === 'focus').length;
  const drowsyCount = students.filter((s) => s.cameraConnected && s.status === 'drowsy').length;
  const talkingCount = students.filter((s) => s.cameraConnected && s.status === 'talking').length;
  const absentCount = students.filter((s) => !s.cameraConnected || s.status === 'absent').length;

  const urgentAlertStudents = students.filter((s) => s.status === 'drowsy' || s.status === 'talking');

  const handleSendDirectWarning = async (student: StudentData, customMsg?: string) => {
    const msg = customMsg || directMessageText.trim() || '지속적인 수면/소란이 감지되었습니다. 바른 자세로 집중해 주세요.';
    playAlarmSound();

    const cleanRoom = roomCode.toUpperCase().trim().replace(/\s+/g, '');

    // Broadcast over channel
    roomChannel.broadcast({
      type: 'TEACHER_MESSAGE',
      roomCode: cleanRoom,
      studentId: student.id,
      message: msg,
      timestamp: Date.now(),
    });

    try {
      await fetch(`/api/rooms/${cleanRoom}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id, message: msg }),
      });
    } catch (e) {
      console.warn('Error sending direct warning message:', e);
    }

    setMessageSentToast(`🔔 [${student.name} 학생] 기기로 경고 메시지가 전달되었습니다: "${msg}"`);
    setDirectMessageText('');
    setTimeout(() => setMessageSentToast(null), 4000);
  };

  const handleKickStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`${studentName} 학생을 클래스에서 내보내시겠습니까?`)) return;

    const cleanRoom = roomCode.toUpperCase().trim().replace(/\s+/g, '');
    kickedIdsRef.current.add(studentId);
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    if (selectedStudent?.id === studentId) {
      setSelectedStudent(null);
    }

    // Broadcast kick event across tabs
    roomChannel.broadcast({
      type: 'TEACHER_KICK',
      roomCode: cleanRoom,
      studentId,
      timestamp: Date.now(),
    });

    try {
      await fetch(`/api/rooms/${cleanRoom}/students/${studentId}`, {
        method: 'DELETE',
      });
      setMessageSentToast(`🚨 [${studentName}] 학생을 클래스에서 내보냈습니다.`);
      setTimeout(() => setMessageSentToast(null), 4000);
    } catch (e) {
      console.error('Failed to kick student:', e);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setMessageSentToast(`📋 클래스 코드 (${roomCode})가 복사되었습니다.`);
    setTimeout(() => setMessageSentToast(null), 3000);
  };

  const formatTimerDisplay = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header Hub */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>실시간 AI 카메라 학급 연동</span>
              </span>
              <span className="text-xs text-slate-400">클래스 코드: <strong className="text-indigo-300 font-bold">{roomCode}</strong></span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              교사용 실시간 AI 카메라 대시보드
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setRoomCodeInput(roomCode);
                setShowRoomCodeModal(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
            >
              <QrCode className="w-4 h-4" />
              <span>클래스 코드 변경/입력 ({roomCode})</span>
            </button>

            <button
              onClick={copyRoomCode}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 text-xs font-bold hover:bg-indigo-600/30 transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>복사</span>
            </button>

            <button
              onClick={() => setSoundAlertEnabled(!soundAlertEnabled)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                soundAlertEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {soundAlertEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundAlertEnabled ? '경고음 ON' : '경고음 OFF'}</span>
            </button>
          </div>
        </div>

        {/* Feature: Teacher Class Session Timer Setting (교사용 학습 시간 직접 설정) */}
        <div className="p-4 rounded-xl bg-slate-950 border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 font-mono font-bold text-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                <span>학급 수업/자율학습 세션 목표 시간 설정</span>
                <span className="px-2 py-0.5 text-[10px] bg-indigo-500/20 text-indigo-300 rounded-full font-bold">
                  목표 {targetStudyMinutes}분 세션
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                남은 시간: <strong className="text-emerald-400 font-mono text-sm">{formatTimerDisplay(remainingSeconds)}</strong>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">수업 시간 선택:</span>
            {[25, 45, 50, 60, 90].map((mins) => (
              <button
                key={mins}
                onClick={() => handleSetClassTargetTime(mins)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                  targetStudyMinutes === mins
                    ? 'bg-indigo-600 text-white border-indigo-400'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {mins}분
              </button>
            ))}

            <form onSubmit={handleApplyCustomMinutes} className="flex items-center space-x-1">
              <input
                type="number"
                min={1}
                max={300}
                value={customMinutesInput}
                onChange={(e) => setCustomMinutesInput(e.target.value)}
                className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white text-center font-bold"
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                적용
              </button>
            </form>

            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs"
              title={timerRunning ? '타이머 일시정지' : '타이머 재개'}
            >
              {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* High Priority Urgent Alert Banner if sleeping or talking */}
        {urgentAlertStudents.length > 0 && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/60 text-rose-200 flex items-center justify-between animate-pulse">
            <div className="flex items-center space-x-2 text-xs font-bold">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>
                🚨 실시간 알람: {urgentAlertStudents.map((s) => `${s.name}(${s.status === 'drowsy' ? '수면/졸음' : '떠듦/소란'})`).join(', ')} 감지됨!
              </span>
            </div>
            <button
              onClick={() => setSelectedStudent(urgentAlertStudents[0])}
              className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold text-[11px] hover:bg-rose-500 transition-colors shrink-0"
            >
              개별 확인
            </button>
          </div>
        )}

        {/* Real KPI Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="label-xs text-slate-400">접속 중인 학생 수</div>
              <div className="text-xl font-bold text-indigo-400 mt-0.5">{students.length}명</div>
            </div>
            <Users className="w-5 h-5 text-indigo-400 shrink-0" />
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="label-xs text-slate-400">정상 몰입</div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">{focusCount}명</div>
            </div>
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="label-xs text-slate-400">수면 / 졸음</div>
              <div className="text-xl font-bold text-amber-400 mt-0.5">{drowsyCount}명</div>
            </div>
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="label-xs text-slate-400">떠듦 / 소란</div>
              <div className="text-xl font-bold text-rose-400 mt-0.5">{talkingCount}명</div>
            </div>
            <span className="text-lg">🗣️</span>
          </div>
        </div>
      </div>

      {/* Main Real Connected Students Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
              <Filter className="w-4 h-4 text-indigo-400" />
              <span>실제 접속 학생 라이브 목록 ({students.length}명)</span>
            </div>

            <button
              onClick={() => setShowSampleStudents(!showSampleStudents)}
              className="text-xs text-indigo-400 hover:underline font-semibold"
            >
              {showSampleStudents ? '샘플 학생 숨기기' : '샘플 기기 연결 테스트 (2명)'}
            </button>
          </div>

          {/* Real Connected Student Grid */}
          {students.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">현재 실시간 접속한 학생이 없습니다</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                학생들이 아래 클래스 방 코드로 입장하면 실시간 카메라 화면과 AI 비전 상태가 이 대시보드에 즉시 나타납니다.
              </p>
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-indigo-300">
                <span>클래스 방 코드: {roomCode}</span>
                <button onClick={copyRoomCode} className="text-indigo-400 hover:text-white ml-2">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredStudents.map((std) => (
                <div
                  key={std.id}
                  onClick={() => setSelectedStudent(std)}
                  className="bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-xl p-2.5 space-y-2 cursor-pointer transition-all hover:scale-[1.03] shadow-md group relative"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 truncate max-w-[85px]">#{std.seatNo} {std.name}</span>
                    <div className="flex items-center space-x-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        std.status === 'focus' ? 'bg-emerald-500/20 text-emerald-300' :
                        std.status === 'drowsy' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {std.status.toUpperCase()}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleKickStudent(std.id, std.name);
                        }}
                        className="p-1 rounded bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white transition-colors border border-rose-500/30"
                        title="학생 클래스에서 내보내기 (X)"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="h-28 rounded-lg overflow-hidden border border-slate-800 relative">
                    <CameraVisionCanvas
                      status={std.status}
                      metrics={std.metrics}
                      compact={true}
                      studentName={std.name}
                      seatNo={std.seatNo}
                    />
                    <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-2 py-1 rounded bg-slate-950/90 text-indigo-300 text-[10px] font-bold border border-indigo-500/50">
                        개별 정밀 확인 🔍
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Real Alerts Feed */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>실시간 수면/소란 알림 피드</span>
            </h3>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-8">
                  현재 특이 이상 감지 알림이 없습니다.
                </div>
              ) : (
                alerts.map((alt) => (
                  <div key={alt.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span>#{alt.seatNo}번 {alt.studentName}</span>
                      <span>{alt.timestamp}</span>
                    </div>
                    <div className="font-bold text-rose-300">{alt.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Individual Student Inspector Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-indigo-400">#{selectedStudent.seatNo}번</span>
                <h3 className="text-lg font-bold text-white">{selectedStudent.name} 학생 실시간 카메라 정밀 분석</h3>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <div className="h-60 rounded-xl overflow-hidden border border-slate-800">
              <CameraVisionCanvas
                status={selectedStudent.status}
                metrics={selectedStudent.metrics}
                compact={false}
                studentName={selectedStudent.name}
              />
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                value={directMessageText}
                onChange={(e) => setDirectMessageText(e.target.value)}
                placeholder="학생에게 직접 전달할 주의 메시지..."
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
              <button
                onClick={() => handleSendDirectWarning(selectedStudent)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
              >
                <Send className="w-3.5 h-3.5 inline mr-1" />
                <span>전송</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-xs text-slate-400">클래스 학생 관리:</span>
              <button
                onClick={() => handleKickStudent(selectedStudent.id, selectedStudent.name)}
                className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/50 text-rose-200 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5"
              >
                <UserX className="w-4 h-4" />
                <span>{selectedStudent.name} 학생 클래스에서 내보내기 (퇴장)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Code Change Modal for Teacher */}
      {showRoomCodeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-indigo-400" />
                <span>교사 대시보드 클래스 방 코드 변경/입력</span>
              </h3>
              <button onClick={() => setShowRoomCodeModal(false)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              학생들이 사용하는 동일한 초대 방 코드를 입력하면 해당 학급의 모든 학생 실시간 카메라 AI 연동 화면이 교사 대시보드에 표시됩니다.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  클래스 방 코드
                </label>
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder="예: ROOM-3A1"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono font-bold text-indigo-300 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center space-x-1 mt-2">
                  <span className="text-[11px] text-slate-400">빠른 선택:</span>
                  {['ROOM-3A1', 'CLASS-1', 'STUDY-777', 'TEST-101'].map((code) => (
                    <button
                      key={code}
                      onClick={() => setRoomCodeInput(code)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-indigo-300 border border-slate-700"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => {
                  const cleanedCode = roomCodeInput.trim().toUpperCase() || 'ROOM-3A1';
                  setRoomCode(cleanedCode);
                  setShowRoomCodeModal(false);
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-indigo-600/30"
              >
                교사 대시보드 코드 변경 적용
              </button>
            </div>
          </div>
        </div>
      )}

      {messageSentToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-emerald-900/90 text-emerald-100 border border-emerald-500 p-4 rounded-2xl shadow-2xl animate-bounce text-xs font-bold">
          {messageSentToast}
        </div>
      )}
    </div>
  );
};
