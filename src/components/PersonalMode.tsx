import React, { useState, useEffect } from 'react';
import { FocusStatus, VisionMetrics } from '../types';
import { CameraVisionCanvas } from './CameraVisionCanvas';
import { AiInsightsModal } from './AiInsightsModal';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Sparkles, Play, Pause, RotateCcw, Volume2, Clock, Award, TrendingUp, Target, CheckCircle, Bell } from 'lucide-react';

export const PersonalMode: React.FC = () => {
  // Personal Target & Timer State
  const [targetMinutes, setTargetMinutes] = useState<number>(60); // Default 60 minutes target
  const [customMinutesInput, setCustomMinutesInput] = useState<string>('60');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedFocusSeconds, setElapsedFocusSeconds] = useState<number>(0);
  const [elapsedTotalSeconds, setElapsedTotalSeconds] = useState<number>(0);

  // Vision AI State
  const [status, setStatus] = useState<FocusStatus>('focus');
  const [metrics, setMetrics] = useState<VisionMetrics>({
    ear: 0.28,
    mar: 0.08,
    gazeX: 0.01,
    gazeY: 0.02,
    headPitch: 3,
    headYaw: 1,
    headRoll: 0,
    upperBodyJitter: 0.9,
    handNearFace: false,
    phoneObjectDetected: false,
    skeletonVisible: true,
    fps: 12,
    faceDetected: true,
  });

  const [drowsinessCount, setDrowsinessCount] = useState<number>(0);
  const [talkingCount, setTalkingCount] = useState<number>(0);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [targetAchievedAlert, setTargetAchievedAlert] = useState<boolean>(false);

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTotalSeconds((prev) => prev + 1);
        if (status === 'focus') {
          setElapsedFocusSeconds((prev) => {
            const next = prev + 1;
            if (next >= targetMinutes * 60 && !targetAchievedAlert) {
              setTargetAchievedAlert(true);
            }
            return next;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, status, targetMinutes, targetAchievedAlert]);

  // Handle status changes from Real AI Camera
  const handleStatusChange = (newStatus: FocusStatus, newMetrics: Partial<VisionMetrics>) => {
    setStatus(newStatus);
    setMetrics((prev) => ({ ...prev, ...newMetrics }));
    if (newStatus === 'drowsy') setDrowsinessCount((c) => c + 1);
    if (newStatus === 'talking') setTalkingCount((c) => c + 1);
  };

  // Set target time preset
  const handleSelectPresetTarget = (mins: number) => {
    setTargetMinutes(mins);
    setCustomMinutesInput(mins.toString());
  };

  const handleApplyCustomMinutes = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customMinutesInput, 10);
    if (val && val > 0) {
      setTargetMinutes(val);
    }
  };

  const formatSecondsToMinSec = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainderSec = sec % 60;
    return `${mins}분 ${remainderSec < 10 ? '0' : ''}${remainderSec}초`;
  };

  const targetSecondsTotal = targetMinutes * 60;
  const progressPercent = Math.min(100, Math.round((elapsedFocusSeconds / (targetSecondsTotal || 1)) * 100));

  // Charts
  const weeklyData = [
    { day: '월', focusHours: 1.2 },
    { day: '화', focusHours: 2.5 },
    { day: '수', focusHours: 1.8 },
    { day: '목', focusHours: 2.0 },
    { day: '금', focusHours: 1.5 },
    { day: '토', focusHours: 3.2 },
    { day: '일', focusHours: (elapsedFocusSeconds / 3600).toFixed(1) },
  ];

  const pieData = [
    { name: '실제 순공 몰입', value: elapsedFocusSeconds || 1, color: '#10b981' },
    { name: '잔여 목표 시간', value: Math.max(0, targetSecondsTotal - elapsedFocusSeconds), color: '#334155' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              개인 맞춤형 독립 모드
            </span>
            <span className="text-xs text-slate-400">목표 시간 직접 설정 가능</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            실시간 웹캠 AI 비전 개인 몰입 타이머
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            직접 정한 목표 시간에 맞춰 실시간 카메라가 수면 및 떠듦을 케어합니다.
          </p>
        </div>

        <button
          onClick={() => setShowAiModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-105"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Gemini AI 학습 분석 리포트 받기</span>
        </button>
      </div>

      {/* Target Time Custom Configurator Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-200">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <span>개인 집중 목표 시간 직접 지정</span>
          </div>
          <span className="text-cyan-400">현재 목표: {targetMinutes}분 ({Math.floor(targetMinutes / 60)}시간 {targetMinutes % 60}분)</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">빠른 목표 선택:</span>
          {[25, 45, 60, 90, 120, 180].map((mins) => (
            <button
              key={mins}
              onClick={() => handleSelectPresetTarget(mins)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                targetMinutes === mins
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-600/30'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              {mins >= 60 ? `${Math.floor(mins / 60)}시간 ${mins % 60 > 0 ? `${mins % 60}분` : ''}` : `${mins}분`}
            </button>
          ))}

          {/* Custom Input Form */}
          <form onSubmit={handleApplyCustomMinutes} className="flex items-center space-x-1.5 ml-auto">
            <input
              type="number"
              min={1}
              max={1440}
              value={customMinutesInput}
              onChange={(e) => setCustomMinutesInput(e.target.value)}
              className="w-20 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white text-center font-bold"
              placeholder="분 입력"
            />
            <span className="text-xs text-slate-400">분</span>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
            >
              적용
            </button>
          </form>
        </div>
      </div>

      {/* Target Progress Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span>목표 달성률 ({progressPercent}%)</span>
          <span className="text-emerald-400 font-mono text-sm">{formatSecondsToMinSec(elapsedFocusSeconds)} / {targetMinutes}분</span>
        </div>

        <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-cyan-500 via-emerald-400 to-indigo-500 h-full transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (6 cols): Real Camera Feed & Timer Controls */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200">실시간 웹캠 AI 화면</h3>
              <span className="text-xs text-slate-400">자동 실시간 얼굴/눈 감지</span>
            </div>

            <CameraVisionCanvas
              status={status}
              metrics={metrics}
              onStatusChange={handleStatusChange}
              studentName="내 카메라 라이브"
              autoStartCamera={true}
            />
          </div>

          {/* Timer Action Buttons */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-cyan-400">PERSONAL TIMER CONTROLS</span>
              <span className="text-xs text-slate-400">총 소요 시간: {formatSecondsToMinSec(elapsedTotalSeconds)}</span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg ${
                  isRunning
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30'
                }`}
              >
                {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                <span>{isRunning ? '측정 일시정지' : '순공 측정 시작'}</span>
              </button>

              <button
                onClick={() => {
                  setIsRunning(false);
                  setElapsedFocusSeconds(0);
                  setElapsedTotalSeconds(0);
                  setTargetAchievedAlert(false);
                }}
                className="p-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition-colors"
                title="타이머 초기화"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (6 cols): Analytics Dashboard */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>일별 학습 달성량</span>
            </h3>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', fontSize: '11px' }} />
                  <Bar dataKey="focusHours" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>실시간 AI 모니터링 통계</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400">졸음/수면 감지 횟수</div>
                <div className="text-lg font-bold text-amber-400 mt-1">{drowsinessCount}회</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400">떠듦/소란 감지 횟수</div>
                <div className="text-lg font-bold text-rose-400 mt-1">{talkingCount}회</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Target Completion Modal */}
      {targetAchievedAlert && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500 rounded-3xl p-6 max-w-md w-full space-y-4 text-center shadow-2xl animate-bounce">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-white">🎉 목표 시간 달성 완료!</h3>
            <p className="text-xs text-slate-300">
              설정하신 <strong className="text-emerald-400">{targetMinutes}분</strong> 개인 몰입 목표를 성공적으로 완료했습니다!
            </p>
            <button
              onClick={() => setTargetAchievedAlert(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* AI Insights Modal */}
      {showAiModal && (
        <AiInsightsModal
          mode="개인 독립 모드"
          focusTimeSeconds={elapsedFocusSeconds}
          totalTimeSeconds={elapsedTotalSeconds}
          drowsinessCount={drowsinessCount}
          distractionCount={talkingCount}
          peakHours="현재 집중 세션"
          onClose={() => setShowAiModal(false)}
        />
      )}
    </div>
  );
};
