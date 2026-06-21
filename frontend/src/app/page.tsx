"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AudioUploader from "@/components/AudioUploader";
import WaveformViewer from "@/components/WaveformViewer";
import PredictionCard from "@/components/PredictionCard";
import AnalysisHistory from "@/components/AnalysisHistory";
import LoadingState from "@/components/LoadingState";
import Footer from "@/components/Footer";
import ForensicsDashboard from "@/components/ForensicsDashboard";
import EvidenceSummary from "@/components/EvidenceSummary";
import TimelineAnalysis from "@/components/TimelineAnalysis";
import { AnalysisResult, Verdict, WaveformData, ForensicMetrics, TimelineSegment, AnalysisHistoryItem } from "@/lib/types";

// Maximum retries for the API call
const MAX_RETRIES = 2;

export default function Home() {
  const [showResults, setShowResults] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const previousUrlRef = useRef<string | null>(null);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current);
      }
    };
  }, []);

  const formatFileSize = (bytes: number) => {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const uploadWithRetry = async (file: File, retryCount = 0): Promise<unknown> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      return await response.json();
    } catch (error: unknown) {
      if (retryCount < MAX_RETRIES) {
        toast.info(`Connection issue. Retrying (${retryCount + 1}/${MAX_RETRIES})...`);
        // Wait 1.5 seconds before retrying
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return uploadWithRetry(file, retryCount + 1);
      }
      throw error;
    }
  };

  const handleUploadComplete = async (file: File) => {
    // Revoke previous object URL to prevent memory leaks
    if (previousUrlRef.current) {
      URL.revokeObjectURL(previousUrlRef.current);
    }

    // Create a playable URL from the uploaded file
    const url = URL.createObjectURL(file);
    previousUrlRef.current = url;
    setAudioUrl(url);

    setIsAnalyzing(true);
    setShowResults(false);
    setResult(null);

    toast.loading("Analyzing audio...", { id: "analysis-toast" });

    try {
      const data = await uploadWithRetry(file) as {
        id: string;
        filename: string;
        prediction: string;
        confidence: number;
        duration_seconds: number;
        file_size_bytes: number;
        sample_rate: number;
        channels: number;
        waveform: number[];
        spectrogram_image: string;
        human_probability: number;
        ai_probability: number;
        forensics: ForensicMetrics;
        timeline: TimelineSegment[];
      };
      
      // Map backend "prediction" to frontend "verdict" type
      let mappedVerdict: Verdict = "suspicious";
      if (data.prediction === "LIKELY AI GENERATED" || data.prediction === "AI Generated") mappedVerdict = "deepfake";
      if (data.prediction === "LIKELY HUMAN" || data.prediction === "Human") mappedVerdict = "authentic";

      const formatDuration = (seconds: number): string => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
      };

      const analysisResult: AnalysisResult = {
        id: data.id,
        filename: data.filename,
        verdict: mappedVerdict,
        confidence: data.confidence,
        human_probability: data.human_probability,
        ai_probability: data.ai_probability,
        audioDetails: {
          duration: formatDuration(data.duration_seconds),
          sampleRate: `${data.sample_rate / 1000} kHz`,
          channels: data.channels === 1 ? "Mono" : "Stereo",
          bitDepth: "16-bit",
          fileSize: formatFileSize(data.file_size_bytes),
        },
        forensics: data.forensics,
        timelineSegments: data.timeline,
        timestamp: new Date().toISOString(),
        duration: formatDuration(data.duration_seconds),
        fileSize: formatFileSize(data.file_size_bytes),
        spectrogramImage: data.spectrogram_image,
      };

      setWaveformData({
        amplitudes: data.waveform,
        duration: data.duration_seconds,
        sampleRate: data.sample_rate,
      });

      setResult(analysisResult);
      setShowResults(true);
      
      const newHistoryItem: AnalysisHistoryItem = {
        id: analysisResult.id,
        filename: analysisResult.filename,
        verdict: analysisResult.verdict,
        confidence: analysisResult.confidence,
        timestamp: analysisResult.timestamp,
        duration: analysisResult.duration,
        fileSize: analysisResult.fileSize,
      };
      setHistory(prev => [newHistoryItem, ...prev]);

      toast.success("Analysis complete!", { id: "analysis-toast" });
    } catch (error: unknown) {
      console.error("Analysis failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze audio. Please try again.";
      toast.error(errorMessage, {
        id: "analysis-toast",
        duration: 5000,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <Navbar />

      <main>
        <HeroSection />

        <AudioUploader onUploadComplete={handleUploadComplete} />

        {/* Loading state during analysis */}
        {isAnalyzing && (
          <div className="max-w-2xl mx-auto px-5 sm:px-8 mb-10">
            <LoadingState isLoading={isAnalyzing} variant="inline" />
          </div>
        )}

        {/* Results section — shown after analysis completes */}
        {showResults && result && (
          <div className="animate-in fade-in max-w-6xl mx-auto px-5 sm:px-8 mb-10">
            <div className="flex flex-col gap-6">
              
              {/* Top Full Width: Waveform */}
              <div className="w-full">
                <WaveformViewer
                  data={waveformData!}
                  audioUrl={audioUrl}
                  isAnalyzing={false}
                />
              </div>

              {/* Bottom Grid Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Prediction, Timeline */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  <PredictionCard result={result} visible={showResults} />
                  <TimelineAnalysis segments={result.timelineSegments} durationSeconds={waveformData?.duration || 0} />
                </div>

                {/* Right Column: Forensics, Evidence */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <ForensicsDashboard metrics={result.forensics} />
                  <EvidenceSummary forensics={result.forensics} />
                </div>

              </div>
            </div>
            
            {/* Disclaimer */}
            <div className="mt-8 text-center text-[0.6875rem] text-text-muted/70 max-w-2xl mx-auto">
              This analysis is probabilistic and should not be considered definitive proof of authenticity. 
              Results should be interpreted alongside other evidence.
            </div>
          </div>
        )}

        {history.length > 0 && <AnalysisHistory items={history} />}
      </main>

      <Footer />
    </div>
  );
}
