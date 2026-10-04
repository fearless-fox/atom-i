import React, { useState } from "react";
import { Download, Share, X, Smartphone, Check } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";

interface PWAInstallButtonProps {
  onInstalledSound?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ onInstalledSound }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // If already running inside standalone desktop window or mobile home screen
  if (isInstalled) {
    return (
      <div
        className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] uppercase tracking-wider"
        title="Running in Standalone OS Window"
      >
        <Check className="w-3 h-3 text-emerald-400" />
        <span>STANDALONE OS</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (onInstalledSound) onInstalledSound();
    const success = await install();
    if (success) {
      setJustInstalled(true);
      setTimeout(() => setJustInstalled(false), 3000);
    }
  };

  // Chromium / Desktop Dock / Android flow
  if (isInstallable) {
    return (
      <button
        onClick={handleInstallClick}
        className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-rebel-500/20 to-blue-600/20 hover:from-rebel-500/30 hover:to-blue-600/30 border border-rebel-400/50 text-rebel-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-rebel-950/50"
        title="Install A.T.O.M-i as a standalone desktop/dock app without browser chrome"
      >
        <Download className="w-3.5 h-3.5 text-rebel-400 animate-bounce" />
        <span className="hidden sm:inline">INSTALL OS</span>
        <span className="sm:hidden">INSTALL</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-rebel-300 font-mono text-xs flex items-center gap-1.5 transition-colors"
          title="Install A.T.O.M-i on iOS Home Screen"
        >
          <Smartphone className="w-3.5 h-3.5 text-rebel-400" />
          <span className="hidden sm:inline">ADD TO HOME</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="relative w-full max-w-sm rounded-2xl bg-[#0B0B0F] border border-rebel-500/40 p-6 shadow-2xl text-left font-mono">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 text-rebel-400 mb-3">
                <Share className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Install on iOS Home Screen
                </h3>
              </div>

              <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
                <div className="p-3 rounded-lg bg-black/40 border border-rebel-900/40 space-y-2">
                  <p>
                    1. Tap the <strong className="text-rebel-400">Share icon</strong> in the Safari bottom toolbar.
                  </p>
                  <p>
                    2. Scroll down and select <strong className="text-rebel-400">Add to Home Screen</strong>.
                  </p>
                  <p>
                    3. Launch <strong className="text-white">A.T.O.M-i</strong> directly from your Home Screen in full standalone immersion.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full py-2 rounded-lg bg-rebel-500 text-black text-xs font-bold uppercase tracking-wider hover:bg-rebel-400 transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  const [showDesktopGuide, setShowDesktopGuide] = useState(false);

  // Ambient install prompt fallback for desktop browser window
  return (
    <>
      <button
        onClick={() => {
          if (onInstalledSound) onInstalledSound();
          setShowDesktopGuide(true);
        }}
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-rebel-300 font-mono text-xs transition-colors"
        title="Install atom-i as a Standalone App"
      >
        <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-rebel-400" />
        <span className="hidden lg:inline text-[11px]">INSTALL APP</span>
      </button>

      {showDesktopGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-sm rounded-2xl bg-[#0B0B0F] border border-rebel-500/40 p-6 shadow-2xl text-left font-mono">
            <button
              onClick={() => setShowDesktopGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-rebel-400 mb-3">
              <Download className="w-4 h-4" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Install atom-i Standalone
              </h3>
            </div>

            <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
              <div className="p-3 rounded-lg bg-black/40 border border-rebel-900/40 space-y-2">
                <p>
                  1. Look for the <strong className="text-rebel-400">Install icon</strong> (computer with down arrow) in your browser's address bar.
                </p>
                <p>
                  2. Or click your browser's menu (<strong className="text-gray-200">⋮</strong> or <strong className="text-gray-200">⋯</strong>) and select <strong className="text-rebel-400">Install atom-i</strong> or <strong className="text-rebel-400">Add to Desktop</strong>.
                </p>
                <p>
                  3. Launch anytime with zero browser distractions, full offline cache, and lightning performance.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDesktopGuide(false)}
              className="mt-4 w-full py-2 rounded-lg bg-rebel-500 text-black text-xs font-bold uppercase tracking-wider hover:bg-rebel-400 transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
