import React, { useRef, useEffect, useState } from 'react';
import { FocusStatus, VisionMetrics } from '../types';
import { Camera, RefreshCw, AlertTriangle, Eye, Shield, Smartphone, UserX, CheckCircle, VideoOff } from 'lucide-react';

interface CameraVisionCanvasProps {
  status: FocusStatus;
  metrics: VisionMetrics;
  onStatusChange?: (status: FocusStatus, updatedMetrics: Partial<VisionMetrics>) => void;
  showPrivacyMode?: boolean; // Skeleton vector mode for teacher
  compact?: boolean; // Smaller thumbnail for grid
  studentName?: string;
  seatNo?: number;
}

export const CameraVisionCanvas: React.FC<CameraVisionCanvasProps> = ({
  status,
  metrics,
  onStatusChange,
  showPrivacyMode = false,
  compact = false,
  studentName,
  seatNo,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [realCameraActive, setRealCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Attempt to open real camera
  const startRealCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setRealCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Real camera stream not available, switching to AI Vision Simulation mode.', err);
      setCameraError('실제 카메라 권한 미승인 또는 기기 미지원 - AI 시뮬레이션 라이브 모드로 동작합니다.');
      setRealCameraActive(false);
    }
  };

  const stopRealCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setRealCameraActive(false);
  };

  // Canvas drawing loop (handles real camera overlay OR interactive canvas rendering)
  useEffect(() => {
    let animationFrameId: number;
    let tick = 0;

    const render = () => {
      tick++;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (showPrivacyMode) {
        // --- Privacy-by-Design Skeleton Vector Rendering ---
        ctx.fillStyle = '#0f172a'; // Dark clean background
        ctx.fillRect(0, 0, width, height);

        // Draw privacy grid pattern
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.2)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 20) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += 20) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        if (status === 'absent') {
          // Absent - render empty chair outline
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(width * 0.25, height * 0.3, width * 0.5, height * 0.6);
          ctx.setLineDash([]);

          ctx.fillStyle = '#f43f5e';
          ctx.font = compact ? '10px sans-serif' : '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('자리 이탈 (Absence)', width / 2, height / 2);
          return;
        }

        // Color based on status
        let strokeColor = '#10b981'; // Green: Focus
        if (status === 'drowsy') strokeColor = '#f59e0b'; // Amber: Drowsy
        if (status === 'distracted') strokeColor = '#eab308'; // Yellow: Distracted

        const centerX = width / 2;
        const centerY = height * 0.45;

        // Animate slight head movement
        const jitterX = status === 'focus' ? Math.sin(tick * 0.05) * 2 : Math.sin(tick * 0.15) * 8;
        const jitterY = status === 'drowsy' ? 18 + Math.sin(tick * 0.02) * 3 : Math.sin(tick * 0.05) * 2;

        const headX = centerX + jitterX;
        const headY = centerY - 30 + jitterY;

        // Draw Head Node
        ctx.beginPath();
        ctx.arc(headX, headY, compact ? 12 : 20, 0, Math.PI * 2);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Gaze Vector line from face
        ctx.beginPath();
        ctx.moveTo(headX, headY);
        const gazeDx = metrics.gazeX * (compact ? 20 : 40);
        const gazeDy = metrics.gazeY * (compact ? 20 : 40) + (status === 'drowsy' ? 25 : 0);
        ctx.lineTo(headX + gazeDx, headY + gazeDy);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Shoulders & Spine Skeleton
        const neckY = headY + (compact ? 15 : 25);
        const shoulderWidth = compact ? 30 : 50;

        ctx.beginPath();
        // Neck to shoulders
        ctx.moveTo(headX, neckY);
        ctx.lineTo(headX - shoulderWidth, neckY + 10);
        ctx.moveTo(headX, neckY);
        ctx.lineTo(headX + shoulderWidth, neckY + 10);
        // Spine
        ctx.moveTo(headX, neckY);
        ctx.lineTo(headX, neckY + (compact ? 40 : 70));

        // Arms
        if (status === 'distracted') {
          // Hand near face/holding phone
          ctx.lineTo(headX - 15, headY + 10);
          // Draw Phone Bounding Box
          ctx.strokeStyle = '#ef4444';
          ctx.strokeRect(headX - 30, headY, 20, 30);
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Privacy indicator
        ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
        ctx.font = compact ? '9px sans-serif' : '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('🔒 스켈레톤 라이브', width - 8, 16);

      } else {
        // --- Full AI Camera View with HUD Overlay ---
        if (!realCameraActive) {
          // Draw simulated camera background (classroom / desk atmosphere)
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(0, 0, width, height);

          // Simulated person portrait silhouette
          ctx.fillStyle = '#334155';
          if (status !== 'absent') {
            const headY = status === 'drowsy' ? height * 0.45 : height * 0.35;
            // Head
            ctx.beginPath();
            ctx.arc(width / 2, headY, compact ? 25 : 45, 0, Math.PI * 2);
            ctx.fill();
            // Shoulders
            ctx.beginPath();
            ctx.ellipse(width / 2, headY + (compact ? 50 : 90), compact ? 45 : 80, compact ? 30 : 50, 0, 0, Math.PI);
            ctx.fill();
          }
        }

        // --- Draw MediaPipe Landmarks & Mesh Overlay ---
        if (status !== 'absent') {
          const headY = status === 'drowsy' ? height * 0.45 : height * 0.35;
          const headX = width / 2;

          // 1. Face Mesh Keypoints (Eye, Nose, Lips contours)
          ctx.fillStyle = status === 'talking' ? '#f43f5e' : '#00f0ff';
          const meshPoints = [
            { x: headX - 15, y: headY - 10 }, // Left Eye
            { x: headX + 15, y: headY - 10 }, // Right Eye
            { x: headX, y: headY }, // Nose
            { x: headX - 12, y: headY + 16 }, // Left Mouth
            { x: headX + 12, y: headY + 16 }, // Right Mouth
          ];

          meshPoints.forEach((pt) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, compact ? 2 : 3, 0, Math.PI * 2);
            ctx.fill();
          });

          // 2. EAR Eye Aspect Ratio Mesh Contour Box
          ctx.strokeStyle = status === 'drowsy' ? '#f59e0b' : '#10b981';
          ctx.lineWidth = 1.5;

          // Left Eye Box
          const eyeWidth = compact ? 12 : 24;
          const eyeHeight = (compact ? 6 : 12) * ((metrics.ear || 0.28) / 0.28);
          ctx.strokeRect(headX - 25, headY - 15, eyeWidth, eyeHeight);
          // Right Eye Box
          ctx.strokeRect(headX + 5, headY - 15, eyeWidth, eyeHeight);

          // 2b. MAR Mouth Aspect Ratio (Talking/Chatting contour)
          const mouthOpen = status === 'talking' ? 12 + Math.sin(tick * 0.3) * 6 : 4;
          ctx.strokeStyle = status === 'talking' ? '#f43f5e' : '#0ea5e9';
          ctx.lineWidth = status === 'talking' ? 2 : 1;
          ctx.strokeRect(headX - 14, headY + 12, 28, mouthOpen);

          if (status === 'talking') {
            // Draw speech wave arcs next to mouth
            ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)';
            ctx.beginPath();
            ctx.arc(headX + 22, headY + 15, 8 + (tick % 10), -Math.PI / 3, Math.PI / 3);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(headX + 26, headY + 15, 14 + (tick % 10), -Math.PI / 3, Math.PI / 3);
            ctx.stroke();
          }

          // 3. Eye Gaze Ray Vector
          ctx.beginPath();
          ctx.moveTo(headX, headY - 10);
          const dx = metrics.gazeX * (compact ? 30 : 70);
          const dy = metrics.gazeY * (compact ? 30 : 70) + (status === 'drowsy' ? 35 : 0);
          ctx.lineTo(headX + dx, headY - 10 + dy);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Arrow tip on gaze vector
          ctx.beginPath();
          ctx.arc(headX + dx, headY - 10 + dy, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();

          // 4. Smartphone / Hand Object Bounding Box
          if (status === 'distracted' || metrics.phoneObjectDetected) {
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            const bboxX = headX + (compact ? 20 : 40);
            const bboxY = headY + (compact ? 10 : 20);
            ctx.strokeRect(bboxX, bboxY, compact ? 30 : 50, compact ? 45 : 75);

            ctx.fillStyle = '#ef4444';
            ctx.font = compact ? '9px sans-serif' : '11px sans-serif';
            ctx.fillText('📱 Phone (98%)', bboxX, bboxY - 4);
          }
        }

        // --- Corner Status Badge ---
        let badgeText = '몰입 중';

        if (status === 'drowsy') {
          badgeText = '수면/졸음 (EAR 0.12)';
        } else if (status === 'talking') {
          badgeText = '🗣️ 떠듦/소란 (MAR 0.65)';
        } else if (status === 'distracted') {
          badgeText = '스마트폰 딴짓 감지';
        } else if (status === 'absent') {
          badgeText = '자리 이탈 (5s+)';
        }

        // Draw HUD overlay text
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(8, 8, compact ? 120 : 200, compact ? 22 : 32);

        ctx.fillStyle = status === 'focus' ? '#34d399' : (status === 'drowsy' ? '#fbbf24' : (status === 'talking' ? '#f43f5e' : '#f87171'));
        ctx.font = compact ? 'bold 10px sans-serif' : 'bold 12px sans-serif';
        ctx.fillText(`AI Vision: ${badgeText}`, 14, compact ? 22 : 28);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [status, metrics, showPrivacyMode, realCameraActive, compact]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner group">
      {/* Real HTML5 Video element (hidden, rendered onto canvas) */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
      />

      {/* Primary HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        width={compact ? 240 : 640}
        height={compact ? 150 : 360}
        className="w-full h-full object-cover block"
      />

      {/* Header Overlay Info (Student Name & Seat No if provided) */}
      {(studentName || seatNo) && (
        <div className="absolute top-2 left-2 flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur border border-slate-700/60 text-xs text-slate-200">
          <span className="font-bold text-indigo-400">#{seatNo || 1}</span>
          <span>{studentName}</span>
        </div>
      )}

      {/* Camera Source Switcher & Metric Telemetry (Non-compact mode) */}
      {!compact && (
        <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
          {/* Metrics Telemetry Pill */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1" title="Eye Aspect Ratio">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>EAR: <strong className={metrics.ear < 0.18 ? 'text-amber-400' : 'text-slate-100'}>{metrics.ear.toFixed(2)}</strong></span>
            </div>
            <div className="hidden sm:flex items-center space-x-1" title="Gaze Offset">
              <span className="text-slate-500">|</span>
              <span>Gaze: <strong className="text-slate-100">X:{metrics.gazeX.toFixed(1)} Y:{metrics.gazeY.toFixed(1)}</strong></span>
            </div>
            <div className="hidden md:flex items-center space-x-1" title="Processing Speed">
              <span className="text-slate-500">|</span>
              <span>FPS: <strong className="text-emerald-400">{metrics.fps}</strong></span>
            </div>
          </div>

          {/* Camera Hardware Mode Toggle */}
          <div className="flex items-center space-x-2">
            {!realCameraActive ? (
              <button
                onClick={startRealCamera}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-indigo-600/80 hover:bg-indigo-600 text-white transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>실제 웹캠 연결</span>
              </button>
            ) : (
              <button
                onClick={stopRealCamera}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-rose-600/80 hover:bg-rose-600 text-white transition-colors"
              >
                <VideoOff className="w-3.5 h-3.5" />
                <span>시뮬레이터 전환</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Interactive Status Simulation Buttons Bar (Allows testing Detection Logic Matrix live) */}
      {!compact && onStatusChange && (
        <div className="p-2.5 bg-slate-900 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
            <span>🧪 AI 감지 테스트 시뮬레이터 (Detection Matrix Live Trigger)</span>
            <span className="text-indigo-400">상태 선택 시 실시간 오버레이 반영</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            <button
              onClick={() =>
                onStatusChange('focus', {
                  ear: 0.28,
                  mar: 0.08,
                  gazeX: 0.02,
                  gazeY: 0.01,
                  phoneObjectDetected: false,
                  skeletonVisible: true,
                  headPitch: 4,
                })
              }
              className={`flex items-center justify-center space-x-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                status === 'focus'
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>몰입 (Focus)</span>
            </button>

            <button
              onClick={() =>
                onStatusChange('drowsy', {
                  ear: 0.12,
                  mar: 0.05,
                  gazeX: 0.05,
                  gazeY: 0.6,
                  phoneObjectDetected: false,
                  skeletonVisible: true,
                  headPitch: 35,
                })
              }
              className={`flex items-center justify-center space-x-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                status === 'drowsy'
                  ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>수면/졸음 (EAR 0.12)</span>
            </button>

            <button
              onClick={() =>
                onStatusChange('talking', {
                  ear: 0.26,
                  mar: 0.68,
                  gazeX: 0.35,
                  gazeY: 0.1,
                  phoneObjectDetected: false,
                  skeletonVisible: true,
                  headYaw: 25,
                })
              }
              className={`flex items-center justify-center space-x-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                status === 'talking'
                  ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="text-sm">🗣️</span>
              <span>떠듦/소란 (MAR 0.68)</span>
            </button>

            <button
              onClick={() =>
                onStatusChange('distracted', {
                  ear: 0.26,
                  mar: 0.08,
                  gazeX: 0.75,
                  gazeY: -0.5,
                  phoneObjectDetected: true,
                  skeletonVisible: true,
                  handNearFace: true,
                })
              }
              className={`flex items-center justify-center space-x-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                status === 'distracted'
                  ? 'bg-yellow-600 text-slate-900 ring-2 ring-yellow-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-yellow-400" />
              <span>스마트폰 딴짓</span>
            </button>

            <button
              onClick={() =>
                onStatusChange('absent', {
                  ear: 0.0,
                  mar: 0.0,
                  skeletonVisible: false,
                  phoneObjectDetected: false,
                })
              }
              className={`flex items-center justify-center space-x-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                status === 'absent'
                  ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <UserX className="w-3.5 h-3.5 text-rose-400" />
              <span>자리 이탈</span>
            </button>
          </div>
        </div>
      )}

      {cameraError && (
        <div className="p-2 bg-amber-950/80 border-t border-amber-800/80 text-[11px] text-amber-300 flex items-center space-x-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}
    </div>
  );
};
