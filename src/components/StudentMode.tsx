import React, { useState, useEffect } from 'react';
import { FocusStatus, VisionMetrics, UserProfile } from '../types';
import { CameraVisionCanvas } from './CameraVisionCanvas';
import { Play, Pause, RotateCcw, QrCode, Bell, ShieldAlert, CheckCircle2, Flame, Smartphone, AlertCircle, Copy, ExternalLink, Video } from 'lucide-react';

interface StudentModeProps {
  currentUser?: UserProfile | null;
}

export const StudentMode: React.FC<StudentModeProps> = ({ currentUser }) => {
  // Unique Student Session ID to prevent collisions across multiple student tabs/devices
  const [studentSessionId] = useState<string>(() => {
    if (currentUser?.id) return currentUser.id;
    const saved = sessionStorage.getItem('studyflow_student_session_id');
    if (saved) return saved;
    const newId = `std-sess-${Math.floor(100000 + Math.random() * 900000)}`;
    sessionStorage.setItem('studyflow_student_session_id', newId);
    return newId;
  });

  // Joined Room State
  const [joinedRoom, setJoinedRoom] = useState<string>(
    (currentUser?.roomCode || 'ROOM-3A1').toUpperCase().trim()
  );
  const [studentName, setStudentName] = useState<string>(currentUser?.name || '김민수 (학생)');
  const [seatNo, setSeatNo] = useState<number>(currentUser?.seatNo || 7);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [roomCodeInput, setRoomCodeInput] = useState<string>(joinedRoom);
  const [nameInput, setNameInput] = useState<string>(studentName);
  const [seatInput, setSeatInput] = useState<number>(seatNo);
  const [teacherConnectedMessage, setTeacherConnectedMessage] = useState<string | null>(null);

  // AI Vision Metrics State
  const [status, setStatus] = useState<FocusStatus>('focus');
  const [metrics, setMetrics] = useState<VisionMetrics>({
    ear: 0.28,
    mar: 0.08,
    gazeX: 0.02,
    gazeY: 0.01,
    headPitch: 4,
    headYaw: 2,
    headRoll: 0,
    upperBodyJitter: 1.2,
    handNearFace: false,
    phoneObjectDetected: false,
    skeletonVisible: true,
    fps: 12,
    faceDetected: true,
  });

  // Pure Focus Timer State
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [focusSeconds, setFocusSeconds] = useState<number>(1200); // 20분
  const [totalSeconds, setTotalSeconds] = useState<number>(1500); // 25분
  const [streakCount, setStreakCount] = useState<number>(20);
  const [drowsyAlertCount, setDrowsyAlertCount] = useState<number>(0);
  const [distractionCount, setDistractionCount] = useState<number>(0);

  // Care Notifications
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(true);
  const [flashEnabled, setFlashEnabled] = useState<boolean>(true);
  const [activeAlertPopup, setActiveAlertPopup] = useState<string | null>(null);

  // Sync state to backend API for Teacher View
  useEffect(() => {
    const syncToTeacher = async () => {
      try {
        const cleanRoom = joinedRoom.toUpperCase().trim().replace(/\s+/g, '');
        const res = await fetch(`/api/rooms/${cleanRoom}/student-sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            className: '3학년 1반 자율학습',
            student: {
              id: studentSessionId,
              seatNo,
              name: studentName,
              status,
              cameraInstalled: true,
              cameraConnected: true,
              googleMeetConnected: true,
              focusSeconds,
              totalSeconds,
              drowsyCount: drowsyAlertCount,
              talkingCount: distractionCount,
              distractedCount: distractionCount,
              absentSeconds: status === 'absent' ? 10 : 0,
              metrics,
            },
          }),
        });

        if (res.ok) {
          const resData = await res.json();
          if (resData.directMessage) {
            setTeacherConnectedMessage(`🚨 [교사 경고 알림]: "${resData.directMessage}"`);
          }
        }
      } catch (e) {
        console.warn('Sync error:', e);
      }
    };

    syncToTeacher();
    const interval = setInterval(syncToTeacher, 1500); // Sync every 1.5s
    return () => clearInterval(interval);
  }, [joinedRoom, studentSessionId, studentName, seatNo, status, metrics, focusSeconds, totalSeconds, drowsyAlertCount, distractionCount]);

  // 1-second interval timer
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTotalSeconds((prev) => prev + 1);
        if (status === 'focus') {
          setFocusSeconds((prev) => prev + 1);
          setStreakCount((prev) => prev + 1);
        } else {
          setStreakCount(0);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, status]);

  const handleStatusChange = (newStatus: FocusStatus, updatedMetrics: Partial<VisionMetrics>) => {
    setStatus(newStatus);
    setMetrics((prev) => ({ ...prev, ...updatedMetrics }));

    if (newStatus === 'drowsy') {
      setDrowsyAlertCount((prev) => prev + 1);
      if (flashEnabled) {
        setActiveAlertPopup('⚠️ 수면/졸음 감지! 실시간 카메라 비전 무음 알림 작동 중');
      }
    } else if (newStatus === 'talking') {
      setDistractionCount((prev) => prev + 1);
      setActiveAlertPopup('🗣️ 소란/떠듦 감지! 입 모양(MAR) 움직임이 활성화되었습니다.');
    } else if (newStatus === 'absent') {
      setActiveAlertPopup('🚪 자리 이탈 감지! 자리에 돌아오시면 타이머가 재개됩니다.');
    } else {
      setActiveAlertPopup(null);
    }
  };

  const formatTime = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    return `${hours > 0 ? `${hours}시간 ` : ''}${minutes.toString().padStart(2, '0')}분 ${seconds.toString().padStart(2, '0')}초`;
  };

  const immersionPercent = totalSeconds > 0 ? Math.round((focusSeconds / totalSeconds) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>AI 카메라 실시간 연동 중</span>
            </span>
            <span className="text-xs text-slate-400">학급 코드: <strong className="text-indigo-300 font-bold">{joinedRoom}</strong></span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            #{seatNo}번 {studentName} 학생 모드
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            실시간 웹캠 카메라가 수면 및 소란을 자동 감지하고, 교사 대시보드와 실시간 상태가 동기화됩니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-medium transition-all"
          >
            <QrCode className="w-4 h-4 text-indigo-400" />
            <span>클래스 코드 변경</span>
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Real AI Webcam Feed */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${status === 'focus' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <h3 className="text-sm font-bold text-slate-200">실시간 웹캠 AI 카메라</h3>
              </div>
              <span className="text-xs text-slate-400">교사 대시보드 실시간 동기화</span>
            </div>

            <CameraVisionCanvas
              status={status}
              metrics={metrics}
              onStatusChange={handleStatusChange}
              studentName={studentName}
              seatNo={seatNo}
              autoStartCamera={true}
            />

            {/* Dynamic Status Banner */}
            <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
              status === 'focus'
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                : status === 'drowsy'
                ? 'bg-amber-950/60 border-amber-800/80 text-amber-300 animate-pulse'
                : status === 'talking'
                ? 'bg-rose-950/60 border-rose-800/80 text-rose-300 animate-pulse'
                : 'bg-rose-950/60 border-rose-800/80 text-rose-300'
            }`}>
              <div className="flex items-center space-x-2.5">
                {status === 'focus' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                {status === 'drowsy' && <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />}
                {status === 'talking' && <span className="text-lg shrink-0">🗣️</span>}
                {status === 'absent' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}

                <div>
                  <div className="text-xs font-bold">
                    {status === 'focus' && '현재 최상의 집중 상태 유지 중!'}
                    {status === 'drowsy' && '수면/졸음 감지! (눈감음 EAR 저하)'}
                    {status === 'talking' && '소란/떠듦 감지! (입모양 MAR 상승)'}
                    {status === 'absent' && '자리 이탈 감지! 화면에 안 보임'}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-mono font-bold">EAR {(metrics.ear || 0.28).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Focus Timer */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Pure Focus Timer</span>
                <h3 className="text-lg font-bold text-white">AI 측정 실제 순공 시간</h3>
              </div>
              <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                <Flame className="w-4 h-4 fill-amber-400" />
                <span>{streakCount}분 연속</span>
              </div>
            </div>

            <div className="text-center py-4 bg-slate-950/80 rounded-2xl border border-slate-800/80">
              <div className="text-4xl sm:text-5xl font-mono font-extrabold tracking-tight text-emerald-400 drop-shadow-md">
                {formatTime(focusSeconds)}
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center justify-center space-x-2">
                <span>총 진행: {formatTime(totalSeconds)}</span>
                <span>•</span>
                <span className="text-indigo-400 font-bold">몰입률 {immersionPercent}%</span>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-bold transition-all ${
                  isRunning
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-5 h-5" />
                    <span>측정 일시정지</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-white" />
                    <span>순공 측정 재개</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setFocusSeconds(0);
                  setTotalSeconds(0);
                  setStreakCount(0);
                }}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Warning Toast Popup */}
      {teacherConnectedMessage && (
        <div className="p-4 rounded-2xl bg-rose-950 border-2 border-rose-500 text-rose-100 flex items-center justify-between shadow-2xl animate-bounce">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-rose-400 shrink-0" />
            <span className="text-sm font-bold">{teacherConnectedMessage}</span>
          </div>
          <button
            onClick={() => setTeacherConnectedMessage(null)}
            className="px-3 py-1 rounded-lg bg-rose-800 hover:bg-rose-700 text-xs font-bold"
          >
            확인 및 닫기
          </button>
        </div>
      )}

      {/* Code & Student Info Change Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-indigo-400" />
                <span>클래스 방 코드 및 학생 정보</span>
              </h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  클래스 초대 방 코드
                </label>
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder="예: ROOM-3A1"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono font-bold text-indigo-300 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center space-x-1 mt-2">
                  <span className="text-[11px] text-slate-400">빠른 코드 선택:</span>
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

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">학생 이름</label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">좌석 번호</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={seatInput}
                    onChange={(e) => setSeatInput(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold text-center"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => {
                  const cleanedCode = roomCodeInput.trim().toUpperCase() || 'ROOM-3A1';
                  setJoinedRoom(cleanedCode);
                  if (nameInput.trim()) setStudentName(nameInput.trim());
                  setSeatNo(seatInput);
                  setShowQrModal(false);
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-indigo-600/30"
              >
                교사 대시보드 연결 적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
