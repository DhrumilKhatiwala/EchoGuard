"use client";

import { useMemo } from "react";
import { TimelineSegment } from "@/lib/types";

interface TimelineAnalysisProps {
  segments: TimelineSegment[];
  durationSeconds: number;
}

export default function TimelineAnalysis({ segments, durationSeconds }: TimelineAnalysisProps) {
  const displaySegments = useMemo(() => {
    if (!segments || segments.length === 0 || durationSeconds <= 0) return [];

    // If audio is under 0.10s, create 0.01s slices
    if (durationSeconds < 0.10) {
      const partDuration = 0.01;
      const numParts = Math.max(1, Math.ceil(durationSeconds / partDuration));
      const result: TimelineSegment[] = [];

      for (let i = 0; i < numParts; i++) {
        const start = i * partDuration;
        const end = Math.min(durationSeconds, (i + 1) * partDuration);
        if (start >= durationSeconds) break;

        const nearest = segments.reduce((prev, curr) => 
          Math.abs(curr.start - start) < Math.abs(prev.start - start) ? curr : prev
        );

        result.push({
          start,
          end,
          label: nearest.label,
          human_probability: nearest.human_probability,
          ai_probability: nearest.ai_probability,
        });
      }
      return result;
    }

    // If we already have 10 or fewer segments (e.g. 6 second audio = 6 segments), don't force split into 10! Keep original segments.
    if (segments.length <= 10) {
      return segments;
    }

    // Otherwise (e.g., 300 second audio = 300 segments), group into exactly 10 equal parts
    const numParts = 10;
    const partDuration = durationSeconds / 10;
    const result: TimelineSegment[] = [];

    for (let i = 0; i < numParts; i++) {
      const start = i * partDuration;
      const end = Math.min(durationSeconds, (i + 1) * partDuration);
      if (start >= durationSeconds) break;

      let totalWeight = 0;
      let sumHuman = 0;
      let sumAi = 0;

      for (const seg of segments) {
        if (seg.start < end && seg.end > start) {
          const overlap = Math.min(seg.end, end) - Math.max(seg.start, start);
          if (overlap > 0) {
            sumHuman += seg.human_probability * overlap;
            sumAi += seg.ai_probability * overlap;
            totalWeight += overlap;
          }
        }
      }

      let human_probability = 0.5;
      let ai_probability = 0.5;

      if (totalWeight > 0) {
        human_probability = sumHuman / totalWeight;
        ai_probability = sumAi / totalWeight;
      } else if (segments.length > 0) {
        const nearest = segments.reduce((prev, curr) => 
          Math.abs(curr.start - start) < Math.abs(prev.start - start) ? curr : prev
        );
        human_probability = nearest.human_probability;
        ai_probability = nearest.ai_probability;
      }

      let label: "Human-like" | "Suspicious" | "Neutral" = "Neutral";
      if (human_probability > 0.70) {
        label = "Human-like";
      } else if (ai_probability > 0.70) {
        label = "Suspicious";
      }

      result.push({
        start,
        end,
        label,
        human_probability,
        ai_probability,
      });
    }

    return result;
  }, [segments, durationSeconds]);

  const formatTime = (seconds: number) => {
    if (durationSeconds < 1) {
      return `${seconds.toFixed(2)}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-card-elevated group p-5 sm:p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h3 className="text-base font-semibold heading-md text-foreground">Timeline Analysis</h3>
      </div>
      
      <p className="text-base text-text-muted mb-4">
        Highlights regions of the audio where synthetic patterns or organic speech are most prominent.
      </p>

      {/* Timeline Bar */}
      <div className="relative h-6 rounded-md flex bg-surface-elevated group w-full">
        {displaySegments.map((segment, idx) => {
          const widthPercent = ((segment.end - segment.start) / durationSeconds) * 100;
          const isSuspicious = segment.label === "Suspicious";
          const isNeutral = segment.label === "Neutral";
          
          let bgColor = 'bg-accent/80';
          if (isSuspicious) bgColor = 'bg-danger/80';
          if (isNeutral) bgColor = 'bg-white/10';

          return (
            <div 
              key={idx}
              className={`h-full relative group/segment transition-opacity hover:opacity-80 cursor-pointer first:rounded-l-md last:rounded-r-md ${bgColor}`}
              style={{ width: `${widthPercent}%` }}
            >
              {/* Optional: Add inner border lines to distinguish segments clearly */}
              {idx > 0 && <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-background/50" />}
              
              {/* Tooltip on hover (Custom) */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-surface-elevated border border-border px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover/segment:opacity-100 transition-opacity z-50 pointer-events-none shadow-xl flex flex-col gap-1">
                <span className="mono-data font-semibold text-foreground border-b border-border/50 pb-1 mb-0.5">
                  {formatTime(segment.start)}–{formatTime(segment.end)}
                </span>
                <span className="text-accent">
                  Human Prob: {(segment.human_probability * 100).toFixed(1)}%
                </span>
                <span className="text-danger">
                  AI Prob: {(segment.ai_probability * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm text-text-muted mono-data">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-accent/80" />
          <span>Human-like</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-white/10" />
          <span>Neutral</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-danger/80" />
          <span>Suspicious</span>
        </div>
      </div>
    </div>
  );
}
