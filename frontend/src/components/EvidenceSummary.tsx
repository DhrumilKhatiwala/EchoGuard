import { useState } from "react";
import { ForensicMetrics } from "@/lib/types";

interface EvidenceSummaryProps {
  forensics: ForensicMetrics;
}

export default function EvidenceSummary({ forensics }: EvidenceSummaryProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { characteristics, advanced } = forensics;

  return (
    <div className="glass-card-elevated group p-5 sm:p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="10 9 9 9 8 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h3 className="text-base font-semibold heading-md text-foreground">Detected Characteristics</h3>
      </div>
      
      <div className="space-y-3 mb-6 flex-grow">
        {characteristics.map((char, idx) => {
          const isWarning = char.includes("⚠");
          return (
            <div key={idx} className="flex gap-3 group hover:bg-surface-elevated p-2 -mx-2 rounded-lg transition-colors">
              <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${isWarning ? 'bg-warning/20 text-warning' : 'bg-accent/20 text-accent'}`}>
                {isWarning ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <div className="text-base font-medium text-foreground self-center">
                {char.replace("✓ ", "").replace("⚠ ", "")}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto border-t border-border pt-4">
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-foreground transition-colors w-full uppercase tracking-wider font-semibold"
        >
          <svg 
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          Advanced Analysis
        </button>

        {showAdvanced && (
          <div className="mt-4 p-4 rounded-xl bg-surface-elevated/50 border border-border/50 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
              {Object.entries(advanced).map(([key, value]) => (
                <div key={key}>
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-1">{key}</div>
                  <div className="text-sm mono-data text-primary">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
