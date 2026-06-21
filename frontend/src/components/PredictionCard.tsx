"use client";

import { useEffect, useState, useRef } from "react";
import { AnalysisResult, Verdict } from "@/lib/types";

interface PredictionCardProps {
  result: AnalysisResult;
  visible?: boolean;
}

const verdictConfig: Record<
  Verdict,
  { label: string; color: string; bgColor: string; ringColor: string; icon: string }
> = {
  authentic: {
    label: "LIKELY HUMAN",
    color: "text-accent",
    bgColor: "bg-accent-muted",
    ringColor: "#34d399",
    icon: "M10 16l4 4 8-8",
  },
  deepfake: {
    label: "LIKELY AI GENERATED",
    color: "text-danger",
    bgColor: "bg-danger-muted",
    ringColor: "#f43f5e",
    icon: "M12 9v4M12 17h.01",
  },
  suspicious: {
    label: "SUSPICIOUS",
    color: "text-warning",
    bgColor: "bg-warning-muted",
    ringColor: "#fbbf24",
    icon: "M12 9v4M12 17h.01",
  },
};

function AnimatedCounter({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased * 10) / 10);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [target, duration]);

  return <>{count.toFixed(1)}</>;
}

function ConfidenceRing({ confidence, verdict }: { confidence: number; verdict: Verdict }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);
  const strokeColor = verdictConfig[verdict].ringColor;

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - confidence * circumference);
    }, 300);
    return () => clearTimeout(timer);
  }, [confidence, circumference]);

  return (
    <div className="relative w-32 h-32 sm:w-36 sm:h-36 mx-auto mb-6">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
        <circle
          cx="60" cy="60" r={radius} fill="none"
          stroke={strokeColor} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
            filter: `drop-shadow(0 0 8px ${strokeColor}40)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold heading-md" style={{ color: strokeColor }}>
          <AnimatedCounter target={confidence * 100} />%
        </span>
        <span className="text-xs text-text-muted uppercase tracking-[0.2em] mt-1">
          Confidence
        </span>
      </div>
    </div>
  );
}

const getConfidenceLevel = (confidence: number) => {
  if (confidence >= 0.95) return { text: "Very High", color: "text-accent" };
  if (confidence >= 0.85) return { text: "High", color: "text-[#38bdf8]" };
  if (confidence >= 0.70) return { text: "Medium", color: "text-warning" };
  return { text: "Low", color: "text-danger" };
};

export default function PredictionCard({ result, visible = true }: PredictionCardProps) {
  const config = verdictConfig[result.verdict];
  const [show, setShow] = useState(false);
  const confidenceData = getConfidenceLevel(result.confidence);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setShow(true), 100);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      id="prediction-card"
      className={`glass-card-elevated hover:-translate-y-1 group p-5 sm:p-6 transition-all duration-700 h-full ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
        {/* Horizontal Layout: Ring on left, details on right */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-8 border-b border-border/50 pb-8">
          <ConfidenceRing confidence={result.confidence} verdict={result.verdict} />
          
          <div className="flex-1 w-full space-y-6">
            <div
              id="verdict-badge"
              className={`px-6 py-3 rounded-xl ${config.bgColor} ${config.color} text-lg font-bold tracking-[0.1em] text-center w-full flex items-center justify-center gap-2`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path d={config.icon} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {config.label}
            </div>

            {/* Human vs AI Probability */}
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Human Probability</span>
                <span className="mono-data font-semibold text-accent">{(result.human_probability * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent transition-all duration-1000 ease-out rounded-full"
                  style={{ width: `${result.human_probability * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm pt-2">
                <span className="text-text-muted">AI Probability</span>
                <span className="mono-data font-semibold text-danger">{(result.ai_probability * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                <div 
                  className="h-full bg-danger transition-all duration-1000 ease-out rounded-full"
                  style={{ width: `${result.ai_probability * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Detection Confidence Label */}
        <div className="flex flex-col border border-border bg-surface-elevated/50 p-4 rounded-xl mb-8">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-text-muted uppercase tracking-wider font-semibold">
              Detection Confidence
            </span>
            <span className={`font-bold ${confidenceData.color}`}>
              {confidenceData.text}
            </span>
          </div>
          <div className="text-sm text-text-muted/70">
            Based on neural network confidence thresholds.
          </div>
        </div>

        {/* Spectrogram Render */}
        {result.spectrogramImage && (
          <div className="mt-8 border-t border-border/50 pt-8">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <span className="text-base font-medium text-foreground block">Mel Spectrogram</span>
                <span className="text-sm text-text-muted">Visual representation of frequency energy over time.</span>
              </div>
            </div>
            <div 
              className="w-full h-32 sm:h-40 rounded-xl overflow-hidden bg-surface-elevated border border-surface flex items-center justify-center group/spec relative"
              title="Brighter colors indicate stronger frequency components."
            >
              <img 
                src={result.spectrogramImage} 
                alt="Mel Spectrogram" 
                className="w-full h-full object-cover mix-blend-screen"
                draggable={false}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-border flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-sm text-text-muted mono-data">
          <span>{result.duration}</span>
          <span className="text-border hidden sm:inline">·</span>
          <span>{result.fileSize}</span>
          <span className="text-border hidden sm:inline">·</span>
          <span>{new Date(result.timestamp).toLocaleString()}</span>
        </div>
    </div>
  );
}
