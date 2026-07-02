"use client";

import { useEffect, useState } from "react";

interface LoadingStateProps {
  isLoading: boolean;
  variant?: "fullscreen" | "inline";
}

const steps = [
  { label: "Initializing Analysis" },
  { label: "Extracting Features" },
  { label: "Analyzing Patterns" },
  { label: "Generating Report" },
];

export default function LoadingState({ isLoading, variant = "inline" }: LoadingStateProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!isLoading) {
      setCurrentStep(0);
      return;
    }

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1800);

    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);

    return () => {
      clearInterval(stepInterval);
      clearInterval(dotInterval);
    };
  }, [isLoading]);

  if (!isLoading) return null;

  const content = (
    <div className="text-center space-y-6">
      {/* Shield icon */}
      <div className="relative mx-auto w-16 h-16">
        <div className="absolute inset-0 rounded-2xl bg-primary/8 animate-ping" style={{ animationDuration: "2s" }} />
        <div className="relative w-16 h-16 rounded-2xl bg-primary-muted flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none" className="text-primary">
            <path
              d="M24 4L8 11v12c0 11 7.2 21 16 24 8.8-3 16-13 16-24V11L24 4z"
              fill="rgba(56, 189, 248, 0.08)"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path d="M16 22v6M20 18v14M24 20v8M28 22v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-pulse" />
          </svg>
        </div>
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute w-full h-5 bg-gradient-to-b from-transparent via-primary/15 to-transparent" style={{ animation: "scan 2s ease-in-out infinite" }} />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2.5">
        {steps.map((step, index) => (
          <div
            key={step.label}
            className={`flex items-center justify-center gap-2.5 text-sm sm:text-base transition-all duration-500 py-1 ${
              index < currentStep
                ? "text-foreground"
                : index === currentStep
                ? "text-foreground font-semibold scale-[1.02]"
                : "text-text-muted opacity-60"
            }`}
          >
            {index < currentStep ? (
              <div className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center flex-shrink-0 shadow-inner">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            ) : index === currentStep ? (
              <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                </svg>
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-border/60 flex-shrink-0" />
            )}
            <span className={`font-medium tracking-wide ${index === currentStep ? "text-primary text-glow-primary" : ""}`}>
              {step.label}
              {index === currentStep ? dots : ""}
            </span>
          </div>
        ))}
      </div>

      {/* Skeleton */}
      <div className="max-w-[200px] mx-auto space-y-2 mt-4">
        {[100, 75, 50].map((w, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full animate-shimmer"
            style={{
              width: `${w}%`,
              margin: "0 auto",
              background: "linear-gradient(90deg, rgba(56,189,248,0.04) 25%, rgba(56,189,248,0.08) 50%, rgba(56,189,248,0.04) 75%)",
              backgroundSize: "200% auto",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );

  if (variant === "fullscreen") {
    return (
      <div id="loading-fullscreen" className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return (
    <div id="loading-inline" className="glass-card-elevated p-10 max-w-sm mx-auto">
      {content}
    </div>
  );
}
