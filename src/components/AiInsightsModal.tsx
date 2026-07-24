import React, { useState, useEffect } from 'react';
import { Sparkles, X, RefreshCw, CheckCircle2, Bot, AlertCircle } from 'lucide-react';

interface AiInsightsModalProps {
  mode: string;
  focusTimeSeconds: number;
  totalTimeSeconds: number;
  drowsinessCount: number;
  distractionCount: number;
  peakHours: string;
  onClose: () => void;
}

export const AiInsightsModal: React.FC<AiInsightsModalProps> = ({
  mode,
  focusTimeSeconds,
  totalTimeSeconds,
  drowsinessCount,
  distractionCount,
  peakHours,
  onClose,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [insightText, setInsightText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/gemini/report-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          focusTimeSeconds,
          totalTimeSeconds,
          drowsinessCount,
          distractionCount,
          peakHours,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'AI 리포트 생성에 실패했습니다.');
      }
      setInsightText(data.insightText);
    } catch (err: any) {
      setError(err.message || '서버 통신 실패');
      // Fallback response for offline preview
      setInsightText(`### 🌟 StudyFlow AI 학습 몰입 코칭 분석 리포트

**[오늘의 몰입도 총평]**
오늘 총 ${Math.floor(totalTimeSeconds / 3600)}시간 중 **${Math.floor(focusTimeSeconds / 3600)}시간 ${(focusTimeSeconds % 3600) / 60}분** 동안 뛰어난 집중력을 유지하셨습니다 (몰입율 **${Math.round((focusTimeSeconds / totalTimeSeconds) * 100)}%**). 특히 시선과 고개의 상체 각도가 매우 안정적으로 유지되었습니다.

**[비전 AI 자세 & 눈감음 분석]**
- **시선 및 고개 각도**: ${peakHours} 시간대에 고개 각도(Pitch)가 가장 표준 범위를 유지하여 최적의 학습 효율을 보였습니다.
- **졸음 관리**: 야자 후반부(21시 이후) 눈감음 비율(EAR)이 0.18 이하로 떨어지는 현상이 감지되었습니다.

**[내일 학습 효과 극대화를 위한 AI 팁 3가지]**
1. **21시 10분 전 가벼운 스트레칭**: 졸음 감지 타이밍 5분 전 전신 관절 이완으로 집중력을 재충전하세요.
2. **시선 높이 모니터/책 받침대 조정**: 고개 Pitch 각도를 10° 이상 유지하면 졸음 유발을 40% 차단할 수 있습니다.
3. **스마트폰 거리 두기**: 손 좌표 근처에 휴대폰을 두지 않는 환경 설정으로 몰입 흐름을 이어나가세요.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">StudyFlow Gemini AI 학습 리포트</h3>
              <p className="text-xs text-slate-400">실시간 비전 데이터 연동 맞춤형 코칭 어드바이저</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 text-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-sm font-medium text-slate-300">
              Gemini AI가 오늘의 비전 몰입 시퀀스를 분석 중입니다...
            </p>
            <p className="text-xs text-slate-500">시선(Gaze), EAR(눈감음), 상체 관절 데이터를 종합하고 있습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-amber-950/40 border border-amber-800 rounded-xl text-xs text-amber-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error} (AI 시뮬레이션 리포트를 표시합니다)</span>
              </div>
            )}

            <div className="p-5 bg-slate-950 rounded-xl border border-slate-800/80 text-sm text-slate-200 leading-relaxed space-y-3 whitespace-pre-wrap font-sans">
              {insightText}
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={fetchInsights}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>다시 분석</span>
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                확인 완료
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
