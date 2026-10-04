/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { X, Check, Volume2, Mic, Sparkles, Shield, User, Globe } from "lucide-react";
import { cyberAudio } from "../lib/cyberAudio";

export interface MaleVoiceOption {
  id: string;
  name: string; // Gemini voice identifier (e.g. "Pegasus", "Charon", etc.)
  displayName: string;
  accent: "uk" | "global";
  accentLabel: string;
  timbre: string;
  tagline: string;
  description: string;
  recommended?: boolean;
}

export const MALE_VOICE_CATALOG: MaleVoiceOption[] = [
  {
    id: "pegasus-uk",
    name: "Pegasus",
    displayName: "Pegasus (English U.K. Grit)",
    accent: "uk",
    accentLabel: "British / English (U.K.)",
    timbre: "Deep, Engaged, Articulate",
    tagline: "Authentic British mentor with raw, razor-sharp momentum",
    description: "Deep, resonant, and genuinely articulate British cadence. Cuts straight through ADHD paralysis and executive dysfunction with direct, authentic clarity—no corporate fluff, no academic waffle.",
    recommended: true,
  },
  {
    id: "charon-uk",
    name: "Charon",
    displayName: "Charon (Distinguished British Male)",
    accent: "uk",
    accentLabel: "British / Transatlantic",
    timbre: "Smooth, Calm, Authoritative",
    tagline: "Measured, stately sovereign intelligence",
    description: "A polished, ultra-composed British/Transatlantic male voice. Ideal for high-pressure focus, deep work debriefs, and calm executive decision-making.",
    recommended: false,
  },
  {
    id: "pegasus-us",
    name: "Pegasus",
    displayName: "Pegasus (Deep Raw Grit)",
    accent: "global",
    accentLabel: "Raw ADHD Focus (Global / US)",
    timbre: "Resonant, Intense, Engaged",
    tagline: "Deep, relentless momentum that beats procrastination",
    description: "The classic deep Gemini Live male voice. High energy, raw focus, and authentic push to get you out of your head and into immediate action.",
    recommended: false,
  },
  {
    id: "orion-uk",
    name: "Orion",
    displayName: "Orion (Bright British Strategist)",
    accent: "uk",
    accentLabel: "British / English (U.K.)",
    timbre: "Bright, Crisp, Deeper",
    tagline: "Sharp, high-cadence analytical strategist",
    description: "A clear, deeper male tone with crisp British inflection. Cuts through distraction with razor-sharp analytical observations and brisk task acceleration.",
    recommended: false,
  },
  {
    id: "fenrir-global",
    name: "Fenrir",
    displayName: "Fenrir (Field Commander)",
    accent: "global",
    accentLabel: "Commanding (Global)",
    timbre: "Resolute, Bold, Deep",
    tagline: "Hard-hitting operational grit and focus",
    description: "A commanding field-officer cadence built for grinding through stubborn roadblocks and executing difficult daily quotas without excuses.",
    recommended: false,
  },
  {
    id: "puck-uk",
    name: "Puck",
    displayName: "Puck (Agile English Tactician)",
    accent: "uk",
    accentLabel: "British / English (U.K.)",
    timbre: "Dynamic, Engaging, Adaptive",
    tagline: "High-energy, nimble British sprint coach",
    description: "A dynamic, adaptable voice with crisp UK phrasing designed to keep energy high during rapid sprint decomposition sessions.",
    recommended: false,
  },
];

interface MaleVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoice: string; // e.g. "Pegasus"
  selectedAccent: "uk" | "global"; // "uk" or "global"
  onSelectVoice: (voice: string, accent: "uk" | "global") => void;
  isConnected?: boolean;
}

export const MaleVoiceModal: React.FC<MaleVoiceModalProps> = ({
  isOpen,
  onClose,
  selectedVoice,
  selectedAccent,
  onSelectVoice,
  isConnected = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="male-voice-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#070913] border border-rebel-500/30 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col relative tactical-corner-frame"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header */}
        <div className="p-4 bg-black/80 border-b border-rebel-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rebel-500 to-indigo-600 p-0.5 shadow-lg shadow-rebel-500/20 flex items-center justify-center text-white">
              <Mic className="w-5 h-5 text-rebel-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans font-bold text-sm text-white tracking-wider flex items-center">
                  atom-i <span className="text-rebel-400 font-mono font-bold lowercase ml-1.5">male voice matrix</span>
                </h3>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-rebel-950/60 text-rebel-300 border border-rebel-500/30">
                  GEMINI 3.8 LIVE AUDIO
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-mono">
                Configure your tactical male synthetic neural core and British (U.K.) cadence
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              cyberAudio.playCyberClick(0.9);
              onClose();
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Accent Quick Toggle Banner */}
        <div className="p-3.5 bg-gradient-to-r from-rebel-950/40 via-blue-950/20 to-black border-b border-rebel-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-rebel-400" />
            <span className="text-xs font-mono text-gray-200">
              TACTICAL DIALECT PROTOCOL:
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                cyberAudio.playCyberClick(1.2);
                onSelectVoice(selectedVoice, "uk");
              }}
              className={`px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-1.5 ${
                selectedAccent === "uk"
                  ? "bg-rebel-500/20 border border-rebel-400 text-rebel-300 shadow-md shadow-rebel-950/50"
                  : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              <span>🇬🇧 English (U.K.) Accent</span>
              {selectedAccent === "uk" && <Check className="w-3 h-3 text-rebel-400" />}
            </button>
            <button
              onClick={() => {
                cyberAudio.playCyberClick(1.1);
                onSelectVoice(selectedVoice, "global");
              }}
              className={`px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-1.5 ${
                selectedAccent === "global"
                  ? "bg-rebel-500/20 border border-rebel-400 text-rebel-300 shadow-md shadow-rebel-950/50"
                  : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              <span>🌐 Deep Global</span>
              {selectedAccent === "global" && <Check className="w-3 h-3 text-rebel-400" />}
            </button>
          </div>
        </div>

        {/* Voice Cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-black/40">
          {MALE_VOICE_CATALOG.map((v) => {
            const isSelected = selectedVoice.toLowerCase() === v.name.toLowerCase() && selectedAccent === v.accent;
            return (
              <div
                key={v.id}
                onClick={() => {
                  cyberAudio.playCyberClick(1.3);
                  onSelectVoice(v.name, v.accent);
                }}
                className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-start justify-between gap-3 hover-focus-trace ${
                  isSelected
                    ? "bg-rebel-950/60 border-rebel-400 shadow-lg shadow-rebel-950/60 ring-1 ring-rebel-500/40"
                    : "bg-white/[0.02] border-white/10 hover:border-rebel-500/30 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-sans font-bold text-xs text-white">
                      {v.displayName}
                    </h4>
                    {v.recommended && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rebel-950/80 text-rebel-300 border border-rebel-400/50 font-bold">
                        ★ TOP CHOICE
                      </span>
                    )}
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-500/30">
                      {v.timbre}
                    </span>
                  </div>

                  <p className="text-[11px] text-rebel-300 font-mono mt-1">
                    "{v.tagline}"
                  </p>

                  <p className="text-[11px] text-gray-400 font-sans mt-1 leading-relaxed">
                    {v.description}
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-[9px] font-mono text-gray-500">
                    <span>ACCENT: <strong className="text-gray-300">{v.accentLabel}</strong></span>
                    <span>•</span>
                    <span>VOICE MODEL: <strong className="text-rebel-400">{v.name}</strong></span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-center pt-1">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      isSelected
                        ? "border-rebel-400 bg-rebel-400 text-black shadow-md shadow-rebel-400/50"
                        : "border-gray-700 bg-transparent text-transparent"
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info & confirm */}
        <div className="p-4 bg-black/80 border-t border-rebel-900/30 flex items-center justify-between">
          <p className="text-[10px] font-mono text-gray-500 max-w-sm">
            {isConnected
              ? "⚡ Active live session will apply this voice upon next reconnection or message."
              : "Voice selected will deploy when you tap Connect Voice Session."}
          </p>
          <button
            onClick={() => {
              cyberAudio.playCyberClick(1.0);
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-rebel-500 hover:bg-rebel-400 text-black font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-rebel-500/20"
          >
            Confirm Voice
          </button>
        </div>
      </div>
    </div>
  );
};
