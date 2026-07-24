import React from 'react';
import { AppMode } from '../types';
import { Camera, ShieldCheck, Users, User, Sparkles, Activity, Video } from 'lucide-react';

interface HeaderProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  cameraActive: boolean;
  onToggleCamera: () => void;
  classImmersionScore?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  cameraActive,
  onToggleCamera,
  classImmersionScore = 88,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  StudyFlow
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <Video className="w-3 h-3 text-emerald-400 inline mr-0.5" />
                  <span>Google Meet 연동</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                구글 미트 화상 연동 및 실시간 비전 AI 학습 몰입 모니터링
              </p>
            </div>
          </div>

          {/* Mode Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => onSelectMode('student')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentMode === 'student'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>학생용 (내 캠)</span>
            </button>

            <button
              onClick={() => onSelectMode('teacher')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentMode === 'teacher'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>교사용 대시보드</span>
              <span className="hidden md:inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] bg-indigo-900/80 text-indigo-200 rounded-md border border-indigo-700">
                28명
              </span>
            </button>

            <button
              onClick={() => onSelectMode('personal')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentMode === 'personal'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>개인 몰입</span>
            </button>
          </nav>

          {/* Controls & Privacy Badge */}
          <div className="flex items-center space-x-3">
            {/* Privacy Badge */}
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Privacy-by-Design</span>
            </div>

            {/* Camera Toggle Button */}
            <button
              onClick={onToggleCamera}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                cameraActive
                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-600/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
              title="카메라 AI 엔진 활성화/비활성화"
            >
              <Camera className={`w-4 h-4 ${cameraActive ? 'text-emerald-400 animate-pulse' : ''}`} />
              <span className="hidden sm:inline">{cameraActive ? 'AI 캠 ON' : 'AI 캠 OFF'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
