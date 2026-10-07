/**
 * Hyperfocus Mode — fullscreen ambient focus experience.
 * Full-bleed violet node particle field (ported from the original atom-i
 * VFX engine) + deep brown noise, with a minimal HUD showing the current
 * task and session timer. Pure beauty, zero chrome.
 */
import React, { useEffect, useId, useRef, useState } from "react";
import { X, Waves } from "lucide-react";
import { VFXParticlesVisualizer } from "../lib/vfxParticles";
import { cyberAudio } from "../lib/cyberAudio";
import { Goal } from "../types";

interface HyperfocusModeProps {
  goal: Goal;
  onClose: () => void;
}

function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const HyperfocusMode: React.FC<HyperfocusModeProps> = ({ goal, onClose }) => {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const containerId = `hyperfocus-vfx-${rawId}`;
  const visualizerRef = useRef<VFXParticlesVisualizer | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const currentTaskTitle =
    goal.phases.find((p) => !p.completed)?.tasks.find((t) => !t.completed)?.title ||
    goal.title ||
    "Deep work";

  // Mount: particle field + brown noise. Unmount: full teardown + silence.
  useEffect(() => {
    const viz = new VFXParticlesVisualizer(containerId);
    visualizerRef.current = viz;
    viz.init();

    try {
      cyberAudio.setAmbienceProfile("deep_brown");
      cyberAudio.startAmbience("deep_brown");
    } catch (e) {
      console.warn("Could not start hyperfocus ambience:", e);
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      try {
        cyberAudio.stopAmbience();
      } catch {
        // ignore
      }
      viz.destroy();
      visualizerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId]);

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-[#0B0B0F] overflow-hidden animate-fade-in">
      {/* Particle canvas mounts here */}
      <div id={containerId} className="absolute inset-0" />

      {/* Minimal HUD */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <Waves className="w-4 h-4 text-rebel-400 animate-pulse" />
            <div>
              <div className="font-mono text-[11px] font-bold tracking-[0.3em] text-rebel-300 uppercase">
                Hyperfocus
              </div>
              <div className="font-mono text-[10px] text-gray-500 tracking-widest">
                BROWN NOISE • DEEP FIELD
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="font-mono text-sm text-gray-400 tabular-nums">
              {formatElapsed(elapsed)}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors"
              title="Exit hyperfocus (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex justify-center pb-4">
          <div className="max-w-xl text-center">
            <div className="font-mono text-[10px] tracking-[0.3em] text-gray-600 uppercase mb-1.5">
              Current vector
            </div>
            <div className="font-sans text-lg text-gray-200 font-semibold drop-shadow-[0_0_12px_rgba(124,58,237,0.45)]">
              {currentTaskTitle}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
