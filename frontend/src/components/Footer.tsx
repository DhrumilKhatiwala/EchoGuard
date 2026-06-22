export default function Footer() {
  return (
    <footer id="footer" className="border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
        
        {/* Models Compact Card */}
        <div className="mb-12 p-5 rounded-2xl glass-card border border-border/50 flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto bg-surface/30 backdrop-blur-md">
          <div className="flex flex-col gap-1 text-center md:text-left">
            <h4 className="text-sm font-semibold text-foreground tracking-wide">Ensemble Detection Architecture</h4>
            <p className="text-sm text-text-muted">Powered by parallel Wav2Vec2 transformer networks</p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-6 divide-x divide-border/50">
            <a 
              href="https://huggingface.co/garystafford/wav2vec2-deepfake-voice-detector" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col gap-1 px-4 text-center group transition-opacity"
            >
              <span className="text-sm font-bold text-accent font-mono group-hover:underline">garystafford</span>
              <span className="text-xs text-text-muted uppercase tracking-wider">Primary Model</span>
            </a>
            <a 
              href="https://huggingface.co/Bisher/wav2vec2_ASV_deepfake_audio_detection" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col gap-1 px-4 text-center group transition-opacity"
            >
              <span className="text-sm font-bold text-accent font-mono group-hover:underline">Bisher ASV</span>
              <span className="text-xs text-text-muted uppercase tracking-wider">Secondary Model</span>
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
