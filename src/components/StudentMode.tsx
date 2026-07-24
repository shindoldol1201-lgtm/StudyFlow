import React, { useState, useEffect } from 'react';
import { FocusStatus, VisionMetrics } from '../types';
import { CameraVisionCanvas } from './CameraVisionCanvas';
import { Play, Pause, RotateCcw, QrCode, Bell, Volume2, ShieldAlert, Sparkles, CheckCircle2, Flame, Trophy, Smartphone, AlertCircle } from 'lucide-react';

export const StudentMode: React.FC = () => {
  // Session State
  const [joinedRoom, setJoinedRoom] = useState<string>('CLASS-3A-YAZA');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [qrCodeInput, setQrCodeInput] = useState<string>('');

  // AI Vision Metrics State
  const [status, setStatus] = useState<FocusStatus>('focus');
  const [metrics, setMetrics] = useState<VisionMetrics>({
    ear: 0.28,
    gazeX: 0.02,
    gazeY: 0.01,
    headPitch: 4,
    headYaw: 2,
    headRoll: 0,
    upperBodyJitter: 1.2,
    handNearFace: false,
    phoneObjectDetected: false,
    skeletonVisible: true,
    fps: 9.8,
  });

  // Pure Focus Timer State
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [focusSeconds, setFocusSeconds] = useState<number>(3740); // 1시간 2분 20초
  const [totalSeconds, setTotalSeconds] = useState<number>(4200); // 1시간 10분 00초
  const [streakCount, setStreakCount] = useState<number>(42); // 42분 연속 몰입
  const [drowsyAlertCount, setDrowsyAlertCount] = useState<number>(1);
  const [distractionCount, setDistractionCount] = useState<number>(2);

  // Care Notification Preferences
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(true);
  const [flashEnabled, setFlashEnabled] = useState<boolean>(true);
  const [activeAlertPopup, setActiveAlertPopup] = useState<string | null>(null);

  // 1-second interval timer: Only increments focusSeconds when status === 'focus' and isRunning
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

  // Handle live status change triggers & alerts
  const handleStatusChange = (newStatus: FocusStatus, updatedMetrics: Partial<VisionMetrics>) => {
    setStatus(newStatus);
    setMetrics((prev) => ({ ...prev, ...updatedMetrics }));

    if (newStatus === 'drowsy') {
      setDrowsyAlertCount((prev) => prev + 1);
      if (flashEnabled) {
        setActiveAlertPopup('⚠️ 졸음 감지! 화면 플래시 및 진동으로 깨워드립니다.');
      }
    } else if (newStatus === 'distracted') {
      setDistractionCount((prev) => prev + 1);
      setActiveAlertPopup('📱 스마트폰/딴짓 감지! 공부에 다시 집중해주세요.');
    } else if (newStatus === 'absent') {
      setActiveAlertPopup('🚪 자리 이탈 감지! 순공 타이머가 일시 정지되었습니다.');
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

  // Immersion Percentage
  const immersionPercent = totalSeconds > 0 ? Math.round((focusSeconds / totalSeconds) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Top Session Header & QR Join Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Google Meet & AI 비전 카메라 정상 연동 중</span>
            </span>
            <span className="text-xs text-slate-400">방 코드: <strong className="text-slate-200">{joinedRoom}</strong></span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            3학년 1반 야간자율학습 모드
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            실시간 스마트폰/패드 카메라가 수면 및 소란(떠듦)을 감지하고 순공 시간을 자동 측정합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="https://meet.google.com/studyflow-3a-2026"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 text-xs sm:text-sm font-bold transition-all shadow-md shadow-emerald-600/30"
          >
            <span>Google Meet 화상방 입장</span>
          </a>

          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-medium transition-all"
          >
            <QrCode className="w-4 h-4 text-indigo-400" />
            <span>QR 코드 재스캔</span>
          </button>
        </div>
      </div>

      {/* Main Grid: AI Camera Vision HUD & Pure Focus Timer Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Camera Stream & Realtime Overlay */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${status === 'focus' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <h3 className="text-sm font-bold text-slate-200">학생 AI 캠 실시간 비전 HUD</h3>
              </div>
              <span className="text-xs text-slate-400">MediaPipe Face Mesh + Skeleton</span>
            </div>

            {/* Camera Vision Component */}
            <CameraVisionCanvas
              status={status}
              metrics={metrics}
              onStatusChange={handleStatusChange}
              studentName="김철수"
              seatNo={3}
            />

            {/* Dynamic Status Banner */}
            <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
              status === 'focus'
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                : status === 'drowsy'
                ? 'bg-amber-950/60 border-amber-800/80 text-amber-300 animate-pulse'
                : status === 'distracted'
                ? 'bg-yellow-950/60 border-yellow-800/80 text-yellow-300 animate-pulse'
                : 'bg-rose-950/60 border-rose-800/80 text-rose-300'
            }`}>
              <div className="flex items-center space-x-2.5">
                {status === 'focus' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                {status === 'drowsy' && <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />}
                {status === 'distracted' && <Smartphone className="w-5 h-5 text-yellow-400 shrink-0" />}
                {status === 'absent' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}

                <div>
                  <div className="text-xs font-bold">
                    {status === 'focus' && '현재 최상의 집중 상태 유지 중!'}
                    {status === 'drowsy' && '졸음 감지! (눈감음 비율 EAR 0.14 지속)'}
                    {status === 'distracted' && '스마트폰 딴짓 감지! 시선 이탈 중'}
                    {status === 'absent' && '자리 이탈 감지! 상체 관절 미인식'}
                  </div>
                  <div className="text-[11px] opacity-80">
                    {status === 'focus' && '순공 타이머가 정상 카운트되고 있습니다.'}
                    {status === 'drowsy' && '무음 진동 및 화면 알림이 작동됩니다.'}
                    {status === 'distracted' && '스마트폰을 내려놓으면 타이머가 재개됩니다.'}
                    {status === 'absent' && '자리에 돌아오면 자동으로 집중 모드가 시작됩니다.'}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-mono font-bold">EAR {metrics.ear.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Pure Focus Timer & Care Alerts */}
        <div className="lg:col-span-5 space-y-6">
          {/* Pure Focus Timer Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Pure Focus Timer</span>
                <h3 className="text-lg font-bold text-white">AI 측정 실제 순공 시간</h3>
              </div>
              <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                <Flame className="w-4 h-4 fill-amber-400" />
                <span>{streakCount}분 연속 몰입</span>
              </div>
            </div>

            {/* Display Big Timer */}
            <div className="text-center py-4 bg-slate-950/80 rounded-2xl border border-slate-800/80">
              <div className="text-4xl sm:text-5xl font-mono font-extrabold tracking-tight text-emerald-400 drop-shadow-md">
                {formatTime(focusSeconds)}
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center justify-center space-x-2">
                <span>총 학습 진행: {formatTime(totalSeconds)}</span>
                <span>•</span>
                <span className="text-indigo-400 font-bold">몰입률 {immersionPercent}%</span>
              </div>
            </div>

            {/* Immersion Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300 font-medium">
                <span>오늘 목표 순공 (4시간)</span>
                <span>{Math.round((focusSeconds / 14400) * 100)}% 달성</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((focusSeconds / 14400) * 100))}%` }}
                />
              </div>
            </div>

            {/* Timer Controls */}
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
                    <span>타이머 일시정지</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-white" />
                    <span>순공 재개</span>
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
                title="타이머 초기화"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Care Notification Preferences & Daily Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <Bell className="w-4 h-4 text-indigo-400" />
                <span>몰입 케어 알림 설정</span>
              </h4>
              <span className="text-xs text-slate-400">야자 무음 모드</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <span className="text-xs text-slate-300 font-medium">무음 진동 피드백</span>
                <input
                  type="checkbox"
                  checked={vibrationEnabled}
                  onChange={(e) => setVibrationEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <span className="text-xs text-slate-300 font-medium">화면 플래시 알림</span>
                <input
                  type="checkbox"
                  checked={flashEnabled}
                  onChange={(e) => setFlashEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                />
              </label>
            </div>

            {/* Today's Detection Stats */}
            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 stat-card-accent border-l-amber-500">
                <div className="label-xs text-slate-400">오늘 졸음 감지</div>
                <div className="text-base font-bold text-amber-400 mt-0.5">{drowsyAlertCount}회</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 stat-card-accent border-l-yellow-500">
                <div className="label-xs text-slate-400">스마트폰 사용 감지</div>
                <div className="text-base font-bold text-yellow-400 mt-0.5">{distractionCount}회</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Popup Overlay Toast */}
      {activeAlertPopup && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-amber-900/90 text-amber-100 border border-amber-500 p-4 rounded-2xl shadow-2xl flex items-start space-x-3 backdrop-blur animate-bounce">
          <ShieldAlert className="w-6 h-6 text-amber-300 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-sm">StudyFlow AI 몰입 케어 알림</div>
            <p className="text-xs mt-0.5">{activeAlertPopup}</p>
          </div>
          <button
            onClick={() => setActiveAlertPopup(null)}
            className="text-amber-300 hover:text-white font-bold text-xs p-1"
          >
            닫기
          </button>
        </div>
      )}

      {/* QR Code Simulation Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-indigo-400" />
                <span>교실 QR 코드 스캔</span>
              </h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-32 h-32 bg-white p-2 rounded-xl flex items-center justify-center">
                <div className="w-full h-full bg-slate-900 rounded flex items-center justify-center text-indigo-400 font-mono text-xs font-bold">
                  [QR CODE]
                </div>
              </div>
              <p className="text-xs text-slate-400">교사 대시보드 또는 교실 입구 QR 코드를 카메라로 스캔하세요.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300">또는 방 코드 직접 입력:</label>
              <input
                type="text"
                value={qrCodeInput}
                onChange={(e) => setQrCodeInput(e.target.value)}
                placeholder="예: CLASS-3A-YAZA"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => {
                  if (qrCodeInput.trim()) setJoinedRoom(qrCodeInput.trim().toUpperCase());
                  setShowQrModal(false);
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors"
              >
                교실 연동 시작
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
