export type Verdict = 'authentic' | 'deepfake' | 'suspicious';

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

export interface MetricDetail {
  score: number;
  confidence: "High" | "Medium" | "Low";
  reason: string;
}

export interface ForensicMetrics {
  voice_naturalness: number | MetricDetail;
  audio_quality: number | MetricDetail;
  characteristics: string[];
  advanced: Record<string, string>;
}

export interface AudioDetails {
  duration: string;
  sampleRate: string;
  channels: string;
  bitDepth: string;
  fileSize: string;
}



export interface TimelineSegment {
  start: number;
  end: number;
  label: "Human-like" | "Suspicious" | "Neutral";
  human_probability: number;
  ai_probability: number;
}

export interface AnalysisResult {
  id: string;
  filename: string;
  verdict: Verdict;
  confidence: number;
  human_probability: number;
  ai_probability: number;
  audioDetails: AudioDetails;
  forensics: ForensicMetrics;
  timelineSegments: TimelineSegment[];
  timestamp: string;
  duration: string;
  fileSize: string;
  spectrogramImage?: string;
}

export interface AnalysisHistoryItem {
  id: string;
  filename: string;
  verdict: Verdict;
  confidence: number;
  timestamp: string;
  duration: string;
  fileSize: string;
}

export interface UploadState {
  status: UploadStatus;
  progress: number;
  file: File | null;
  error?: string;
}

export interface WaveformData {
  amplitudes: number[];
  duration: number;
  sampleRate: number;
}
