/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppMode } from './types';
import { Header } from './components/Header';
import { StudentMode } from './components/StudentMode';
import { TeacherMode } from './components/TeacherMode';
import { PersonalMode } from './components/PersonalMode';
import { ShieldCheck, Activity } from 'lucide-react';

export default function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>('student');
  const [cameraActive, setCameraActive] = useState<boolean>(true);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Main Navigation Header */}
      <Header
        currentMode={currentMode}
        onSelectMode={(mode) => setCurrentMode(mode)}
        cameraActive={cameraActive}
        onToggleCamera={() => setCameraActive(!cameraActive)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentMode === 'student' && <StudentMode />}
        {currentMode === 'teacher' && <TeacherMode />}
        {currentMode === 'personal' && <PersonalMode />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>StudyFlow AI Vision System • Privacy-by-Design Architecture Protected</span>
          </div>

          <div className="flex items-center space-x-4 text-slate-500">
            <span>Google Meet & MediaPipe Vision Integration</span>
            <span>•</span>
            <span>Gemini 3.6 Flash AI Advisor</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
