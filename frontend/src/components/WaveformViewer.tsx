"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { WaveformData } from "@/lib/types";

interface WaveformViewerProps {
  data: WaveformData;
  audioUrl?: string | null;
  isAnalyzing?: boolean;
}

export default function WaveformViewer({ data, audioUrl, isAnalyzing = false }: WaveformViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(data.duration);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [realAmplitudes, setRealAmplitudes] = useState<number[]>(data.amplitudes);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const animationRef = useRef<number | null>(null);

  const hasAudio = !!audioUrl;

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!audioUrl) {
      setRealAmplitudes(data.amplitudes);
      setDuration(data.duration);
      return;
    }

    const decodeAudio = async () => {
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const channelData = audioBuffer.getChannelData(0);
        const barCount = 100;
        const samplesPerBar = Math.floor(channelData.length / barCount);
        const amplitudes: number[] = [];

        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          let count = 0;
          const start = i * samplesPerBar;
          const end = Math.min(start + samplesPerBar, channelData.length);
          const step = Math.max(1, Math.floor((end - start) / 200)); 
          
          for (let j = start; j < end; j += step) {
            sum += Math.abs(channelData[j]);
            count++;
          }
          
          const avg = count > 0 ? sum / count : 0;
          amplitudes.push(Math.min(1, avg * 4));
        }

        const maxAmp = Math.max(...amplitudes, 0.01);
        const normalized = amplitudes.map(a => (a / maxAmp) * 0.9 + 0.1);

        setRealAmplitudes(normalized);
        setDuration(audioBuffer.duration);
        audioContext.close();
      } catch {
        setRealAmplitudes(data.amplitudes);
      }
    };

    decodeAudio();
  }, [audioUrl, data.amplitudes, data.duration]);

  useEffect(() => {
    if (!audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    const audio = new Audio(audioUrl);
    
    setVolume((currentVolume) => {
      audio.volume = currentVolume;
      return currentVolume;
    });
    
    audio.preload = "auto";

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
    });

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setPlayheadPosition(0);
    });

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", () => {});
      audio.removeEventListener("ended", () => {});
    };
  }, [audioUrl]); // Removed `volume` to fix the reset bug

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const barCount = realAmplitudes.length;
    const barWidth = Math.max(2, (width - barCount * 2.5) / barCount);
    const gap = 2.5;

    ctx.clearRect(0, 0, width, height);

    const activeGradient = ctx.createLinearGradient(0, 0, 0, height);
    activeGradient.addColorStop(0, "#38bdf8");
    activeGradient.addColorStop(1, "#34d399");
    const inactiveColor = "rgba(56, 189, 248, 0.18)";

    realAmplitudes.forEach((amp, i) => {
      const x = i * (barWidth + gap);
      const barHeight = amp * (height * 0.75);
      const y = (height - barHeight) / 2;

      const progress = playheadPosition / width;
      const barProgress = i / barCount;

      ctx.fillStyle = barProgress <= progress ? activeGradient : inactiveColor;

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 1.5);
      ctx.fill();
    });

    if (playheadPosition > 0) {
      ctx.beginPath();
      ctx.moveTo(playheadPosition, 4);
      ctx.lineTo(playheadPosition, height - 4);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }, [realAmplitudes, playheadPosition]);

  const tick = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const width = container.getBoundingClientRect().width;

    if (hasAudio && audioRef.current) {
      const time = audioRef.current.currentTime;
      const dur = audioRef.current.duration || duration;
      const progress = Math.min(time / dur, 1);
      
      if (!isDraggingRef.current) {
        setCurrentTime(time);
        setPlayheadPosition(progress * width);
      }

      if (!audioRef.current.paused && !audioRef.current.ended) {
        animationRef.current = requestAnimationFrame(tick);
      }
    }
  }, [hasAudio, duration]);

  const togglePlayback = useCallback(() => {
    if (hasAudio && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          animationRef.current = requestAnimationFrame(tick);
        }).catch(() => {
          setIsPlaying(false);
        });
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  }, [hasAudio, isPlaying, tick]);

  useEffect(() => {
    if (hasAudio) return; // Real audio handles its own playback
    if (!isPlaying || isDragging) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const width = container.getBoundingClientRect().width;
    const startTime = Date.now() - (currentTime / duration) * duration * 1000;

    const mockTick = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);

      setCurrentTime(elapsed >= duration ? duration : elapsed);
      setPlayheadPosition(progress * width);

      if (progress >= 1) {
        setIsPlaying(false);
        setCurrentTime(0);
        setPlayheadPosition(0);
        return;
      }

      animationRef.current = requestAnimationFrame(mockTick);
    };

    animationRef.current = requestAnimationFrame(mockTick);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, duration, currentTime, hasAudio, isDragging]);


  const updatePlayhead = useCallback((e: React.MouseEvent<HTMLCanvasElement>, commitToAudio: boolean) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const progress = x / rect.width;
    setPlayheadPosition(x);
    
    const newTime = progress * duration;
    setCurrentTime(newTime);

    if (commitToAudio && hasAudio && audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  }, [duration, hasAudio]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    isDraggingRef.current = true;
    updatePlayhead(e, true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      updatePlayhead(e, false); // Only update visually, prevents crackling
    }
  };

  const handleMouseUpOrLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      setIsDragging(false);
      isDraggingRef.current = false;
      updatePlayhead(e, true); // Commit the final position to audio playback
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setPlayheadPosition(0);
    if (hasAudio && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  };

  return (
    <div
      id="waveform-viewer"
      className="glass-card-elevated hover:-translate-y-1 group p-5 sm:p-6 relative overflow-hidden h-full flex flex-col"
    >
      {/* Scanning overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-[20px]">
            <div className="text-center space-y-3">
              <div className="mx-auto w-11 h-11 rounded-xl bg-primary-muted flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary animate-pulse">
                  <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm mono-data text-primary animate-pulse-glow tracking-wider">SCANNING AUDIO</p>
            </div>
            <div className="absolute inset-0 scan-line pointer-events-none rounded-[20px]" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary-muted flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-primary">
                <path d="M2 6v4M5 4v8M8 2v12M11 4v8M14 6v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground heading-md">
                Waveform
                {hasAudio && (
                  <span className="ml-2 text-xs text-accent font-normal mono-data">● LIVE</span>
                )}
              </h3>
              <p className="text-sm text-text-muted mono-data">
                {data.sampleRate.toLocaleString()} Hz · {formatTime(duration)}
              </p>
            </div>
          </div>

          <div className="text-sm mono-data text-text-secondary">
            <span className="text-primary">{formatTime(currentTime)}</span>
            <span className="text-text-muted"> / {formatTime(duration)}</span>
          </div>
        </div>

        {/* Canvas */}
        <div ref={containerRef} className="relative h-24 sm:h-32 mb-4 cursor-pointer rounded-xl overflow-hidden bg-surface/50">
          <canvas 
            ref={canvasRef} 
            className="w-full h-full cursor-ew-resize" 
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {/* Play/Pause */}
            <button
              id="waveform-play"
              onClick={togglePlayback}
              className="w-9 h-9 rounded-xl bg-primary-muted hover:bg-primary/15 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-primary">
                  <rect x="3" y="2" width="4" height="12" rx="1" />
                  <rect x="9" y="2" width="4" height="12" rx="1" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-primary ml-0.5">
                  <path d="M4 2l10 6-10 6V2z" />
                </svg>
              )}
            </button>

            {/* Reset */}
            <button
              id="waveform-reset"
              onClick={handleReset}
              className="w-9 h-9 rounded-xl bg-surface-elevated hover:bg-primary-muted flex items-center justify-center transition-all duration-200"
              aria-label="Reset"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="text-text-muted">
                <path d="M2 2v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2.5 9A5.5 5.5 0 107 1.5L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            {/* Volume */}
            {hasAudio && (
              <div className="flex items-center gap-2 ml-2 select-none">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-text-muted flex-shrink-0">
                  <path d="M2 5.5h2l3-3v11l-3-3H2a1 1 0 01-1-1v-3a1 1 0 011-1z" fill="currentColor" />
                  {volume > 0.3 && <path d="M10.5 4.5a4 4 0 010 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />}
                  {volume > 0.6 && <path d="M12.5 2.5a7 7 0 010 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />}
                </svg>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 rounded-full appearance-none bg-surface-elevated cursor-pointer focus:outline-none focus:ring-0 text-transparent caret-transparent
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(56,189,248,0.4)]
                    [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 
                    [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:shadow-[0_0_6px_rgba(56,189,248,0.4)]
                    active:cursor-grabbing [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:active:cursor-grabbing"
                  aria-label="Volume"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-text-muted mono-data">
            {hasAudio ? (
              <span className="px-2 py-0.5 rounded-md bg-accent-muted border border-accent/20 text-accent">AUDIO</span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-surface border border-border">MOCK</span>
            )}
            <span className="px-2 py-0.5 rounded-md bg-surface border border-border">STEREO</span>
            <span className="px-2 py-0.5 rounded-md bg-surface border border-border">16-BIT</span>
          </div>
        </div>
    </div>
  );
}
