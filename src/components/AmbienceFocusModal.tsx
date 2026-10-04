/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  X,
  Waves,
  Headphones,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
  Radio,
  CloudRain
} from "lucide-react";
import { cyberAudio, AmbienceProfile } from "../lib/cyberAudio";

interface AmbienceFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAmbienceActive: boolean;
  onToggleAmbience: () => void;
}

export const AmbienceFocusModal: React.FC<AmbienceFocusModalProps> = ({
  isOpen,
  onClose,
  isAmbienceActive,
  onToggleAmbience,
}) => {
  const [profile, setProfile] = useState<AmbienceProfile>("deep_brown");
  const [volume, setVolume] = useState<number>(35);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      const state = cyberAudio.getAmbienceState();
      setProfile(state.profile);
      setVolume(Math.round(state.volume * 100));
    }
  }, [isOpen]);

  // Session countdown timer
  useEffect(() => {
    if (!isAmbienceActive || secondsRemaining === null || secondsRemaining <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null || prev <= 1) {
          cyberAudio.stopAmbience();
          cyberAudio.playSuccess();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAmbienceActive, secondsRemaining]);

  if (!isOpen) return null;

  const handleProfileChange = (newProfile: AmbienceProfile) => {
    cyberAudio.playCyberClick(1.1);
    setProfile(newProfile);
    cyberAudio.setAmbienceProfile(newProfile);
    if (!isAmbienceActive) {
      onToggleAmbience();
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    cyberAudio.setAmbienceVolume(newVol / 100);
  };

  const handleSetTimer = (minutes: number | null) => {
    cyberAudio.playCyberClick(1.0);
    setTimerMinutes(minutes);
    if (minutes === null) {
      setSecondsRemaining(null);
    } else {
      setSecondsRemaining(minutes * 60);
      if (!isAmbienceActive) {
        onToggleAmbience();
      }
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#070b14] border border-rebel-500/30 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rebel-900/40 bg-gradient-to-r from-rebel-950/40 via-black to-blue-950/30">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
              isAmbienceActive
                ? "bg-rust-500/20 border-rust-400 text-rust-300 shadow-md shadow-rust-500/20"
                : "bg-rebel-500/10 border-rebel-500/30 text-rebel-400"
            }`}>
              <Waves className={`w-5 h-5 ${isAmbienceActive ? "animate-pulse text-rust-400" : ""}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold font-mono tracking-wider text-white uppercase">
                  ADHD Deep Focus Ambience
                </h2>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold border ${
                  isAmbienceActive
                    ? "bg-rust-500/20 border-rust-400/60 text-rust-300"
                    : "bg-gray-800 border-gray-700 text-gray-400"
                }`}>
                  {isAmbienceActive ? "ACTIVE" : "STANDBY"}
                </span>
              </div>
              <p className="text-[11px] font-mono text-gray-400">
                Procedural 1/f² Brown Noise & Theta Brainwave Synthesis
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              cyberAudio.playCyberClick(0.9);
              onClose();
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Main Visualizer & Toggle */}
          <div className="rounded-2xl border border-rebel-500/30 bg-black/60 p-5 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
            {/* Background Glow */}
            <div className={`absolute inset-0 transition-opacity pointer-events-none ${
              isAmbienceActive ? "opacity-30 bg-radial from-rust-500/20 via-transparent to-transparent" : "opacity-0"
            }`} />

            {/* Simulated Dynamic Audio Wave Spectrum */}
            <div className="flex items-end justify-center gap-1.5 h-12 w-full max-w-xs">
              {[40, 65, 85, 95, 75, 55, 90, 100, 70, 85, 60, 45, 80, 65, 50, 75, 40].map((h, i) => (
                <div
                  key={i}
                  className={`w-2 rounded-t transition-all duration-300 ${
                    isAmbienceActive
                      ? "bg-gradient-to-t from-rust-500 via-rust-300 to-rebel-400 animate-pulse"
                      : "bg-gray-800"
                  }`}
                  style={{
                    height: isAmbienceActive ? `${Math.max(15, (h * (volume / 100)))}%` : "12%",
                    animationDelay: `${i * 60}ms`,
                  }}
                />
              ))}
            </div>

            {/* Master Play/Pause Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  cyberAudio.playCyberClick(1.2);
                  onToggleAmbience();
                }}
                className={`px-6 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all shadow-lg ${
                  isAmbienceActive
                    ? "bg-gradient-to-r from-rust-400 to-rust-500 hover:from-rust-300 hover:to-rust-400 text-black shadow-rust-500/20"
                    : "bg-rebel-500 hover:bg-rebel-400 text-black shadow-rebel-500/20"
                }`}
              >
                {isAmbienceActive ? (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>Silence Ambience</span>
                  </>
                ) : (
                  <>
                    <Headphones className="w-4 h-4" />
                    <span>Engage Focus Stream</span>
                  </>
                )}
              </button>
            </div>

            {/* Active Status Readout */}
            <div className="text-[11px] font-mono text-gray-400 flex items-center gap-2">
              <Activity className={`w-3.5 h-3.5 ${isAmbienceActive ? "text-rust-400 animate-pulse" : "text-gray-600"}`} />
              <span>
                {isAmbienceActive
                  ? `Streaming ${
                      profile === "deep_brown"
                        ? "Deep Brown Waterfall"
                        : profile === "binaural_theta"
                        ? "4.5Hz Theta Flow"
                        : profile === "heavy_rain"
                        ? "Thunder & Rainstorm"
                        : "Pink Cosmic Drift"
                    } • 100% Gapless Loop at ${volume}%`
                  : "Generator idle • Zero bandwidth footprint"}
              </span>
            </div>
          </div>

          {/* Ambience Frequency Profiles */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono text-rebel-300 uppercase tracking-wider font-bold flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-rebel-400" />
                <span>Acoustic Focus Profiles</span>
              </label>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Seamless Loop Active</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Option 1: Deep Brown */}
              <button
                onClick={() => handleProfileChange("deep_brown")}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  profile === "deep_brown"
                    ? "bg-rust-500/15 border-rust-400/80 shadow-md shadow-rust-500/10"
                    : "bg-black/40 border-white/10 hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-white">Deep Brown</span>
                    {profile === "deep_brown" && <CheckCircle2 className="w-3.5 h-3.5 text-rust-400" />}
                  </div>
                  <p className="text-[10px] text-gray-400 leading-tight">
                    Sub-380Hz low rumble. Mutes racing thoughts & ADHD internal chatter.
                  </p>
                </div>
                <span className="text-[9px] font-mono text-rust-400 mt-2 font-semibold">
                  RECOMMENDED
                </span>
              </button>

              {/* Option 2: Binaural Theta */}
              <button
                onClick={() => handleProfileChange("binaural_theta")}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  profile === "binaural_theta"
                    ? "bg-rebel-500/15 border-rebel-400/80 shadow-md shadow-rebel-500/10"
                    : "bg-black/40 border-white/10 hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-white">4.5Hz Theta</span>
                    {profile === "binaural_theta" && <CheckCircle2 className="w-3.5 h-3.5 text-rebel-400" />}
                  </div>
                  <p className="text-[10px] text-gray-400 leading-tight">
                    Brown rumble + 4.5Hz binaural beat (headphones required for brain entrainment).
                  </p>
                </div>
                <span className="text-[9px] font-mono text-rebel-400 mt-2 font-semibold">
                  DEEP FLOW
                </span>
              </button>

              {/* Option 3: Thunder & Rain */}
              <button
                onClick={() => handleProfileChange("heavy_rain")}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  profile === "heavy_rain"
                    ? "bg-emerald-500/15 border-emerald-400/80 shadow-md shadow-emerald-500/10"
                    : "bg-black/40 border-white/10 hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-white">Thunder & Rain</span>
                    {profile === "heavy_rain" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <p className="text-[10px] text-gray-400 leading-tight">
                    Heavy organic rainfall with rolling sub-bass thunder. Calms task restlessness.
                  </p>
                </div>
                <span className="text-[9px] font-mono text-emerald-400 mt-2 font-semibold">
                  ORGANIC CALM
                </span>
              </button>

              {/* Option 4: Pink Cosmic */}
              <button
                onClick={() => handleProfileChange("pink_cosmic")}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  profile === "pink_cosmic"
                    ? "bg-purple-500/15 border-purple-400/80 shadow-md shadow-purple-500/10"
                    : "bg-black/40 border-white/10 hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-white">Cosmic Drift</span>
                    {profile === "pink_cosmic" && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                  </div>
                  <p className="text-[10px] text-gray-400 leading-tight">
                    Warm 680Hz pink noise + 55Hz analog cockpit drone. Late-night hyperfocus.
                  </p>
                </div>
                <span className="text-[9px] font-mono text-purple-400 mt-2 font-semibold">
                  EVENING FOCUS
                </span>
              </button>
            </div>
          </div>

          {/* Volume Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-300 flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-rebel-400" />
                <span>ACOUSTIC GAIN (VOLUME)</span>
              </span>
              <span className="text-rebel-400 font-bold">{volume}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-rebel-400"
            />
          </div>

          {/* Session Timer Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-300 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-rebel-400" />
                <span>SESSION TIMER PRESET</span>
              </span>
              {secondsRemaining !== null && (
                <span className="text-rust-400 font-bold animate-pulse">
                  {formatTimer(secondsRemaining)} REMAINING
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Infinite", mins: null },
                { label: "25 Min", mins: 25 },
                { label: "50 Min", mins: 50 },
                { label: "90 Min", mins: 90 },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleSetTimer(item.mins)}
                  className={`py-2 rounded-lg font-mono text-xs font-semibold border transition-all ${
                    timerMinutes === item.mins
                      ? "bg-rust-500/20 border-rust-400 text-rust-300"
                      : "bg-black/40 border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Neuroscience Callout */}
          <div className="p-3.5 rounded-xl bg-rebel-950/30 border border-rebel-500/30 text-[11px] font-mono text-gray-300 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-rebel-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>100% Continuous Gapless Loop:</strong> Synthesized procedural audio rendered with circular equal-power crossfading. The sound never cuts out, dips in volume, or clicks at loop transitions—providing unbroken, uninterrupted acoustic armor against ADHD distractions.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-rebel-900/40 bg-black/40 flex items-center justify-between text-[10px] font-mono text-gray-400">
          <span>Zero external audio streaming • Synthesized in-browser</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors"
          >
            Close HUD
          </button>
        </div>
      </div>
    </div>
  );
};
