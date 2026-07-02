import { ForensicMetrics } from "@/lib/types";

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
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
            <path d="M12 20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 20v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3 className="text-base font-semibold heading-md text-foreground">Forensics Dashboard</h3>
        </div>
        
        <div 
          className="self-start sm:self-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border/60 text-xs font-medium text-text-secondary cursor-help transition-colors hover:border-primary/50"
          title="These metrics are generated from signal-processing analysis and are independent of the deepfake detector's prediction."
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary/70">
            <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
          Independent Audio Analysis
        </div>
      </div>
      
      <div className="space-y-6">
        {metricItems.map((metric) => {
          const isObj = typeof metric.value === "object" && metric.value !== null;
          const scoreValue = isObj ? (metric.value as any).score : (metric.value as number);
          const reasonText = isObj ? (metric.value as any).reason : metric.desc;

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
