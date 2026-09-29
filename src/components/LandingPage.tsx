import React, { useState } from "react";
import { UserProfile, UserTier, SuccessStory } from "../types";
import {
  Zap,
  Shield,
  Layers,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Grid,
  Mic,
  Sparkles,
  Quote,
  Star,
  Users,
  Award,
  Flame,
  Cpu,
  Coins,
  Waves,
} from "lucide-react";
import { TIERS_CONFIG, VOICE_PACKS } from "./PaywallModal";

interface LandingPageProps {
  onEnterCockpit: () => void;
  onOpenPaywall: () => void;
  userProfile: UserProfile;
  successStories: SuccessStory[];
  onSelectTier: (tier: UserTier) => Promise<void>;
  onOpenFounderPerks?: () => void;
  onOpenTerms?: (tab?: "terms" | "privacy" | "refunds" | "support") => void;
}

export default function LandingPage({
  onEnterCockpit,
  onOpenPaywall,
  userProfile,
  successStories,
  onSelectTier,
  onOpenFounderPerks,
  onOpenTerms,
}: LandingPageProps) {
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  const isFounder =
    userProfile.tier === "founder_lifetime" || userProfile.isFounderLifetime;

  return (
    <div className="min-h-screen bg-[#06090e] text-gray-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-cyan-600/15 via-fuchsia-600/10 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/3 -right-60 w-[500px] h-[500px] bg-cyan-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-10 -left-40 w-[600px] h-[600px] bg-fuchsia-500/10 blur-3xl rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c132215_1px,transparent_1px),linear-gradient(to_bottom,#0c132215_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Navigation */}
      <header className="relative z-20 border-b border-cyan-900/30 bg-[#06090e]/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-700 flex items-center justify-center text-black font-extrabold shadow-lg shadow-cyan-500/20">
              <Zap className="w-5 h-5 text-black fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white">
                  A.T.O.M<span className="text-cyan-400 lowercase">-i</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
                  v3.8
                </span>
              </div>
              <p className="text-[10px] font-mono text-gray-400 tracking-wider">
                Advanced Tactical Operation Manager • atom-i
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenPaywall}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-gray-300 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>PACKAGES & FOUNDER PASS</span>
            </button>
            <button
              onClick={onEnterCockpit}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-mono text-xs font-extrabold uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/30 hover:scale-[1.02]"
            >
              <span>ENTER COCKPIT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-20 px-6 text-center max-w-5xl mx-auto">
        <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-mono text-xs uppercase tracking-widest mb-8">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>CONNECTED TO FIRESTORE: ATOM-I</span>
          <span className="text-gray-500">•</span>
          <span className="text-emerald-400 flex items-center gap-1 font-bold">
            <Cpu className="w-3 h-3" /> HIGH-VELOCITY NEURAL ENGINE ACTIVE
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08] mb-6">
          DECONSTRUCT AMBITION. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-fuchsia-400">
            EXECUTE WITH NEURAL PRECISION.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed mb-8">
          Transform overwhelming chaos into bite-sized, sub-second atomic moves.
          Powered by raw ADHD-tuned AI decomposition, ruthless 4-Quadrant triage, and live audio grit to obliterate executive paralysis.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onEnterCockpit}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-mono text-sm font-black uppercase tracking-wider transition-all shadow-xl shadow-cyan-500/30 hover:scale-[1.02]"
          >
            <span>LAUNCH ATOM-I COCKPIT</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenPaywall}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-mono text-sm font-bold tracking-wide transition-colors"
          >
            <Shield className="w-4 h-4 text-amber-400" />
            <span>FOUNDER PASS & TIERS</span>
          </button>
        </div>

        {/* Performance Metrics */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto font-mono text-left">
          <div className="p-4 rounded-xl bg-black/40 border border-cyan-900/30">
            <div className="text-xs text-gray-500 uppercase">INFERENCE SPEED</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">&lt;0.4s Latency</div>
            <div className="text-[11px] text-gray-400 mt-1">Multi-Core Neural Engine</div>
          </div>
          <div className="p-4 rounded-xl bg-black/40 border border-cyan-900/30">
            <div className="text-xs text-gray-500 uppercase">DECOMPOSITION</div>
            <div className="text-xl font-bold text-cyan-400 mt-1">3-Tier Hierarchy</div>
            <div className="text-[11px] text-gray-400 mt-1">Goal → Phase → Atom</div>
          </div>
          <div className="p-4 rounded-xl bg-black/40 border border-cyan-900/30">
            <div className="text-xs text-gray-500 uppercase">PRIORITIZATION</div>
            <div className="text-xl font-bold text-fuchsia-400 mt-1">Eisenhower 4Q</div>
            <div className="text-[11px] text-gray-400 mt-1">Urgency vs Importance</div>
          </div>
          <div className="p-4 rounded-xl bg-black/40 border border-cyan-900/30">
            <div className="text-xs text-gray-500 uppercase">PERSISTENCE</div>
            <div className="text-xl font-bold text-amber-400 mt-1">atom-i Firestore</div>
            <div className="text-[11px] text-gray-400 mt-1">Real-time cloud sync & offline persistence</div>
          </div>
        </div>
      </section>

      {/* Feature Pillar Highlights */}
      <section className="relative z-10 py-16 px-6 max-w-7xl mx-auto border-t border-cyan-900/20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            ENGINEERED FOR SUPREME EXECUTION VELOCITY
          </h2>
          <p className="text-sm text-gray-400 mt-3 font-mono">
            Every screen and capability is built to eliminate cognitive friction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-[#090e17] border border-cyan-500/20 hover:border-cyan-400/50 transition-all flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-5">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Hierarchical Node Map</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Visual interactive mindmap graph decomposing enterprise objectives into sequential phases and atomic task nodes.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-white/5 flex items-center gap-1.5 text-[11px] font-mono text-cyan-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>All Tiers Included</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#090e17] border border-fuchsia-500/20 hover:border-fuchsia-400/50 transition-all flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 mb-5">
                <Grid className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Eisenhower Tactical Grid</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                4-quadrant urgent-important triage sorting. Distinguish high-impact needle-movers from distractions instantly.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-white/5 flex items-center gap-1.5 text-[11px] font-mono text-fuchsia-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tactical Pro & Vanguard</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#090e17] border border-emerald-500/20 hover:border-emerald-400/50 transition-all flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Chrono Schedule Planner</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Direct time-blocking calendar engine. Drag tasks into scheduled hour slots to ensure disciplined daily work.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-white/5 flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tactical Pro & Vanguard</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#090e17] border border-amber-500/20 hover:border-amber-400/50 transition-all flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 mb-5">
                <Waves className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Brown Noise Ambience</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Procedural 1/f² soundscape & 4.5Hz theta brainwave audio. Suppresses ADHD task inertia and ambient speech.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-white/5 flex items-center gap-1.5 text-[11px] font-mono text-amber-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Zero Bandwidth • Built-in</span>
            </div>
          </div>
        </div>
      </section>

      {/* Real Success Stories from Firestore */}
      <section className="relative z-10 py-16 px-6 max-w-6xl mx-auto border-t border-cyan-900/20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-widest mb-2">
              <Award className="w-4 h-4" />
              <span>VERIFIED OPERATOR EXPERIENCES (atom-i/success_stories)</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Real Teams, Atomic Results
            </h2>
          </div>
          <p className="text-xs font-mono text-gray-400">
            Displaying {successStories.length} live testimonials from Firestore
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {successStories.map((story) => (
            <div
              key={story.id}
              className="p-6 rounded-2xl bg-[#080d15] border border-cyan-900/30 hover:border-cyan-500/40 transition-all flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{story.goalTitle}</span>
                </div>
                <p className="text-sm text-gray-300 italic leading-relaxed">
                  "{story.quote}"
                </p>

                {story.stepsCompleted && story.stepsCompleted.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="text-[10px] font-mono text-gray-500 uppercase mb-2">
                      Key Accomplished Milestones:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {story.stepsCompleted.map((step, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-[11px] font-mono text-emerald-300"
                        >
                          ✓ {step}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{story.authorName}</div>
                  <div className="text-xs font-mono text-gray-500">Operator ID: {story.userId}</div>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing & Packages Section with Option B & Option C */}
      <section className="relative z-10 py-16 px-6 max-w-7xl mx-auto border-t border-cyan-900/20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-3">
            <Shield className="w-4 h-4" />
            <span>DEPLOYMENT TIERS & FOUNDER OFFER</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Option A Tiers + Founder Pass
          </h2>
          <p className="text-sm text-gray-400 mt-2 font-mono">
            Select your tier or secure the limited first-199 lifetime founder pass.
          </p>
        </div>

        {/* Option B Founder Banner in Landing Page */}
        <div className="mb-10 rounded-2xl border-2 border-amber-500/60 bg-gradient-to-r from-amber-950/50 via-purple-950/30 to-cyan-950/40 p-6 shadow-2xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-black font-mono text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-black" />
                  FIRST 199 OPERATORS ONLY
                </span>
                <span className="text-amber-300 font-mono text-xs font-bold">137 / 199 CLAIMED • ONLY 62 REMAINING</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                The Founder Lifetime Pass — $99 One-Time (No Subscriptions)
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Full Tactical Pro capabilities (unlimited objectives, Eisenhower Matrix, Chrono Planner, Firestore sync) forever. Includes 60 included Live Voice minutes, exclusive <strong>Genesis Holographic NFT Badge</strong>, and complimentary <strong>Official atom-i Die-Cut Metallic Sticker Pack</strong> mailed free worldwide.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              {onOpenFounderPerks && (
                <button
                  onClick={onOpenFounderPerks}
                  className="w-full sm:w-auto px-4 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-amber-400/40 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg"
                  title="Preview the Interactive 3D Holographic Genesis Badge"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Preview 3D NFT Badge
                </button>
              )}
              <button
                onClick={onOpenPaywall}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-mono text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-amber-500/20 whitespace-nowrap"
              >
                {isFounder ? "Founder Status Active" : "Claim Lifetime Pass ($99)"}
              </button>
            </div>
          </div>
        </div>

        {/* Option A Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {Object.values(TIERS_CONFIG).map((config) => {
            const isCurrent = userProfile.tier === config.tierKey && !isFounder;

            return (
              <div
                key={config.tierKey}
                className={`relative rounded-2xl p-6 border flex flex-col justify-between ${
                  config.border
                } ${config.bg} ${
                  isCurrent
                    ? "ring-2 ring-cyan-400 shadow-2xl shadow-cyan-950/60"
                    : "hover:border-white/20"
                }`}
              >
                {config.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-[10px] font-mono font-bold text-black uppercase tracking-wider">
                    MOST POPULAR
                  </div>
                )}

                <div>
                  <h3 className={`text-lg font-bold ${config.color} mb-1`}>{config.name}</h3>
                  <p className="text-xs text-gray-400 min-h-[36px]">{config.tagline}</p>

                  <div className="mt-5 mb-6">
                    <span className="text-4xl font-black text-white">{config.price}</span>
                    <span className="text-xs text-gray-400 font-mono ml-1">{config.period}</span>
                  </div>

                  <div className="space-y-3 text-xs text-gray-300 font-mono border-t border-white/5 pt-5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{config.atomizationLimit}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Interactive Node Map</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          config.hasGrid ? "text-emerald-400" : "text-gray-600"
                        }`}
                      />
                      <span className={config.hasGrid ? "text-gray-200" : "text-gray-500"}>
                        Eisenhower 4Q Matrix
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          config.hasCalendar ? "text-emerald-400" : "text-gray-600"
                        }`}
                      />
                      <span className={config.hasCalendar ? "text-gray-200" : "text-gray-500"}>
                        Chrono Schedule Planner
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          config.hasLiveVoice ? "text-fuchsia-400" : "text-gray-600"
                        }`}
                      />
                      <span className={config.hasLiveVoice ? "text-fuchsia-300 font-bold" : "text-gray-500"}>
                        {config.voiceMinutesIncluded > 0
                          ? `Live Voice (${config.voiceMinutesIncluded} min/mo)`
                          : "Live Voice Coach"}
                      </span>
                    </div>
                    {config.featuredEligible && (
                      <div className="flex items-center gap-2 text-amber-300 font-semibold">
                        <Award className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Featured Story Eligible</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-white/5">
                  <button
                    disabled={isCurrent || isFounder}
                    onClick={() => {
                      onSelectTier(config.tierKey);
                      onEnterCockpit();
                    }}
                    className={`w-full py-3 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                      isCurrent
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default"
                        : isFounder
                        ? "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
                        : "bg-cyan-400 hover:bg-cyan-300 text-black shadow-lg shadow-cyan-950/40 hover:scale-[1.02]"
                    }`}
                  >
                    {isCurrent ? "Active Tier" : isFounder ? "Covered by Founder Pass" : `Activate ${config.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Option C Voice Top-Up Upsell info */}
        <div className="p-6 rounded-2xl bg-[#080d16] border border-fuchsia-900/40 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-fuchsia-400 font-mono text-xs uppercase mb-1">
              <Mic className="w-4 h-4" />
              <span>OPTION C • VOICE MINUTE REFILL PACKS</span>
            </div>
            <h4 className="text-base font-bold text-white">Need extra audio coaching minutes?</h4>
            <p className="text-xs text-gray-400 mt-1">
              Purchase standalone voice credits starting at $5 for 30 minutes. Refills never expire.
            </p>
          </div>
          <button
            onClick={onOpenPaywall}
            className="px-5 py-2.5 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 text-black font-mono text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
          >
            Browse Voice Packs
          </button>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="relative z-10 border-t border-cyan-900/30 py-12 px-6 bg-[#04060a]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <div className="text-base font-black text-white tracking-wider flex items-center justify-center md:justify-start gap-2">
              <Zap className="w-4 h-4 text-cyan-400 fill-current" />
              <span>A.T.O.M-i TACTICAL SYSTEMS</span>
            </div>
            <p className="text-xs text-gray-500 font-mono mt-1">
              Firestore: <span className="text-gray-400">atom-i</span> • Engine: <span className="text-cyan-400">Multi-Model Neural Core</span> • Security: <span className="text-emerald-400">Encrypted Cloud Storage</span>
            </p>
            {/* Legal Links */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3 text-[11px] font-mono text-gray-400">
              <button
                onClick={() => onOpenTerms && onOpenTerms("terms")}
                className="hover:text-cyan-300 underline transition-colors"
              >
                Terms of Service
              </button>
              <span>•</span>
              <button
                onClick={() => onOpenTerms && onOpenTerms("refunds")}
                className="hover:text-cyan-300 underline transition-colors"
              >
                Return &amp; Refund Policy
              </button>
              <span>•</span>
              <button
                onClick={() => onOpenTerms && onOpenTerms("privacy")}
                className="hover:text-cyan-300 underline transition-colors"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button
                onClick={() => onOpenTerms && onOpenTerms("support")}
                className="hover:text-cyan-300 underline text-cyan-400 transition-colors font-semibold"
              >
                Support: faux.machine@gmail.com
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenPaywall}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-gray-300 border border-white/10"
            >
              Founder Pass & Tiers
            </button>
            <button
              onClick={onEnterCockpit}
              className="px-5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-mono text-xs font-bold uppercase tracking-wider shadow-lg shadow-cyan-500/20"
            >
              Launch Cockpit
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
