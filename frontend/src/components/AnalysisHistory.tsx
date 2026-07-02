"use client";

import { useState } from "react";
import { AnalysisHistoryItem, Verdict } from "@/lib/types";

interface AnalysisHistoryProps {
  items: AnalysisHistoryItem[];
}

const verdictStyles: Record<Verdict, { label: string; dotColor: string; textColor: string; bgColor: string }> = {
  authentic: {
    label: "Authentic",
    dotColor: "bg-accent",
    textColor: "text-accent",
    bgColor: "bg-accent-muted",
  },
  deepfake: {
    label: "Deepfake",
    dotColor: "bg-danger",
    textColor: "text-danger",
    bgColor: "bg-danger-muted",
  },
  suspicious: {
    label: "Suspicious",
    dotColor: "bg-warning",
    textColor: "text-warning",
    bgColor: "bg-warning-muted",
  },
};

type FilterType = "all" | Verdict;

const formatTimeDisplay = (timeStr?: string) => {
  if (!timeStr || !timeStr.includes(":")) return timeStr || "";
  const parts = timeStr.split(":");
  if (parts.length === 2 && parts[0].length === 1) {
    return `0${timeStr}`;
  }
  return timeStr;
};

export default function AnalysisHistory({ items }: AnalysisHistoryProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "authentic", label: "Authentic" },
    { key: "deepfake", label: "Deepfake" },
    { key: "suspicious", label: "Suspicious" },
  ];

  const filteredItems =
    activeFilter === "all"
      ? items
      : items.filter((item) => item.verdict === activeFilter);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <section id="history" className="py-12 px-5 sm:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="heading-lg text-2xl sm:text-3xl mb-3">
            <span className="text-gradient-primary">Analysis</span>{" "}
            <span className="text-foreground">History</span>
          </h2>
          <p className="text-text-secondary text-sm sm:text-base font-light">
            Review past scans and track detection patterns over time.
          </p>
        </div>

        {/* Filters */}
        <div id="history-filters" className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          {filters.map((filter) => {
            const count =
              filter.key === "all"
                ? items.length
                : items.filter((i) => i.verdict === filter.key).length;
            return (
              <button
                key={filter.key}
                id={`filter-${filter.key}`}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-4 py-2 rounded-xl text-base font-medium transition-all duration-200 flex items-center gap-2
                  ${
                    activeFilter === filter.key
                      ? "bg-primary-muted text-primary border border-primary/20"
                      : "bg-surface-elevated text-text-secondary border border-border hover:border-border-strong hover:text-foreground"
                  }`}
              >
                {filter.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-lg mono-data ${
                    activeFilter === filter.key
                      ? "bg-primary/15 text-primary"
                      : "bg-surface text-text-muted"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* List */}
        <div className="space-y-2">
          {filteredItems.length === 0 && (
            <div className="glass-card p-16 text-center">
              <p className="text-text-muted text-sm">No analyses found for this filter.</p>
            </div>
          )}

          {filteredItems.map((item, index) => {
            const style = verdictStyles[item.verdict];
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                id={`history-item-${item.id}`}
                className="glass-card group cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${index * 60}ms` }}
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <div className="p-4 sm:px-5 sm:py-4 flex items-center gap-3 sm:gap-4">
                  {/* Status dot */}
                  <div className={`w-2 h-2 rounded-full ${style.dotColor} flex-shrink-0`} />

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-foreground truncate group-hover:text-primary transition-colors duration-200">
                      {item.filename}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-sm text-text-muted mono-data">
                      <span>{formatTimeDisplay(item.duration)}</span>
                      <span className="text-border">·</span>
                      <span>{item.fileSize}</span>
                      <span className="hidden sm:inline text-border">·</span>
                      <span className="hidden sm:inline">{formatDate(item.timestamp)}</span>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="hidden sm:block text-right">
                    <span className="text-base mono-data text-primary font-medium">
                      {(item.confidence * 100).toFixed(1)}%
                    </span>
                  </div>

                  {/* Badge */}
                  <div
                    className={`px-3 py-1 rounded-lg text-xs mono-data font-semibold tracking-[0.08em] ${style.textColor} ${style.bgColor} flex-shrink-0`}
                  >
                    {style.label}
                  </div>

                  {/* Chevron */}
                  <svg
                    width="14" height="14" viewBox="0 0 16 16" fill="none"
                    className={`text-text-muted transition-transform duration-200 flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                  >
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Expanded */}
                <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="px-5 pb-4 pt-0 border-t border-border">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                      {[
                        { label: "Confidence", value: `${(item.confidence * 100).toFixed(1)}%`, highlight: true },
                        { label: "Duration", value: formatTimeDisplay(item.duration) },
                        { label: "Date", value: new Date(item.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                      ].map((field) => (
                        <div key={field.label}>
                          <p className="text-xs text-text-muted uppercase tracking-[0.15em] mb-1">{field.label}</p>
                          <p className={`text-base mono-data ${field.highlight ? style.textColor : "text-text-secondary"}`}>
                            {field.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
