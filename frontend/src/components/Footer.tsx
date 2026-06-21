export default function Footer() {
  return (
    <footer id="footer" className="border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
        
        {/* Dataset & Model Compact Card */}
        <div className="mb-12 p-5 rounded-2xl glass-card border border-border/50 flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto bg-surface/30 backdrop-blur-md">
          <div className="flex flex-col gap-1 text-center md:text-left">
            <h4 className="text-sm font-semibold text-foreground tracking-wide">Deepfake Audio Detection Dataset v4</h4>
            <p className="text-sm text-text-muted">Model: Wav2Vec2 DeepFake Voice Detector</p>
          </div>
          
          <div className="flex items-center gap-6 divide-x divide-border/50">
            <div className="flex flex-col gap-0.5 px-4 text-center">
              <span className="text-[1.05rem] font-bold text-accent font-mono">1,866</span>
              <span className="text-xs text-text-muted uppercase tracking-wider">Samples</span>
            </div>
            <div className="flex flex-col gap-0.5 px-4 text-center">
              <span className="text-base font-medium text-text-secondary mt-1">Human / Synthetic</span>
              <span className="text-xs text-text-muted uppercase tracking-wider">Classes</span>
            </div>
          </div>
          
          <div>
            <a 
              href="https://huggingface.co/datasets/garystafford/deepfake-audio-detection" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-4 py-2 rounded-lg text-xs font-medium border border-border bg-surface hover:border-primary/50 text-text-secondary hover:text-primary transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
            >
              View Dataset
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
              <defs>
                <linearGradient id="footer-shield" x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
              <path
                d="M24 3L7 10v12c0 11 7.2 21.2 17 24 9.8-2.8 17-13 17-24V10L24 3z"
                fill="rgba(56, 189, 248, 0.08)"
                stroke="url(#footer-shield)"
                strokeWidth="2"
              />
              <rect x="16" y="22" width="2" height="8" rx="1" fill="url(#footer-shield)" opacity="0.7" />
              <rect x="20" y="18" width="2" height="16" rx="1" fill="url(#footer-shield)" opacity="0.85" />
              <rect x="24" y="15" width="2" height="22" rx="1" fill="url(#footer-shield)" />
              <rect x="28" y="19" width="2" height="14" rx="1" fill="url(#footer-shield)" opacity="0.85" />
              <rect x="32" y="23" width="2" height="6" rx="1" fill="url(#footer-shield)" opacity="0.6" />
            </svg>
            <div>
              <span className="heading-md text-base">
                <span className="text-primary">Echo</span>
                <span className="text-foreground">Guard</span>
              </span>
              <p className="text-xs text-text-muted">AI-Powered Audio Verification</p>
            </div>
          </div>



          {/* AI Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-elevated border border-border text-sm text-text-muted mono-data">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            Powered by AI
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center text-sm text-text-muted">
          © {new Date().getFullYear()} EchoGuard. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
