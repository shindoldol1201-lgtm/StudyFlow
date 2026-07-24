import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { ShieldCheck, User, Users, Sparkles, LogIn, UserPlus, Camera, ArrowRight, Check } from 'lucide-react';

interface AuthModalProps {
  onLoginSuccess: (user: UserProfile) => void;
  isOpen: boolean;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess, isOpen }) => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');

  // Form Fields
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [schoolName, setSchoolName] = useState<string>('한국고등학교');
  const [className, setClassName] = useState<string>('3학년 1반');
  const [seatNo, setSeatNo] = useState<number>(7);
  const [roomCode, setRoomCode] = useState<string>('ROOM-3A1');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email: email || `${selectedRole}_user@studyflow.edu`,
      name: name.trim() || (selectedRole === 'student' ? '김민수 (학생)' : selectedRole === 'teacher' ? '김선생 (교사)' : '이학습 (개인)'),
      role: selectedRole,
      schoolName,
      className,
      seatNo: Number(seatNo) || 1,
      roomCode: roomCode.trim().toUpperCase() || 'ROOM-3A1',
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem('studyflow_user', JSON.stringify(newUser));
    onLoginSuccess(newUser);
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    const demoUser: UserProfile = {
      id: `demo-${role}-${Date.now()}`,
      email: `${role}@demo.studyflow.edu`,
      name: role === 'student' ? '김민수 (학생)' : role === 'teacher' ? '박지성 교사' : '최몰입 (개인)',
      role,
      schoolName: '한국고등학교',
      className: '3학년 1반',
      seatNo: role === 'student' ? 7 : undefined,
      roomCode: 'ROOM-3A1',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('studyflow_user', JSON.stringify(demoUser));
    onLoginSuccess(demoUser);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl relative my-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 shadow-lg shadow-indigo-500/20 mb-1">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            StudyFlow AI 비전 시스템
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {isSignUp ? '새 계정을 생성하고 AI 실시간 카메라 학습에 참여하세요' : '로그인할 접속 역할을 선택하고 로그인하세요'}
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              !isSignUp ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>기존 계정 로그인</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              isSignUp ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>신규 회원가입</span>
          </button>
        </div>

        {/* Role Picker */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">접속 및 모드 역할 선택</label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedRole('student')}
              className={`p-3 rounded-2xl border transition-all text-left space-y-1 relative ${
                selectedRole === 'student'
                  ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/40 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {selectedRole === 'student' && (
                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
              <User className="w-5 h-5 text-indigo-400" />
              <div className="text-xs font-bold text-white">학생용 모드</div>
              <div className="text-[10px] text-slate-400 leading-tight">내 스마트폰/웹캠 연동</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('teacher')}
              className={`p-3 rounded-2xl border transition-all text-left space-y-1 relative ${
                selectedRole === 'teacher'
                  ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/40 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {selectedRole === 'teacher' && (
                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
              <Users className="w-5 h-5 text-emerald-400" />
              <div className="text-xs font-bold text-white">교사용 모드</div>
              <div className="text-[10px] text-slate-400 leading-tight">학급 모니터링 & 시간 설정</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('personal')}
              className={`p-3 rounded-2xl border transition-all text-left space-y-1 relative ${
                selectedRole === 'personal'
                  ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/40 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {selectedRole === 'personal' && (
                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
              <Sparkles className="w-5 h-5 text-amber-400" />
              <div className="text-xs font-bold text-white">개인 몰입</div>
              <div className="text-[10px] text-slate-400 leading-tight">목표 시간 직접 지정</div>
            </button>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">성함 / 이름</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={selectedRole === 'student' ? '예: 김민수' : selectedRole === 'teacher' ? '예: 박지성 교사' : '예: 이자율'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">이메일 주소</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@studyflow.edu"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">비밀번호</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {selectedRole === 'student' && (
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">출석 번호</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={seatNo}
                  onChange={(e) => setSeatNo(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div className="col-span-2">
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">접속 클래스 방 코드</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="예: ROOM-3A1"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-indigo-300 font-bold tracking-wider"
                />
              </div>
            </div>
          )}

          {selectedRole === 'teacher' && (
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">학급 명칭</label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="예: 3학년 1반 자율학습"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">발급 클래스 코드</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-300 font-bold tracking-wider"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 mt-2"
          >
            <span>{isSignUp ? '신규 회원가입 및 즉시 입장' : `${selectedRole === 'student' ? '학생' : selectedRole === 'teacher' ? '교사' : '개인'} 모드로 로그인`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick One-Click Demo Access Bar */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 text-center">
            ⚡ 체험용 원터치 원클릭 접속 (입력 없이 바로 테스트)
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickDemoLogin('student')}
              className="px-2.5 py-2 rounded-xl bg-slate-950 border border-indigo-900/60 hover:border-indigo-500 text-indigo-300 text-xs font-bold transition-all text-center"
            >
              👨‍🎓 학생용 접속
            </button>
            <button
              onClick={() => handleQuickDemoLogin('teacher')}
              className="px-2.5 py-2 rounded-xl bg-slate-950 border border-emerald-900/60 hover:border-emerald-500 text-emerald-300 text-xs font-bold transition-all text-center"
            >
              👩‍🏫 교사용 접속
            </button>
            <button
              onClick={() => handleQuickDemoLogin('personal')}
              className="px-2.5 py-2 rounded-xl bg-slate-950 border border-amber-900/60 hover:border-amber-500 text-amber-300 text-xs font-bold transition-all text-center"
            >
              👤 개인용 접속
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
