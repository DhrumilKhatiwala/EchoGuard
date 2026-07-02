"use client";

import { useState, useEffect, useRef } from "react";

function EchoGuardLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="transition-transform duration-500 group-hover:scale-105"
    >
      {/* Outer shield shape — filled gradient */}
      <defs>
        <linearGradient id="shield-fill" x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="shield-stroke" x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <linearGradient id="wave-gradient" x1="14" y1="18" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#7dd3fc" />
        </linearGradient>
      </defs>

      {/* Shield body */}
      <path
        d="M24 3L7 10v12c0 11 7.2 21.2 17 24 9.8-2.8 17-13 17-24V10L24 3z"
        fill="url(#shield-fill)"
        stroke="url(#shield-stroke)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Inner shield line (decorative) */}
      <path
        d="M24 8L12 13v9c0 8.5 5.4 16.3 12 18.5 6.6-2.2 12-10 12-18.5v-9L24 8z"
        fill="none"
        stroke="url(#shield-stroke)"
        strokeWidth="0.5"
        strokeOpacity="0.3"
        strokeLinejoin="round"
      />

      {/* Audio waveform bars — centered, varied heights */}
      <rect x="16" y="22" width="2.2" height="8" rx="1.1" fill="url(#wave-gradient)" opacity="0.7" />
      <rect x="20" y="18" width="2.2" height="16" rx="1.1" fill="url(#wave-gradient)" opacity="0.85" />
      <rect x="24" y="15" width="2.2" height="22" rx="1.1" fill="url(#wave-gradient)" />
      <rect x="28" y="19" width="2.2" height="14" rx="1.1" fill="url(#wave-gradient)" opacity="0.85" />
      <rect x="32" y="23" width="2.2" height="6" rx="1.1" fill="url(#wave-gradient)" opacity="0.6" />

      {/* Subtle keyhole / scanner dot at top */}
      <circle cx="24" cy="11" r="1.5" fill="#38bdf8" opacity="0.6" />
    </svg>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<"online" | "waking" | "offline" | "checking">("checking");
  const wakeStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let timer: NodeJS.Timeout;

    const poll = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(`${API_URL}/api/health`, {
          signal: controller.signal,
          cache: "no-store",
        });
        clearTimeout(timeoutId);

        if (!isMounted) return;

        if (res.ok) {
          setApiStatus("online");
          wakeStartTimeRef.current = null;
          timer = setTimeout(poll, 15000);
        } else {
          handleOfflineOrWaking();
        }
      } catch (err) {
        if (!isMounted) return;
        handleOfflineOrWaking();
      }
    };

    const handleOfflineOrWaking = () => {
      if (wakeStartTimeRef.current === null) {
        wakeStartTimeRef.current = Date.now();
      }

      const elapsedSeconds = (Date.now() - wakeStartTimeRef.current) / 1000;

      if (elapsedSeconds <= 30) {
        // For the first 30 seconds -> actively send requests every 3 seconds to wake up Hugging Face space!
        setApiStatus("waking");
        timer = setTimeout(poll, 3000);
      } else if (elapsedSeconds <= 630) {
        // After 30 seconds -> switch to OFFLINE, but keep sending requests every 60 seconds for up to 10 minutes!
        setApiStatus("offline");
        timer = setTimeout(poll, 60000);
      } else {
        // After 10 minutes -> remain offline and check every 5 minutes until online
        setApiStatus("offline");
        timer = setTimeout(poll, 300000);
      }
    };

    poll();

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const navLinks = [
    { label: "Dashboard", href: "#hero" },
    { label: "Analyze", href: "#upload" },
    { label: "History", href: "#history" },
  ];

  const getStatusBadge = (isMobile = false) => {
    const isOnline = apiStatus === "online";
    const isWaking = apiStatus === "waking";
    const isOffline = apiStatus === "offline";

    return (
      <div
        title={
          isOnline
            ? "Backend API is online and listening."
            : isWaking
            ? "Backend API is asleep on Hugging Face. Actively sending wake-up pings in the background before you upload..."
            : isOffline
            ? "Backend API is offline or asleep on Hugging Face. Automatically checking every 60 seconds."
            : "Checking backend API status..."
        }
        className={`flex items-center gap-2 transition-all duration-300 ${
          isMobile ? "text-xs py-1" : "text-xs sm:text-sm"
        } ${
          isOnline
            ? "text-accent"
            : isWaking
            ? "text-cyan-400"
            : isOffline
            ? "text-red-400"
            : "text-amber-400"
        }`}
      >
        <span className="relative flex h-[6px] w-[6px]">
          {isOnline ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-accent" />
            </>
          ) : isWaking ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-80" />
              <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-cyan-400" />
            </>
          ) : isOffline ? (
            <>
              <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-red-400" />
            </>
          ) : (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-amber-400" />
            </>
          )}
        </span>
        <span className="mono-data tracking-wider uppercase font-semibold">
          {isOnline ? "Online" : isWaking ? (isMobile ? "Waking..." : "Waking Up...") : isOffline ? "Offline" : "Checking"}
        </span>
      </div>
    );
  };

  return (
    <nav
      id="navbar"
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled
          ? "rgba(6, 10, 20, 0.75)"
          : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(1.3)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px) saturate(1.3)" : "none",
        borderBottom: scrolled
          ? "1px solid rgba(56, 189, 248, 0.08)"
          : "1px solid transparent",
        boxShadow: scrolled
          ? "0 4px 24px rgba(0, 0, 0, 0.2)"
          : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="relative flex items-center justify-between h-[72px]">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group" id="nav-logo">
            <EchoGuardLogo size={36} />
            <span className="heading-md text-lg tracking-tight">
              <span className="text-primary">Echo</span>
              <span className="text-foreground">Guard</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                id={`nav-${link.label.toLowerCase()}`}
                className="relative px-4 py-2 text-base font-medium text-text-secondary hover:text-foreground transition-colors duration-300 group"
              >
                {link.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-primary to-accent rounded-full group-hover:w-2/3 transition-all duration-300" />
              </a>
            ))}
          </div>

          {/* Status + CTA */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* System Status */}
            {getStatusBadge(false)}
          </div>

          {/* Mobile Menu Button */}
          <button
            id="mobile-menu-toggle"
            className="md:hidden p-2 -mr-2 text-text-secondary hover:text-primary transition-colors ml-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileMenuOpen ? (
                <path d="M6 6l12 12M6 18L18 6" />
              ) : (
                <>
                  <path d="M4 7h16" />
                  <path d="M4 12h12" />
                  <path d="M4 17h8" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          mobileMenuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="glass-card-elevated mx-4 mb-4 p-3 !rounded-xl space-y-2">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary-muted rounded-lg transition-all duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
