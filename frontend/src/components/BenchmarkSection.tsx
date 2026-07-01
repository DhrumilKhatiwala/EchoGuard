"use client";

import { useEffect, useState } from "react";

interface ModelMetrics {
  accuracy: string | number;
  precision: string | number;
  recall: string | number;
  f1_score: string | number;
  total_time_seconds?: number;
}

type BenchmarkData = Record<string, ModelMetrics>;

export default function BenchmarkSection() {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBenchmark = async () => {
      try {
        const res = await fetch("/benchmark_results.json");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          setData(null);
        }
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchBenchmark();
  }, []);

  if (loading) {
    return (
      <section id="benchmark" className="max-w-4xl mx-auto px-5 sm:px-8 pb-16">
        <div className="glass-card p-5 sm:p-6 rounded-2xl">
          <h2 className="text-xl font-medium text-foreground mb-6 animate-pulse bg-surface w-48 h-6 rounded"></h2>
          <div className="text-sm text-text-muted italic border border-dashed border-border rounded-xl p-6 text-center animate-pulse">
            Loading benchmark results...
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="benchmark" className="max-w-4xl mx-auto px-5 sm:px-8 pb-16 -mt-8 relative z-10">
      <div className="glass-card p-5 sm:p-6 rounded-2xl border border-border/50 bg-background/40 backdrop-blur-md">
        <h2 className="text-lg font-medium text-foreground mb-6 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          Evaluation Metrics Across Models
        </h2>
        
        {!data ? (
          <div className="text-sm text-text-muted italic border border-dashed border-border/60 bg-surface/30 rounded-xl p-6 text-center">
            Benchmark results available after evaluation.
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(data).map(([modelName, metrics]) => {
              const isWinner = modelName === "garystafford/wav2vec2-deepfake-voice-detector";
              return (
                <div key={modelName} className={`p-5 rounded-xl border transition-all duration-300 ${isWinner ? 'bg-primary-muted/10 border-primary/30 shadow-[0_0_15px_rgba(56,189,248,0.05)]' : 'bg-surface border-border/30 hover:border-border/60'}`}>
                  <h3 className="text-sm font-semibold mb-4 font-mono truncate flex items-center gap-2" title={modelName}>
                    <span className={isWinner ? 'text-primary' : 'text-text-secondary'}>{modelName.split('/').pop()}</span>
                    {isWinner && <span className="px-2 py-0.5 rounded text-xs bg-primary/20 text-primary tracking-widest uppercase">Production Model</span>}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {[
                      { label: "Accuracy", value: metrics.accuracy },
                      { label: "Precision", value: metrics.precision },
                      { label: "Recall", value: metrics.recall },
                      { label: "F1 Score", value: metrics.f1_score }
                    ].map((metric) => (
                      <div key={metric.label} className="text-center p-3 rounded-xl bg-surface/50 border border-border/20">
                        <div className={`text-xl font-bold mb-1 font-mono ${isWinner ? 'text-accent text-glow-primary' : 'text-text-secondary'}`}>
                          {typeof metric.value === 'number' ? `${(metric.value * 100).toFixed(1)}%` : metric.value}
                        </div>
                        <div className="text-xs text-text-muted uppercase tracking-[0.15em] font-medium">
                          {metric.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
