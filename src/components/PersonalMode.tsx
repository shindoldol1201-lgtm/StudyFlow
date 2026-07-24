import React, { useState } from 'react';
import { FocusStatus, VisionMetrics } from '../types';
import { CameraVisionCanvas } from './CameraVisionCanvas';
import { AiInsightsModal } from './AiInsightsModal';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Sparkles, Play, Pause, RotateCcw, Volume2, Bell, Smartphone, Clock, Award, TrendingUp, Calendar, Zap } from 'lucide-react';

export const PersonalMode: React.FC = () => {
  // Personal Timer & Vision State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [status, setStatus] = useState<FocusStatus>('focus');
  const [metrics, setMetrics] = useState<VisionMetrics>({
    ear: 0.28,
    gazeX: 0.01,
    gazeY: 0.02,
    headPitch: 3,
    headYaw: 1,
    headRoll: 0,
    upperBodyJitter: 0.9,
    handNearFace: false,
    phoneObjectDetected: false,
    skeletonVisible: true,
    fps: 9.8,
  });

  const [focusSeconds, setFocusSeconds] = useState<number>(14400); // 4시간 00분
  const [totalSeconds, setTotalSeconds] = useState<number>(16200); // 4시간 30분
  const [drowsinessCount, setDrowsinessCount] = useState<number>(2);
  const [distractionCount, setDistractionCount] = useState<number>(3);

  // Care Notification Preferences
  const [alertType, setAlertType] = useState<'vibration' | 'sound' | 'popup'>('vibration');

  // AI Insights Modal State
  const [showAiModal, setShowAiModal] = useState<boolean>(false);

  // Weekly Focus Data for Chart
  const weeklyData = [
    { day: '월', focusHours: 4.2, totalHours: 5.0 },
    { day: '화', focusHours: 5.5, totalHours: 6.0 },
    { day: '수', focusHours: 3.8, totalHours: 4.5 },
    { day: '목', focusHours: 6.0, totalHours: 6.5 },
    { day: '금', focusHours: 4.0, totalHours: 4.5 },
    { day: '토', focusHours: 7.2, totalHours: 8.0 },
    { day: '일', focusHours: 5.8, totalHours: 6.5 },
  ];

  // Distribution Pie Data
  const pieData = [
    { name: '몰입 집중', value: 82, color: '#10b981' },
    { name: '졸음/휴식', value: 10, color: '#f59e0b' },
    { name: '스마트폰 딴짓', value: 8, color: '#ef4444' },
  ];

  const formatTime = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    return `${hours > 0 ? `${hours}시간 ` : ''}${minutes}분 ${seconds}초`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              개인 독서실/혼공 모드
            </span>
            <span className="text-xs text-slate-400">학급 연결 없이 독립 실행</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            혼자 공부하는 맞춤형 AI 비전 타이머
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            나만의 기기 카메라로 실시간 시선 및 졸음을 케어하고, 일/주별 순공 그래프와 Gemini AI 리포트를 확인하세요.
          </p>
        </div>

        {/* AI Report Generator Trigger Button */}
        <button
          onClick={() => setShowAiModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-105"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Gemini AI 학습 분석 리포트 받기</span>
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (6 cols): Live Camera View & Timer */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200">개인 AI 캠 화면</h3>
              <span className="text-xs text-slate-400">자세 및 졸음 감지 중</span>
            </div>

            <CameraVisionCanvas
              status={status}
              metrics={metrics}
              onStatusChange={(s, m) => {
                setStatus(s);
                setMetrics((prev) => ({ ...prev, ...m }));
              }}
              studentName="나의 혼공 캠"
            />
          </div>

          {/* Individual Timer Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-cyan-400">PERSONAL TIMER</span>
              <span className="text-xs text-slate-400">오늘 목표: 6시간 00분</span>
            </div>

            <div className="text-center py-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-3xl sm:text-4xl font-mono font-extrabold text-cyan-400">
                {formatTime(focusSeconds)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                총 공부 시간: {formatTime(totalSeconds)} (순공율 {Math.round((focusSeconds / totalSeconds) * 100)}%)
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all ${
                  isRunning ? 'bg-amber-600 text-white' : 'bg-cyan-600 text-white hover:bg-cyan-500'
                }`}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isRunning ? '일시정지' : '독립 순공 시작'}</span>
              </button>

              <button
                onClick={() => {
                  setFocusSeconds(0);
                  setTotalSeconds(0);
                }}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (6 cols): Personal Analytics Dashboard (Recharts) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Weekly Focus Bar Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>주간 일별 순공 시간 (시간)</span>
              </h3>
              <span className="text-xs text-slate-400">이번 주 평균 5.2시간</span>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Bar dataKey="focusHours" name="실제 순공 시간" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Time Distribution Pie & Peak Hours Analysis */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>오늘 학습 상태 비율 & 최고 집중 시간대</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* Pie Chart */}
              <div className="h-36 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={28} outerRadius={50} paddingAngle={3}>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Peak Hours Card */}
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 stat-card-accent border-l-emerald-500">
                  <div className="label-xs text-slate-400">최고 집중 시간대</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">14:00 ~ 16:30 (몰입률 94%)</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 stat-card-accent border-l-amber-500">
                  <div className="label-xs text-slate-400">졸음 빈발 시간대</div>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">21:30 ~ 22:00 (EAR 평균 0.15)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights Modal */}
      {showAiModal && (
        <AiInsightsModal
          mode="개인 혼공 모드"
          focusTimeSeconds={focusSeconds}
          totalTimeSeconds={totalSeconds}
          drowsinessCount={drowsinessCount}
          distractionCount={distractionCount}
          peakHours="14:00 - 16:30"
          onClose={() => setShowAiModal(false)}
        />
      )}
    </div>
  );
};
