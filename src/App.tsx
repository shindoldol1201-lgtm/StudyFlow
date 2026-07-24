import React, { useState, useEffect } from 'react';
import { AppMode, UserProfile } from './types';
import { Header } from './components/Header';
import { StudentMode } from './components/StudentMode';
import { TeacherMode } from './components/TeacherMode';
import { PersonalMode } from './components/PersonalMode';
import { AuthModal } from './components/AuthModal';
import { ShieldCheck, Video } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<AppMode>('student');
  const [cameraActive, setCameraActive] = useState<boolean>(true);

  // Load saved user on initial load
  useEffect(() => {
    const saved = localStorage.getItem('studyflow_user');
    if (saved) {
      try {
        const user: UserProfile = JSON.parse(saved);
        setCurrentUser(user);
        setCurrentMode(user.role as AppMode);
      } catch (e) {
        setIsAuthOpen(true);
      }
    } else {
      setIsAuthOpen(true);
    }
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentMode(user.role as AppMode);
    setIsAuthOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('studyflow_user');
    setCurrentUser(null);
    setIsAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Main Navigation Header */}
      <Header
        currentMode={currentMode}
        onSelectMode={(mode) => setCurrentMode(mode)}
        cameraActive={cameraActive}
        onToggleCamera={() => setCameraActive(!cameraActive)}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentMode === 'student' && <StudentMode currentUser={currentUser} onLogout={handleLogout} />}
        {currentMode === 'teacher' && <TeacherMode currentUser={currentUser} />}
        {currentMode === 'personal' && <PersonalMode />}
      </main>

      {/* Login / Registration Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onLoginSuccess={handleLoginSuccess}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>StudyFlow Real AI Vision System</span>
          </div>

          <div className="flex items-center space-x-4 text-slate-500">
            <span>Live Camera AI Face Mesh</span>
            <span>•</span>
            <span>Gemini 3.6 Flash Advisor</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
