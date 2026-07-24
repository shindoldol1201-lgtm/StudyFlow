import React from 'react';
import { AppMode, UserProfile } from '../types';
import { Camera, ShieldCheck, Users, User, Sparkles, Activity, Video, LogOut, LogIn } from 'lucide-react';

interface HeaderProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  cameraActive: boolean;
  onToggleCamera: () => void;
  currentUser: UserProfile | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  cameraActive,
  onToggleCamera,
  currentUser,
  onOpenAuthModal,
  onLogout,
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
                  <Activity className="w-3 h-3 text-emerald-400 inline mr-0.5" />
                  <span>실시간 AI 비전</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                실시간 웹캠 AI 비전 학습 모니터링 & 시간 맞춤 설정
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
              <User className="w-4 h-4 text-indigo-300" />
              <span>학생용</span>
            </button>

            <button
              onClick={() => onSelectMode('teacher')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentMode === 'teacher'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-300" />
              <span>교사용 대시보드</span>
            </button>

            <button
              onClick={() => onSelectMode('personal')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentMode === 'personal'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>개인 몰입</span>
            </button>
          </nav>

          {/* User Profile & Auth Controls */}
          <div className="flex items-center space-x-2.5">
            {currentUser ? (
              <div className="flex items-center space-x-2">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-200">{currentUser.name}</span>
                  <span className="text-[10px] text-indigo-400">
                    {currentUser.role === 'student' ? `학생 (#${currentUser.seatNo || 1})` : currentUser.role === 'teacher' ? '교사' : '개인'}
                  </span>
                </div>

                <button
                  onClick={onOpenAuthModal}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                  title="계정 정보 및 모드 변경"
                >
                  계정/역할 변경
                </button>

                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-xs transition-colors"
                  title="로그아웃"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>로그인 / 회원가입</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
