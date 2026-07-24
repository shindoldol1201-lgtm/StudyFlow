import React, { useState, useEffect } from 'react';
import { StudentData, ClassroomStats, AlertNotification, FocusStatus } from '../types';
import { INITIAL_STUDENTS, INITIAL_CLASS_STATS, INITIAL_ALERTS } from '../mockData';
import { CameraVisionCanvas } from './CameraVisionCanvas';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Users, Shield, Bell, Filter, CheckCircle, AlertTriangle, Smartphone, UserX, Send, Eye, Video, Volume2, VolumeX, AlertCircle, ExternalLink, RefreshCw, BarChart2, ShieldCheck, ChevronRight, Camera } from 'lucide-react';

export const TeacherMode: React.FC = () => {
  // Students & Classroom State
  const [students, setStudents] = useState<StudentData[]>(INITIAL_STUDENTS);
  const [classStats, setClassStats] = useState<ClassroomStats>(INITIAL_CLASS_STATS);
  const [alerts, setAlerts] = useState<AlertNotification[]>(INITIAL_ALERTS);

  // Filters & Audio Settings
  const [filterStatus, setFilterStatus] = useState<string>('all'); // all | drowsy | talking | distracted | absent | uninstalled
  const [privacyModeEnabled, setPrivacyModeEnabled] = useState<boolean>(false); // False by default so actual camera/face views show!
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [directMessageText, setDirectMessageText] = useState<string>('');
  const [messageSentToast, setMessageSentToast] = useState<string | null>(null);
  const [soundAlertEnabled, setSoundAlertEnabled] = useState<boolean>(true);

  // Sound Synth Alert Generator
  const playAlarmSound = () => {
    if (!soundAlertEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.log('Audio Context playback prevented by browser policy until user interacts.');
    }
  };

  // Periodic simulation heartbeat to simulate live updates across 28 students
  useEffect(() => {
    const interval = setInterval(() => {
      setStudents((prevStudents) =>
        prevStudents.map((std) => {
          if (std.id === 'std-3') {
            return {
              ...std,
              status: 'drowsy',
              drowsyCount: std.drowsyCount + (Math.random() > 0.8 ? 1 : 0),
              metrics: { ...std.metrics, ear: 0.11 + Math.random() * 0.03 },
            };
          }
          if (std.id === 'std-5') {
            return {
              ...std,
              status: 'talking',
              talkingCount: std.talkingCount + (Math.random() > 0.8 ? 1 : 0),
              metrics: { ...std.metrics, mar: 0.62 + Math.random() * 0.15 },
            };
          }
          if (std.id === 'std-15') {
            return {
              ...std,
              status: 'absent',
              absentSeconds: std.absentSeconds + 3,
            };
          }

          // Random slight focus tick for connected students
          const isFocus = std.status === 'focus';
          return {
            ...std,
            focusSeconds: isFocus ? std.focusSeconds + 3 : std.focusSeconds,
            totalSeconds: std.totalSeconds + 3,
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Filter students based on selection
  const filteredStudents = students.filter((s) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'uninstalled') return !s.cameraInstalled || !s.cameraConnected;
    return s.status === filterStatus;
  });

  // Calculate real-time state counts
  const cameraInstalledCount = students.filter((s) => s.cameraInstalled).length;
  const cameraConnectedCount = students.filter((s) => s.cameraConnected).length;
  const cameraUninstalledCount = students.length - cameraInstalledCount;
  const cameraDisconnectedCount = students.length - cameraConnectedCount;

  const focusCount = students.filter((s) => s.cameraConnected && s.status === 'focus').length;
  const drowsyCount = students.filter((s) => s.cameraConnected && s.status === 'drowsy').length;
  const talkingCount = students.filter((s) => s.cameraConnected && s.status === 'talking').length;
  const distractedCount = students.filter((s) => s.cameraConnected && s.status === 'distracted').length;
  const absentCount = students.filter((s) => !s.cameraConnected || s.status === 'absent').length;

  // Active High Priority Urgent Alerts (Drowsy or Talking)
  const urgentAlertStudents = students.filter(s => s.status === 'drowsy' || s.status === 'talking');

  const handleSendDirectWarning = (student: StudentData, customMsg?: string) => {
    const msg = customMsg || directMessageText.trim() || '지속적인 수면/소란이 감지되었습니다. Google Meet 및 카메라 확인 바랍니다.';
    playAlarmSound();
    setMessageSentToast(`🔔 [${student.name} 학생] 기기로 경고 알림 전송 완료: "${msg}"`);
    setDirectMessageText('');
    setTimeout(() => setMessageSentToast(null), 4000);
  };

  const handleSendCameraSetupRequestAll = () => {
    setMessageSentToast(`📢 카메라 미연동 학생 (${cameraDisconnectedCount}명)에게 설치 및 카메라 켜기 요청 알림을 발송했습니다.`);
    setTimeout(() => setMessageSentToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Classroom Summary & Google Meet Hub Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                <Video className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google Meet 라이브 클래스 연동</span>
              </span>
              <span className="text-xs text-slate-400">학급: {classStats.className}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              실시간 AI 카메라 수면·소란 모니터링 (총 {students.length}명)
            </h2>
          </div>

          {/* Google Meet & Sound Controls Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={classStats.googleMeetUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/30"
            >
              <Video className="w-4 h-4" />
              <span>Google Meet 화상방 접속</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
            </a>

            <button
              onClick={() => setSoundAlertEnabled(!soundAlertEnabled)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                soundAlertEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="수면/떠듦 감지 시 경림음 소리 활성화/비활성화"
            >
              {soundAlertEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundAlertEnabled ? '경고음 ON' : '경고음 OFF'}</span>
            </button>

            <button
              onClick={() => setPrivacyModeEnabled(!privacyModeEnabled)}
              className={`flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                privacyModeEnabled
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-400 mr-1" />
              <span>{privacyModeEnabled ? '스켈레톤 모드' : '실제 비전 모드'}</span>
            </button>
          </div>
        </div>

        {/* Feature 1: Class Camera Installation Status Banner */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-900/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                <span>반 아이들 전체 카메라 설치 및 라이브 연결 확인</span>
                <span className="px-2 py-0.2 text-[10px] bg-emerald-500/20 text-emerald-300 rounded-full font-semibold">
                  설치율 {Math.round((cameraInstalledCount / students.length) * 100)}%
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-3">
                <span>카메라 설치: <strong className="text-emerald-400">{cameraInstalledCount}명</strong></span>
                <span>실시간 라이브 연결: <strong className="text-indigo-400">{cameraConnectedCount}명</strong></span>
                <span>미설치/미연동: <strong className="text-rose-400">{cameraDisconnectedCount}명</strong></span>
              </div>
            </div>
          </div>

          {cameraDisconnectedCount > 0 && (
            <button
              onClick={handleSendCameraSetupRequestAll}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shrink-0 flex items-center space-x-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>미연동 학생 ({cameraDisconnectedCount}명) 설치알림 전송</span>
            </button>
          )}
        </div>

        {/* High Priority Urgent Alert Banner if sleeping or talking */}
        {urgentAlertStudents.length > 0 && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/60 text-rose-200 flex items-center justify-between animate-pulse">
            <div className="flex items-center space-x-2 text-xs font-bold">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>
                🚨 실시간 알람: {urgentAlertStudents.map(s => `${s.name}(${s.status === 'drowsy' ? '수면/졸음' : '떠듦/소란'})`).join(', ')} 이상 상태 발생!
              </span>
            </div>
            <button
              onClick={() => setSelectedStudent(urgentAlertStudents[0])}
              className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold text-[11px] hover:bg-rose-500 transition-colors shrink-0"
            >
              즉시 개별 확인
            </button>
          </div>
        )}

        {/* Status Counters KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 stat-card-accent flex items-center justify-between">
            <div>
              <div className="label-xs text-slate-400">정상 몰입</div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">{focusCount}명</div>
            </div>
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 stat-card-accent border-l-amber-500 flex items-center justify-between">
            <div>
              <div className="label-xs text-slate-400">수면 / 졸음</div>
              <div className="text-xl font-bold text-amber-400 mt-0.5">{drowsyCount}명</div>
            </div>
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 stat-card-accent border-l-rose-500 flex items-center justify-between">
            <div>
              <div className="label-xs text-slate-400">떠듦 / 소란</div>
              <div className="text-xl font-bold text-rose-400 mt-0.5">{talkingCount}명</div>
            </div>
            <span className="text-lg">🗣️</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 stat-card-accent border-l-yellow-500 flex items-center justify-between">
            <div>
              <div className="label-xs text-slate-400">스마트폰 사용</div>
              <div className="text-xl font-bold text-yellow-400 mt-0.5">{distractedCount}명</div>
            </div>
            <Smartphone className="w-5 h-5 text-yellow-400 shrink-0" />
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 stat-card-accent border-l-slate-600 flex items-center justify-between col-span-2 sm:col-span-1">
            <div>
              <div className="label-xs text-slate-400">캠 미연동 / 이탈</div>
              <div className="text-xl font-bold text-slate-300 mt-0.5">{absentCount}명</div>
            </div>
            <UserX className="w-5 h-5 text-slate-400 shrink-0" />
          </div>
        </div>
      </div>

      {/* Main Classroom Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (8 cols): 28-Student Grid View with Filters & Clickable Individual Inspector */}
        <div className="lg:col-span-8 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl gap-2">
            <div className="flex items-center space-x-1.5 label-xs text-slate-300">
              <Filter className="w-4 h-4 text-indigo-400" />
              <span>상태 필터링:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setFilterStatus('all')}
                className={`btn-pill ${filterStatus === 'all' ? 'btn-pill-active' : 'text-slate-300'}`}
              >
                전체 ({students.length}명)
              </button>

              <button
                onClick={() => setFilterStatus('drowsy')}
                className={`btn-pill ${filterStatus === 'drowsy' ? 'btn-pill-active bg-amber-600 border-amber-500' : 'text-slate-300'}`}
              >
                수면/졸음 ({drowsyCount}명)
              </button>

              <button
                onClick={() => setFilterStatus('talking')}
                className={`btn-pill ${filterStatus === 'talking' ? 'btn-pill-active bg-rose-600 border-rose-500' : 'text-slate-300'}`}
              >
                떠듦/소란 ({talkingCount}명)
              </button>

              <button
                onClick={() => setFilterStatus('distracted')}
                className={`btn-pill ${filterStatus === 'distracted' ? 'btn-pill-active bg-yellow-600 border-yellow-500 text-slate-950' : 'text-slate-300'}`}
              >
                스마트폰 ({distractedCount}명)
              </button>

              <button
                onClick={() => setFilterStatus('uninstalled')}
                className={`btn-pill ${filterStatus === 'uninstalled' ? 'btn-pill-active bg-slate-700 border-slate-500' : 'text-slate-300'}`}
              >
                캠 미연동 ({cameraDisconnectedCount}명)
              </button>
            </div>
          </div>

          {/* Feature 4: At-a-Glance Student Grid (Clickable per student for Individual Inspector) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredStudents.map((std) => {
              let borderClass = 'border-slate-800 hover:border-slate-700';
              let badgeStyle = 'badge-focus';
              let statusText = 'FOCUS';

              if (!std.cameraConnected) {
                borderClass = 'border-slate-800 bg-slate-950/60 opacity-80';
                badgeStyle = 'badge-danger';
                statusText = 'NO CAM';
              } else if (std.status === 'drowsy') {
                borderClass = 'border-amber-500/80 bg-slate-900 ring-2 ring-amber-500/60 animate-pulse';
                badgeStyle = 'badge-warning';
                statusText = 'DROWSY';
              } else if (std.status === 'talking') {
                borderClass = 'border-rose-500/80 bg-slate-900 ring-2 ring-rose-500/60 animate-pulse';
                badgeStyle = 'badge-danger';
                statusText = 'TALKING';
              } else if (std.status === 'distracted') {
                borderClass = 'border-yellow-500/80 bg-slate-900 ring-1 ring-yellow-500/50';
                badgeStyle = 'badge-warning';
                statusText = 'PHONE';
              } else if (std.status === 'absent') {
                borderClass = 'border-rose-500/80 bg-slate-900 ring-1 ring-rose-500/50';
                badgeStyle = 'badge-danger';
                statusText = 'ABSENT';
              }

              const focusPercent = Math.round((std.focusSeconds / std.totalSeconds) * 100);

              return (
                <div
                  key={std.id}
                  onClick={() => setSelectedStudent(std)}
                  className={`bg-slate-900 border rounded-xl p-2.5 space-y-2 cursor-pointer transition-all hover:scale-[1.03] shadow-md group ${borderClass}`}
                  title="클릭하여 개개인 실시간 비전 및 Google Meet 캠 정밀 확인"
                >
                  {/* Grid Card Header */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1 font-bold text-slate-200">
                      <span className="text-indigo-400">#{std.seatNo}</span>
                      <span className="truncate max-w-[80px]">{std.name}</span>
                    </div>
                    <span className={badgeStyle}>
                      {statusText}
                    </span>
                  </div>

                  {/* Camera / Skeleton Live Canvas View */}
                  <div className="h-24 rounded-lg overflow-hidden border border-slate-800/80 relative">
                    <CameraVisionCanvas
                      status={std.status}
                      metrics={std.metrics}
                      showPrivacyMode={privacyModeEnabled}
                      compact={true}
                    />
                    <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-2 py-1 rounded bg-slate-950/90 text-indigo-300 text-[10px] font-bold border border-indigo-500/50">
                        개별 상세 보기 🔍
                      </span>
                    </div>
                  </div>

                  {/* Student Quick Metric Footer */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <span className="flex items-center space-x-1">
                      {std.cameraConnected ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
                      )}
                      <span>{std.cameraConnected ? '캠 연결' : '캠 미연동'}</span>
                    </span>
                    <span className="font-semibold text-emerald-400">{focusPercent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right (4 cols): FCM Live Push Alert Feed & Class Analytics */}
        <div className="lg:col-span-4 space-y-6">
          {/* FCM Push Alert Feed Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>교사 실시간 수면/소란 알림 피드</span>
              </h3>
              <span className="px-2 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-300 font-bold">
                주의 {alerts.length}건
              </span>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {alerts.map((alt) => (
                <div
                  key={alt.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-400">
                      #{alt.seatNo}번 {alt.studentName} 학생
                    </span>
                    <span className="text-[10px] text-slate-500">{alt.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-300">{alt.message}</p>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        const std = students.find((s) => s.id === alt.studentId);
                        if (std) {
                          setSelectedStudent(std);
                          handleSendDirectWarning(std, '수면/소란이 지속적으로 감지되어 교사 주의 경고가 발송되었습니다.');
                        }
                      }}
                      className="text-[10px] text-indigo-400 hover:underline flex items-center space-x-1 font-bold"
                    >
                      <span>즉시 원격 알림 발송</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Classroom Immersion Trend Graph (Recharts) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-indigo-400" />
                <span>학급 시간대별 몰입도 추이</span>
              </h3>
              <span className="text-xs text-emerald-400 font-bold">평균 86%</span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={classStats.hourlyImmersionHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                  <YAxis domain={[50, 100]} stroke="#94a3b8" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="focusRate" name="학급 몰입률 (%)" stroke="#10b981" fillOpacity={1} fill="url(#colorFocus)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Feature 4: Individual Student Inspector Modal (개개인 확인 모달) */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-indigo-400">#{selectedStudent.seatNo}번</span>
                <h3 className="text-lg font-bold text-white">{selectedStudent.name} 학생 실시간 비전 & Google Meet 정밀 확인</h3>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-white text-sm p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Live Camera Feed Zoom & Landmarks */}
            <div className="h-56 rounded-xl overflow-hidden border border-slate-800 relative">
              <CameraVisionCanvas
                status={selectedStudent.status}
                metrics={selectedStudent.metrics}
                showPrivacyMode={privacyModeEnabled}
                studentName={selectedStudent.name}
                seatNo={selectedStudent.seatNo}
              />
            </div>

            {/* Student Connection & Camera Status Bar */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <span className="text-slate-400">카메라 연동:</span>
                <span className={`font-bold ${selectedStudent.cameraConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedStudent.cameraConnected ? '🟢 정상 연동 라이브' : '🔴 미연동 / 오프라인'}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-slate-400">Google Meet:</span>
                <span className={`font-bold ${selectedStudent.googleMeetConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {selectedStudent.googleMeetConnected ? '🟢 화상 참여 중' : '🟡 미참여'}
                </span>
              </div>
            </div>

            {/* Detailed Real-time Telemetry Metrics */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">눈감음 (EAR)</div>
                <div className="text-sm font-bold text-cyan-400 mt-0.5">{selectedStudent.metrics.ear.toFixed(2)}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">&lt;0.18 수면</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">입모양 (MAR)</div>
                <div className="text-sm font-bold text-rose-400 mt-0.5">{selectedStudent.metrics.mar.toFixed(2)}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">&gt;0.50 떠듦</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">고개 각도</div>
                <div className="text-sm font-bold text-indigo-400 mt-0.5">{selectedStudent.metrics.headPitch}°</div>
                <div className="text-[9px] text-slate-500 mt-0.5">상하 숙임</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">오늘 순공</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">
                  {Math.floor(selectedStudent.focusSeconds / 60)}분
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">몰입률 {Math.round((selectedStudent.focusSeconds / selectedStudent.totalSeconds) * 100)}%</div>
              </div>
            </div>

            {/* Quick Action Presets & Direct Warning */}
            <div className="space-y-2">
              <div className="text-xs text-slate-300 font-medium">원클릭 원격 교사 피드백 전송:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleSendDirectWarning(selectedStudent, '🗣️ [Google Meet 알림] 민수 학생, 수업 중 주변과의 소란/떠듦을 자제해주세요.')}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-rose-900/60 text-rose-300 hover:bg-rose-950/40 text-left font-medium transition-colors"
                >
                  🗣️ 떠듦 주의 경고 발송
                </button>
                <button
                  onClick={() => handleSendDirectWarning(selectedStudent, '😴 [수면 알림] 자리에 바르게 앉아 졸음을 깨고 수업에 집중해주세요.')}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-amber-900/60 text-amber-300 hover:bg-amber-950/40 text-left font-medium transition-colors"
                >
                  😴 수면/졸음 경고 발송
                </button>
              </div>

              <div className="flex space-x-2 pt-1">
                <input
                  type="text"
                  value={directMessageText}
                  onChange={(e) => setDirectMessageText(e.target.value)}
                  placeholder="직접 작성할 원격 지도시 메시지 입력..."
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => handleSendDirectWarning(selectedStudent)}
                  className="flex items-center space-x-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>전송</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Sent Toast Notification */}
      {messageSentToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-emerald-900/90 text-emerald-100 border border-emerald-500 p-4 rounded-2xl shadow-2xl backdrop-blur animate-bounce">
          <div className="text-xs font-bold">{messageSentToast}</div>
        </div>
      )}
    </div>
  );
};
