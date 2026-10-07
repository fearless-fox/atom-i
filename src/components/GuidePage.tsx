/**
 * Guide Page — brief feature tour for new operators.
 * One-liners for every major system, with a CTA straight into the atomizer.
 */
import React from "react";
import {
  ArrowLeft,
  Atom,
  MessagesSquare,
  AudioWaveform,
  Grid2x2,
  CalendarClock,
  Sparkles,
  Waves,
  ChevronRight,
} from "lucide-react";

interface GuidePageProps {
  onBack: () => void;
  onAtomizeFirstGoal: () => void;
}

interface Feature {
  icon: React.ReactNode;
  name: string;
  tag: string;
  blurb: string;
}

const FEATURES: Feature[] = [
  {
    icon: <Atom className="w-5 h-5 text-rebel-400" />,
    name: "Objective Atomizer",
    tag: "THE ENGINE",
    blurb:
      "Describe any goal — big, small, chaotic, half-formed. The engine shatters it into phases, atomic tasks, and micro-steps on a living phase tree. Double-click any node to mark it complete.",
  },
  {
    icon: <MessagesSquare className="w-5 h-5 text-rebel-400" />,
    name: "AI Coach",
    tag: "SIDE CHANNEL",
    blurb:
      "A tactical mentor riding shotgun on every objective. Stuck, drifting, or overthinking a node? Ask — it answers from your actual objective data, not generic advice.",
  },
  {
    icon: <AudioWaveform className="w-5 h-5 text-rebel-400" />,
    name: "Live Voice Coach",
    tag: "WAR-ROOM BRIEFING",
    blurb:
      "Real-time voice sessions with the mentor. Talk through the objective out loud like a briefing. Available on Vanguard and Founder tiers.",
  },
  {
    icon: <Grid2x2 className="w-5 h-5 text-rebel-400" />,
    name: "Atom-I Matrix",
    tag: "PRIORITIZE",
    blurb:
      "The Eisenhower grid, automated. Every task lands in Do First, Schedule, Delegate, or Eliminate by its urgency and importance — no manual sorting.",
  },
  {
    icon: <CalendarClock className="w-5 h-5 text-rebel-400" />,
    name: "Chrono Planner",
    tag: "SCHEDULE",
    blurb:
      "Drag tasks onto your day and timebox them into reality. Syncs with Google Calendar so the plan survives contact with the outside world.",
  },
  {
    icon: <Sparkles className="w-5 h-5 text-rebel-400" />,
    name: "Hyperfocus Mode",
    tag: "EXECUTE",
    blurb:
      "A fullscreen violet particle field with deep brown noise. One task on screen, everything else gone. For the final push when it all needs to get done.",
  },
  {
    icon: <Waves className="w-5 h-5 text-rebel-400" />,
    name: "Brown Noise Ambience",
    tag: "ATMOSPHERE",
    blurb:
      "Seamless Brownian noise, binaural theta, heavy rain. Calms the restless mind without demanding attention — run it under any session.",
  },
];

export const GuidePage: React.FC<GuidePageProps> = ({ onBack, onAtomizeFirstGoal }) => {
  return (
    <div className="min-h-screen bg-[#0B0B0F] text-gray-200 animate-fade-in">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-mono text-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="uppercase font-bold">Cockpit</span>
          </button>
          <div className="font-mono text-[11px] tracking-[0.3em] text-rebel-400 uppercase">
            Field Manual
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="font-sans font-black text-3xl sm:text-4xl text-white tracking-tight mb-3">
            atom-i <span className="text-rebel-400 font-mono font-bold lowercase">field manual</span>
          </h1>
          <p className="text-sm text-gray-400 font-sans max-w-xl mx-auto leading-relaxed">
            Seven systems, one objective: turn overwhelming ambitions into finished
            work. Here is what everything does, briefly.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {FEATURES.map((f) => (
            <div
              key={f.name}
              className="rounded-2xl border border-white/10 bg-black/50 p-5 hover:border-rebel-500/40 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-9 h-9 rounded-xl bg-rebel-500/10 border border-rebel-500/30 flex items-center justify-center shrink-0">
                  {f.icon}
                </div>
                <div>
                  <div className="font-sans font-bold text-sm text-white">{f.name}</div>
                  <div className="font-mono text-[9px] tracking-[0.25em] text-gray-500 uppercase">
                    {f.tag}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 font-sans leading-relaxed">{f.blurb}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-rebel-500/30 bg-gradient-to-br from-rebel-950/40 via-black to-black p-8 text-center">
          <h2 className="font-sans font-black text-xl text-white mb-2">
            Enough reading. Start breaking things.
          </h2>
          <p className="text-xs text-gray-400 font-sans mb-5 max-w-md mx-auto">
            Your first objective is one click away. Describe it however it lives
            in your head — the engine handles the structure.
          </p>
          <button
            onClick={onAtomizeFirstGoal}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rebel-500 to-rebel-600 hover:from-rebel-400 hover:to-rebel-500 text-white font-mono text-sm font-bold uppercase tracking-wider shadow-lg shadow-rebel-500/25 transition-all"
          >
            <Atom className="w-4 h-4" />
            Atomize your first objective
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
