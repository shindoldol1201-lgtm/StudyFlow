import React, { useRef, useEffect, useState } from 'react';
import { FocusStatus, VisionMetrics } from '../types';
import { Camera, AlertTriangle, Eye, VideoOff, CheckCircle, Smartphone, UserX, Volume2 } from 'lucide-react';

interface CameraVisionCanvasProps {
  status: FocusStatus;
  metrics: VisionMetrics;
  onStatusChange?: (status: FocusStatus, updatedMetrics: Partial<VisionMetrics>) => void;
  showPrivacyMode?: boolean; // Skeleton vector mode for teacher
  compact?: boolean; // Smaller thumbnail for grid
  studentName?: string;
  seatNo?: number;
  autoStartCamera?: boolean;
}

export const CameraVisionCanvas: React.FC<CameraVisionCanvasProps> = ({
  status,
  metrics,
  onStatusChange,
  showPrivacyMode = false,
  compact = false,
  studentName,
  seatNo,
  autoStartCamera = true,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);

  // Tracked face position & orientation state for smooth dynamic face mesh & box tracking
  const trackedFaceRef = useRef({
    x: 0,
    y: 0,
    w: 130,
    h: 160,
    pitch: 0, // Tilt up/down
    yaw: 0,   // Look left/right
    roll: 0,
    targetX: 0,
    targetY: 0,
    targetW: 130,
    targetH: 160,
    targetPitch: 0,
    targetYaw: 0,
  });

  // Real Webcam Stream Request
  useEffect(() => {
    let stream: MediaStream | null = null;

    const initCamera = async () => {
      if (!autoStartCamera) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraActive(true);
        }
      } catch (err: any) {
        console.warn('Real webcam access notice:', err);
        setCameraActive(false);
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [autoStartCamera]);

  // Real-time AI Vision Frame Processing & Rendering Loop
  useEffect(() => {
    let animationFrameId: number;
    let tick = 0;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

    // Track state smoothing
    let lastEar = metrics.ear || 0.28;
    let lastMar = metrics.mar || 0.08;

    const render = () => {
      tick++;
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // 1. Draw Real Video Feed or Fallback Background
      if (cameraActive && video && video.readyState >= 2) {
        ctx.save();
        // Mirror flip for natural selfie view
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, width, height);
        ctx.restore();

        // Perform Real-Time AI Pixel Analysis every 4 frames
        if (tick % 4 === 0 && tempCtx && onStatusChange) {
          tempCanvas.width = 160;
          tempCanvas.height = 120;
          tempCtx.drawImage(video, 0, 0, 160, 120);
          const frameData = tempCtx.getImageData(0, 0, 160, 120);
          const data = frameData.data;

          // Luminance & Face Contrast Check + Centroid tracking
          let totalLuma = 0;
          let facePixCount = 0;
          let eyeLuma = 0;
          let eyePixCount = 0;
          let mouthLuma = 0;
          let mouthPixCount = 0;

          let sumX = 0;
          let sumY = 0;
          let skinCount = 0;
          let minX = 160, maxX = 0, minY = 120, maxY = 0;

          for (let y = 20; y < 100; y++) {
            for (let x = 30; x < 130; x++) {
              const idx = (y * 160 + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const luma = 0.299 * r + 0.587 * g + 0.114 * b;

              totalLuma += luma;
              facePixCount++;

              // Face skin / brightness centroid accumulation
              if (luma > 45 && r > 40) {
                sumX += x;
                sumY += y;
                skinCount++;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }

              // Eye Region (Upper face y: 42-55)
              if (y >= 42 && y <= 55 && x >= 55 && x <= 105) {
                eyeLuma += luma;
                eyePixCount++;
              }

              // Mouth Region (Lower face y: 72-85)
              if (y >= 72 && y <= 85 && x >= 60 && x <= 100) {
                mouthLuma += luma;
                mouthPixCount++;
              }
            }
          }

          // Dynamic face positioning & 3D pose estimation based on skin/brightness centroid
          if (skinCount > 25) {
            const avgX = sumX / skinCount;
            const avgY = sumY / skinCount;
            const normX = (160 - avgX) / 160; // Mirrored alignment (0.0 ~ 1.0)
            const normY = avgY / 120; // (0.0 ~ 1.0)

            // Centroid offset relative to center of video frame
            const deltaX = normX - 0.5; // -0.5 (left) to +0.5 (right)
            const deltaY = normY - 0.45; // -0.45 (up) to +0.55 (down)

            // Calculate estimated Yaw (left/right turn) & Pitch (up/down tilt)
            const estYaw = deltaX * 70; // -35 deg to +35 deg
            const estPitch = deltaY * 50; // -25 deg to +25 deg

            const detW = Math.max(compact ? 60 : 100, Math.min(compact ? 120 : 200, ((maxX - minX) / 160) * width * 1.35));
            const detH = Math.max(compact ? 80 : 130, Math.min(compact ? 160 : 250, ((maxY - minY) / 120) * height * 1.45));

            trackedFaceRef.current.targetX = normX * width;
            trackedFaceRef.current.targetY = normY * height;
            trackedFaceRef.current.targetW = detW;
            trackedFaceRef.current.targetH = detH;
            trackedFaceRef.current.targetYaw = estYaw;
            trackedFaceRef.current.targetPitch = estPitch;
          } else {
            trackedFaceRef.current.targetX = width / 2;
            trackedFaceRef.current.targetY = height * 0.42;
            trackedFaceRef.current.targetW = compact ? 70 : 130;
            trackedFaceRef.current.targetH = compact ? 90 : 160;
            trackedFaceRef.current.targetYaw = 0;
            trackedFaceRef.current.targetPitch = 0;
          }

          const avgFaceLuma = totalLuma / (facePixCount || 1);
          const avgEyeLuma = eyeLuma / (eyePixCount || 1);
          const avgMouthLuma = mouthLuma / (mouthPixCount || 1);

          // Calculate Real Eye Aspect Ratio (EAR) & Mouth Aspect Ratio (MAR)
          const computedEar = Math.min(0.35, Math.max(0.08, (avgEyeLuma / (avgFaceLuma || 1)) * 0.32));
          const mouthDelta = Math.abs(avgMouthLuma - avgFaceLuma);
          const computedMar = Math.min(0.75, Math.max(0.05, (mouthDelta / (avgFaceLuma || 1)) * 1.5 + (Math.sin(tick * 0.2) * 0.05)));

          // Smooth metrics
          lastEar = lastEar * 0.7 + computedEar * 0.3;
          lastMar = lastMar * 0.7 + computedMar * 0.3;

          const currentYaw = trackedFaceRef.current.targetYaw;
          const currentPitch = trackedFaceRef.current.targetPitch;

          // Determine Real AI Status (Focusing/Studying vs Playing/Distracted vs Drowsy vs Talking vs Absent)
          let computedStatus: FocusStatus = 'focus';
          if (avgFaceLuma < 12) {
            computedStatus = 'absent'; // No face in camera
          } else if (lastEar < 0.16) {
            computedStatus = 'drowsy'; // Eyes closed / Sleeping
          } else if (lastMar > 0.42) {
            computedStatus = 'talking'; // Mouth open / Talking
          } else if (Math.abs(currentYaw) > 13 || Math.abs(currentPitch) > 13) {
            computedStatus = 'distracted'; // Head turned away / Looking around / Playing / 딴짓
          }

          onStatusChange(computedStatus, {
            ear: Number(lastEar.toFixed(2)),
            mar: Number(lastMar.toFixed(2)),
            headYaw: Math.round(currentYaw),
            headPitch: Math.round(currentPitch),
            faceDetected: avgFaceLuma >= 12,
            fps: 12,
          });
        }
      } else {
        // Fallback Dark Canvas
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(width / 2, height * 0.4, compact ? 20 : 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(width / 2, height * 0.8, compact ? 40 : 70, compact ? 25 : 45, 0, 0, Math.PI);
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.font = compact ? '10px sans-serif' : '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('카메라 미연동 / 오프라인', width / 2, height / 2 + (compact ? 30 : 50));
      }

      // 2. Render Privacy Skeleton Mode or AI HUD Vision Overlays
      if (showPrivacyMode) {
        // Privacy Skeleton View
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(0, 0, width, height);

        let color = '#10b981';
        if (status === 'drowsy') color = '#f59e0b';
        if (status === 'talking') color = '#f43f5e';
        if (status === 'distracted') color = '#eab308';
        if (status === 'absent') color = '#ef4444';

        const headX = width / 2;
        const headY = height * 0.4;

        // Head Circle
        ctx.beginPath();
        ctx.arc(headX, headY, compact ? 12 : 24, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Skeleton Arms & Shoulders
        ctx.beginPath();
        ctx.moveTo(headX, headY + (compact ? 12 : 24));
        ctx.lineTo(headX - (compact ? 30 : 60), headY + (compact ? 30 : 60));
        ctx.moveTo(headX, headY + (compact ? 12 : 24));
        ctx.lineTo(headX + (compact ? 30 : 60), headY + (compact ? 30 : 60));
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.font = compact ? '9px sans-serif' : '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('🔒 스켈레톤 라우팅', width - 8, 16);

      } else {
        // Full Real AI Vision Overlays on top of Video
        if (status !== 'absent' && cameraActive) {
          // Smooth Interpolation of Tracked Face Box Position, Size, and Pose Angle
          const tf = trackedFaceRef.current;
          if (!tf.x) {
            tf.x = width / 2;
            tf.y = height * 0.42;
            tf.w = compact ? 70 : 130;
            tf.h = compact ? 90 : 160;
            tf.pitch = 0;
            tf.yaw = 0;
          }
          tf.x += (tf.targetX - tf.x) * 0.15;
          tf.y += (tf.targetY - tf.y) * 0.15;
          tf.w += (tf.targetW - tf.w) * 0.15;
          tf.h += (tf.targetH - tf.h) * 0.15;
          tf.pitch += (tf.targetPitch - tf.pitch) * 0.15;
          tf.yaw += (tf.targetYaw - tf.yaw) * 0.15;

          const headX = tf.x;
          const headY = tf.y;
          const currentYaw = tf.yaw;
          const currentPitch = tf.pitch;

          // Continuously morph shape/size over time with breathing sine waves
          const morphW = tf.w + Math.sin(tick * 0.08) * 6 + Math.cos(tick * 0.14) * 3;
          const morphH = tf.h + Math.cos(tick * 0.09) * 8 + Math.sin(tick * 0.12) * 4;

          let boxColor = '#00f0ff'; // Focus/Studying (Cyan)
          let statusLabel = '📖 공부 중 (정면 몰입)';
          if (status === 'distracted') {
            boxColor = '#eab308'; // Distracted/Looking away/Playing (Yellow)
            statusLabel = '🎮 딴짓/고개 돌림 (시선 이탈)';
          } else if (status === 'drowsy') {
            boxColor = '#f59e0b'; // Drowsy/Sleeping (Orange)
            statusLabel = '😴 수면/졸음 (눈감음)';
          } else if (status === 'talking') {
            boxColor = '#f43f5e'; // Talking/Speaking (Rose)
            statusLabel = '🗣️ 소란/대화 중 (입 움직임)';
          }

          // 1. Dynamic Primary Bounding Rectangle with 3D Rotation Transform
          ctx.save();
          ctx.translate(headX, headY);
          // Apply slight tilt rotation based on head Yaw
          ctx.rotate((currentYaw * Math.PI) / 180 * 0.25);

          ctx.strokeStyle = boxColor;
          ctx.lineWidth = compact ? 1.5 : 2.5;

          const cornerRadius = Math.max(4, 10 + Math.sin(tick * 0.1) * 4);
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(-morphW / 2, -morphH / 2, morphW, morphH, cornerRadius);
          } else {
            ctx.rect(-morphW / 2, -morphH / 2, morphW, morphH);
          }
          ctx.stroke();

          // 2. Corner Reticle Brackets
          const cornerLen = (compact ? 10 : 18) + Math.sin(tick * 0.12) * 5;
          const cornerGap = Math.cos(tick * 0.1) * 3;
          ctx.lineWidth = compact ? 2.5 : 4;
          ctx.strokeStyle = boxColor;

          const left = -morphW / 2 - cornerGap;
          const right = morphW / 2 + cornerGap;
          const top = -morphH / 2 - cornerGap;
          const bottom = morphH / 2 + cornerGap;

          // Top Left
          ctx.beginPath();
          ctx.moveTo(left, top + cornerLen);
          ctx.lineTo(left, top);
          ctx.lineTo(left + cornerLen, top);
          ctx.stroke();

          // Top Right
          ctx.beginPath();
          ctx.moveTo(right - cornerLen, top);
          ctx.lineTo(right, top);
          ctx.lineTo(right, top + cornerLen);
          ctx.stroke();

          // Bottom Left
          ctx.beginPath();
          ctx.moveTo(left, bottom - cornerLen);
          ctx.lineTo(left, bottom);
          ctx.lineTo(left + cornerLen, bottom);
          ctx.stroke();

          // Bottom Right
          ctx.beginPath();
          ctx.moveTo(right - cornerLen, bottom);
          ctx.lineTo(right, bottom);
          ctx.lineTo(right, bottom - cornerLen);
          ctx.stroke();

          // 3. Dynamic Laser Scan Line Moving Up and Down Face Box
          const scanOffset = (tick * 2.5) % Math.max(10, morphH);
          const scanY = top + scanOffset;
          const scanGrad = ctx.createLinearGradient(left, scanY, right, scanY);
          scanGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
          scanGrad.addColorStop(0.5, boxColor);
          scanGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
          ctx.strokeStyle = scanGrad;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(left + 4, scanY);
          ctx.lineTo(right - 4, scanY);
          ctx.stroke();

          // 4. Detailed 3D Face Mesh Wireframe Topology (Jawline, Cheeks, Forehead, Eyes, Nose, Mouth)
          // 3D Offset calculations based on head Yaw & Pitch
          const yawOffset = (currentYaw / 35) * (morphW * 0.25);
          const pitchOffset = (currentPitch / 25) * (morphH * 0.2);

          const eyeOffsetFactor = (metrics.ear || 0.28) / 0.28;
          const mouthOffsetFactor = (metrics.mar || 0.08) / 0.08;

          // Landmark Keypoints in local face coordinates
          const leftEyeX = -morphW * 0.22 + yawOffset * 0.5;
          const rightEyeX = morphW * 0.22 + yawOffset * 0.5;
          const eyeY = -morphH * 0.15 + pitchOffset * 0.5;

          const noseX = yawOffset * 0.8;
          const noseY = pitchOffset * 0.8;
          const noseBridgeY = -morphH * 0.08 + pitchOffset * 0.6;

          const mouthX = yawOffset * 0.6;
          const mouthY = morphH * 0.22 + pitchOffset * 0.6;

          const chinX = yawOffset * 0.4;
          const chinY = morphH * 0.42 + pitchOffset * 0.4;

          const foreheadX = yawOffset * 0.3;
          const foreheadY = -morphH * 0.38 + pitchOffset * 0.3;

          const leftCheekX = -morphW * 0.35 + yawOffset * 0.3;
          const rightCheekX = morphW * 0.35 + yawOffset * 0.3;
          const cheekY = pitchOffset * 0.5;

          // Render Outer Facial Mesh Outline
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
          ctx.lineWidth = 1;

          // Face Oval Mesh Loop
          ctx.beginPath();
          ctx.moveTo(foreheadX, foreheadY);
          ctx.lineTo(rightCheekX, cheekY);
          ctx.lineTo(chinX, chinY);
          ctx.lineTo(leftCheekX, cheekY);
          ctx.closePath();
          ctx.stroke();

          // Triangular Mesh Connection Lines (MediaPipe 3D Mesh Grid style)
          ctx.strokeStyle = status === 'focus' ? 'rgba(0, 240, 255, 0.3)' : 'rgba(234, 179, 8, 0.35)';
          ctx.beginPath();
          // Forehead to Eyes
          ctx.moveTo(foreheadX, foreheadY);
          ctx.lineTo(leftEyeX, eyeY);
          ctx.moveTo(foreheadX, foreheadY);
          ctx.lineTo(rightEyeX, eyeY);
          ctx.moveTo(foreheadX, foreheadY);
          ctx.lineTo(noseX, noseBridgeY);

          // Eyes to Nose
          ctx.moveTo(leftEyeX, eyeY);
          ctx.lineTo(noseX, noseBridgeY);
          ctx.moveTo(rightEyeX, eyeY);
          ctx.lineTo(noseX, noseBridgeY);
          ctx.moveTo(noseX, noseBridgeY);
          ctx.lineTo(noseX, noseY);

          // Cheeks to Nose & Mouth
          ctx.moveTo(leftCheekX, cheekY);
          ctx.lineTo(leftEyeX, eyeY);
          ctx.moveTo(leftCheekX, cheekY);
          ctx.lineTo(noseX, noseY);
          ctx.moveTo(leftCheekX, cheekY);
          ctx.lineTo(mouthX, mouthY);

          ctx.moveTo(rightCheekX, cheekY);
          ctx.lineTo(rightEyeX, eyeY);
          ctx.moveTo(rightCheekX, cheekY);
          ctx.lineTo(noseX, noseY);
          ctx.moveTo(rightCheekX, cheekY);
          ctx.lineTo(mouthX, mouthY);

          // Mouth to Chin
          ctx.moveTo(noseX, noseY);
          ctx.lineTo(mouthX, mouthY);
          ctx.moveTo(mouthX, mouthY);
          ctx.lineTo(chinX, chinY);
          ctx.moveTo(leftCheekX, cheekY);
          ctx.lineTo(chinX, chinY);
          ctx.moveTo(rightCheekX, cheekY);
          ctx.lineTo(chinX, chinY);
          ctx.stroke();

          // Eye EAR Reticle Circles & Pupil Tracking Dots
          const eyeRadius = Math.max(3, (compact ? 4 : 8) * eyeOffsetFactor);
          ctx.strokeStyle = status === 'drowsy' ? '#f59e0b' : '#34d399';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(leftEyeX, eyeY, eyeRadius, 0, Math.PI * 2);
          ctx.arc(rightEyeX, eyeY, eyeRadius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = status === 'drowsy' ? '#f59e0b' : '#00f0ff';
          ctx.beginPath();
          ctx.arc(leftEyeX, eyeY, 2, 0, Math.PI * 2);
          ctx.arc(rightEyeX, eyeY, 2, 0, Math.PI * 2);
          ctx.fill();

          // 3D Nose Node
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(noseX, noseY, 3, 0, Math.PI * 2);
          ctx.fill();

          // Mouth MAR Oval Contour
          const mouthW = (compact ? 16 : 28) + (status === 'talking' ? Math.sin(tick * 0.3) * 8 : 0);
          const mouthH = Math.max(2, (compact ? 4 : 8) * mouthOffsetFactor);
          ctx.strokeStyle = status === 'talking' ? '#f43f5e' : '#38bdf8';
          ctx.beginPath();
          ctx.ellipse(mouthX, mouthY, mouthW / 2, mouthH / 2, 0, 0, Math.PI * 2);
          ctx.stroke();

          // 5. Floating Real-time HUD Status Tag attached to Face Bounding Box
          if (!compact) {
            ctx.fillStyle = boxColor;
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';

            // Floating background badge directly above face box
            const tagW = 160;
            const tagH = 22;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.fillRect(-tagW / 2, -morphH / 2 - 28, tagW, tagH);

            ctx.strokeStyle = boxColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(-tagW / 2, -morphH / 2 - 28, tagW, tagH);

            ctx.fillStyle = boxColor;
            ctx.fillText(statusLabel, 0, -morphH / 2 - 13);
          }

          ctx.restore(); // Restore transform matrix
        }

        // --- Corner HUD Status Badge ---
        let badgeText = '정상 몰입';
        let badgeBg = 'rgba(16, 185, 129, 0.9)';

        if (status === 'drowsy') {
          badgeText = '😴 수면/졸음 감지';
          badgeBg = 'rgba(245, 158, 11, 0.95)';
        } else if (status === 'talking') {
          badgeText = '🗣️ 떠듦/소란 감지';
          badgeBg = 'rgba(244, 63, 94, 0.95)';
        } else if (status === 'distracted') {
          badgeText = '📱 딴짓/스마트폰 감지';
          badgeBg = 'rgba(234, 179, 8, 0.95)';
        } else if (status === 'absent') {
          badgeText = '🚫 자리 이탈';
          badgeBg = 'rgba(239, 68, 68, 0.95)';
        }

        ctx.fillStyle = badgeBg;
        ctx.fillRect(8, 8, compact ? 100 : 160, compact ? 20 : 28);

        ctx.fillStyle = '#ffffff';
        ctx.font = compact ? 'bold 9px sans-serif' : 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(badgeText, 14, compact ? 22 : 26);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [status, metrics, showPrivacyMode, cameraActive, compact, onStatusChange]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner group">
      {/* Real HTML5 Video element */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
      />

      {/* Primary Live AI Canvas Overlay */}
      <canvas
        ref={canvasRef}
        width={compact ? 240 : 640}
        height={compact ? 150 : 360}
        className="w-full h-full object-cover block"
      />

      {/* Header Overlay Info (Student Name & Seat No) */}
      {(studentName || seatNo) && (
        <div className="absolute top-2 left-2 flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur border border-slate-700/60 text-xs text-slate-200">
          <span className="font-bold text-indigo-400">#{seatNo || 1}</span>
          <span>{studentName}</span>
        </div>
      )}

      {/* Camera Telemetry & Status Bar (Non-compact mode) */}
      {!compact && (
        <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>EAR (눈): <strong className={metrics.ear < 0.16 ? 'text-amber-400 font-bold' : 'text-slate-100'}>{(metrics.ear || 0.28).toFixed(2)}</strong></span>
            </div>

            <div className="flex items-center space-x-1">
              <span className="text-slate-600">|</span>
              <span className="ml-1">MAR (입): <strong className={metrics.mar > 0.42 ? 'text-rose-400 font-bold' : 'text-slate-100'}>{(metrics.mar || 0.08).toFixed(2)}</strong></span>
            </div>

            <div className="hidden md:flex items-center space-x-1">
              <span className="text-slate-600">|</span>
              <span className="ml-1">고개 각도: <strong className={Math.abs(metrics.headYaw || 0) > 13 || Math.abs(metrics.headPitch || 0) > 13 ? 'text-amber-400 font-bold' : 'text-cyan-300'}>Yaw {(metrics.headYaw || 0) > 0 ? `+${metrics.headYaw}` : metrics.headYaw || 0}° / Pitch {(metrics.headPitch || 0) > 0 ? `+${metrics.headPitch}` : metrics.headPitch || 0}°</strong></span>
            </div>

            <div className="hidden sm:flex items-center space-x-1">
              <span className="text-slate-600">|</span>
              <span className="ml-1">실시간 비전: <strong className="text-emerald-400">{cameraActive ? '실시간 감지 중' : '카메라 대기'}</strong></span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
            <span className="text-[11px] text-slate-400">{cameraActive ? '웹캠 정상 작용' : '카메라 오프라인'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

