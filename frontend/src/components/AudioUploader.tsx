"use client";

import { useState, useCallback, useRef } from "react";
import { UploadState } from "@/lib/types";

interface AudioUploaderProps {
  onUploadComplete?: (file: File) => void;
}

const ACCEPTED_TYPES = [".wav", ".mp3", ".flac", ".ogg", ".m4a"];
const MAX_FILE_SIZE = 50 * 1024 * 1024;

function AudioUploadIcon({ status }: { status: "idle" | "uploading" | "processing" | "complete" | "error" }) {
  if (status === "uploading") {
    return (
      <div className="mx-auto w-12 h-12 flex items-center justify-center mb-3">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-primary animate-bounce">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" opacity="0.5" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
    );
  }

  if (status === "processing") {
    return (
      <div className="mx-auto w-12 h-12 flex items-center justify-center mb-3">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-accent animate-spin" style={{ animationDuration: "2s" }}>
          <circle cx="12" cy="12" r="10" strokeDasharray="16 16" />
          <path d="M12 8v4l2 2" />
        </svg>
      </div>
    );
  }

  if (status === "complete") {
    return (
      <div className="mx-auto w-12 h-12 flex items-center justify-center mb-3">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
          <circle cx="12" cy="12" r="10" opacity="0.2" fill="currentColor" />
          <path d="M16 10l-5.5 5.5L8 13" />
        </svg>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto w-12 h-12 flex items-center justify-center mb-3">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
          <circle cx="12" cy="12" r="10" opacity="0.2" fill="currentColor" />
          <path d="M15 9l-6 6m0-6l6 6" />
        </svg>
      </div>
    );
  }

  return (
    <div className="mx-auto w-12 h-12 flex items-center justify-center mb-3 transition-transform duration-300 group-hover:-translate-y-1">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    </div>
  );
}

export default function AudioUploader({ onUploadComplete }: AudioUploaderProps) {
  const [state, setState] = useState<UploadState>({
    status: "idle",
    progress: 0,
    file: null,
  });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const validateFile = (file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext)) {
      return `Invalid file type. Accepted: ${ACCEPTED_TYPES.join(", ")}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File too large. Maximum size is 50 MB.";
    }
    return null;
  };

  const simulateUpload = useCallback(
    (file: File) => {
      setState({ status: "uploading", progress: 0, file });

      let progress = 0;
      const uploadInterval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(uploadInterval);
          setState({ status: "processing", progress: 100, file });

          setTimeout(() => {
            setState({ status: "complete", progress: 100, file });
            onUploadComplete?.(file);
          }, 2000);
        } else {
          setState({ status: "uploading", progress: Math.min(progress, 99), file });
        }
      }, 300);
    },
    [onUploadComplete]
  );

  const handleFile = useCallback(
    async (file: File) => {
      const error = validateFile(file);
      if (error) {
        setState({ status: "error", progress: 0, file: null, error });
        return;
      }

      const durationError = await new Promise<string | null>((resolve) => {
        const audio = new Audio();
        const objectUrl = URL.createObjectURL(file);
        
        audio.addEventListener('loadedmetadata', () => {
          URL.revokeObjectURL(objectUrl);
          if (audio.duration < 0.05) {
            resolve("Audio file is too short. Minimum duration is 0.05 seconds.");
          } else {
            resolve(null);
          }
        });
        
        audio.addEventListener('error', () => {
          URL.revokeObjectURL(objectUrl);
          resolve("Could not read audio file duration. Please try another file.");
        });
        
        audio.src = objectUrl;
      });

      if (durationError) {
        setState({ status: "error", progress: 0, file: null, error: durationError });
        return;
      }

      simulateUpload(file);
    },
    [simulateUpload]
  );

  const handleSampleClick = async (e: React.MouseEvent, type: 'real' | 'fake') => {
    e.stopPropagation();
    const filePath = type === 'real' ? '/samples/real-voice.wav' : '/samples/ai-voice.wav';
    const fileName = type === 'real' ? 'real-voice.wav' : 'ai-voice.wav';
    
    try {
      const response = await fetch(filePath);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: 'audio/wav' });
      handleFile(file);
    } catch (err) {
      setState({ status: "error", progress: 0, file: null, error: "Failed to load sample audio." });
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClick = () => {
    if (state.status === "idle" || state.status === "error" || state.status === "complete") {
      fileInputRef.current?.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleReset = () => {
    setState({ status: "idle", progress: 0, file: null });
  };

  return (
    <section id="upload" className="py-12 px-5 sm:px-8 bg-gradient-section">
      <div className="max-w-2xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="heading-lg text-2xl sm:text-3xl mb-3">
            <span className="text-gradient-primary">Upload</span>{" "}
            <span className="text-foreground">Audio File</span>
          </h2>
          <p className="text-text-secondary text-sm sm:text-base font-light">
            Drag and drop your audio file or click to browse. Supports WAV, MP3, FLAC, OGG, and M4A formats.
          </p>
        </div>

        {/* Drop Zone */}
        <div
          id="audio-dropzone"
          className={`relative glass-card-elevated p-8 sm:p-12 cursor-pointer group
            ${isDragging ? "!border-primary glow-primary scale-[1.01]" : ""}
            ${state.status === "error" ? "!border-danger" : ""}
            ${state.status === "complete" ? "!border-accent" : ""}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          aria-label="Upload audio file"
        >
          {/* Animated dashed inner border */}
          <div
            className={`absolute inset-4 rounded-2xl border-2 border-dashed transition-all duration-300 pointer-events-none
              ${isDragging ? "border-primary/50" : "border-border group-hover:border-primary/20"}
              ${state.status === "complete" ? "border-accent/30" : ""}
              ${state.status === "error" ? "border-danger/30" : ""}
            `}
          />

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            onChange={handleInputChange}
            className="hidden"
            id="audio-file-input"
          />

          <div className="relative text-center space-y-5">
            {/* Idle State */}
            {state.status === "idle" && (
              <>
                <AudioUploadIcon status="idle" />
                <div>
                  <p className="text-foreground font-medium text-base mb-1">
                    {isDragging ? "Release to upload" : "Drag & drop audio file here"}
                  </p>
                  <p className="text-text-muted text-sm">
                    or <span className="text-primary hover:underline cursor-pointer">browse files</span>
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
                  {ACCEPTED_TYPES.map((type) => (
                    <span
                      key={type}
                      className="px-2 py-1 rounded-lg bg-surface border border-border mono-data uppercase text-xs"
                    >
                      {type}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-text-muted">Max 50 MB</p>
              </>
            )}

            {/* Uploading */}
            {state.status === "uploading" && (
              <div className="space-y-5">
                <AudioUploadIcon status="uploading" />
                <div>
                  <p className="text-foreground font-medium text-sm">{state.file?.name}</p>
                  <p className="text-text-muted text-sm mt-0.5">
                    {state.file ? formatFileSize(state.file.size) : ""}
                  </p>
                </div>
                <div className="max-w-xs mx-auto">
                  <div className="flex justify-between text-sm text-text-secondary mb-2">
                    <span className="font-medium text-foreground">Uploading...</span>
                    <span className="mono-data text-primary">{Math.round(state.progress)}%</span>
                  </div>
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300 progress-bar-shine relative"
                      style={{ width: `${state.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Processing */}
            {state.status === "processing" && (
              <div className="space-y-5">
                <AudioUploadIcon status="processing" />
                <p className="text-foreground font-medium text-sm">Processing audio...</p>
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-primary animate-pulse-glow">
                  <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span>Extracting features &amp; analyzing patterns...</span>
                </div>
              </div>
            )}

            {/* Complete */}
            {state.status === "complete" && (
              <div className="space-y-5">
                <AudioUploadIcon status="complete" />
                <div>
                  <p className="text-accent font-medium text-sm">Upload Complete</p>
                  <p className="text-text-muted text-sm mt-0.5">{state.file?.name}</p>
                </div>
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleReset(); 
                    setTimeout(() => fileInputRef.current?.click(), 10);
                  }}
                  id="upload-reset"
                  className="btn-secondary text-base px-5 py-2"
                >
                  Upload Another
                </button>
              </div>
            )}

            {/* Error */}
            {state.status === "error" && (
              <div className="space-y-5">
                <AudioUploadIcon status="error" />
                <div>
                  <p className="text-danger font-medium text-sm">Upload Error</p>
                  <p className="text-text-muted text-sm mt-0.5">{state.error}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleReset(); }}
                  className="btn-secondary text-base px-5 py-2"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Try it Out Section */}
        <div className="mt-8 pt-8 border-t border-border/50 text-center">
          <p className="text-text-secondary text-sm font-medium mb-4">Or try a pre-loaded sample:</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={(e) => handleSampleClick(e, 'real')}
              className="btn-secondary text-sm px-6 py-2 w-full sm:w-auto flex items-center justify-center gap-2"
              disabled={state.status === "uploading" || state.status === "processing"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="22"></line>
              </svg>
              Try a Real Voice
            </button>
            <button
              onClick={(e) => handleSampleClick(e, 'fake')}
              className="btn-secondary text-sm px-6 py-2 w-full sm:w-auto flex items-center justify-center gap-2"
              disabled={state.status === "uploading" || state.status === "processing"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="22"></line>
                <path d="M2 2l20 20" className="opacity-50"></path>
              </svg>
              Try an AI Deepfake
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
