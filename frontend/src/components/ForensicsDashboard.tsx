import { ForensicMetrics, MetricDetail } from "@/lib/types";

interface ForensicsDashboardProps {
  metrics: ForensicMetrics;
}

export default function ForensicsDashboard({ metrics }: ForensicsDashboardProps) {
  const metricItems = [
    { label: "Voice Naturalness", value: metrics.voice_naturalness, desc: "How realistic and human-like the voice sounds." },
    { label: "Audio Quality", value: metrics.audio_quality, desc: "How clear and clean the microphone recording is." }
  ];

  return (
    <div className="glass-card-elevated group p-5 sm:p-6 h-full flex flex-col relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center border border-accent/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
              <path d="M12 2a10 10 0 0 1 10 10" className="animate-pulse" />
            </svg>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              Forensics Dashboard
            </h3>
            <p className="text-xs text-text-muted">Pure signal processing evaluation (DSP)</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        {metricItems.map((metric) => {
          const isObj = typeof metric.value === "object" && metric.value !== null;
          const scoreValue = isObj ? (metric.value as MetricDetail).score : (metric.value as number);
          const reasonText = isObj ? (metric.value as MetricDetail).reason : metric.desc;

          return (
            <div key={metric.label}>
              <div className="flex items-baseline justify-between mb-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-medium text-foreground">{metric.label}</span>
                  <span className="text-sm text-text-muted hidden sm:inline">{reasonText}</span>
                </div>
                <span className="text-base mono-data font-medium" 
                      style={{ color: scoreValue > 75 ? "#34d399" : scoreValue > 50 ? "#fbbf24" : "#f43f5e" }}>
                  {scoreValue}%
                </span>
              </div>
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-[1200ms] ease-out"
                  style={{
                    width: `${scoreValue}%`,
                    background: `linear-gradient(90deg, #38bdf8, ${scoreValue > 75 ? "#34d399" : scoreValue > 50 ? "#fbbf24" : "#f43f5e"})`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
