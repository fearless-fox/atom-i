import React, { useState } from "react";
import { X, Shield, FileText, CheckCircle2, AlertCircle, ArrowLeft, ExternalLink, Scale, Lock, RefreshCw, Mail } from "lucide-react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "terms" | "privacy" | "refunds";
}

export default function TermsModal({ isOpen, onClose, defaultTab = "terms" }: TermsModalProps) {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy" | "refunds">(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-[#080d15] border border-cyan-500/40 p-6 md:p-8 shadow-2xl shadow-cyan-950/60 my-8 max-h-[90vh] flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  A.T.O.M<span className="text-cyan-400 lowercase">-i</span> Legal &amp; Compliance Center
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                  STRIPE VERIFIED
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono">
                Terms of Service, Billing Policy &amp; Customer Agreement • Effective Date: January 2026
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 mt-4 mb-4 border-b border-white/5 pb-2 shrink-0">
          <button
            onClick={() => setActiveTab("terms")}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "terms"
                ? "bg-cyan-500 text-black shadow-md shadow-cyan-950/50"
                : "text-gray-400 hover:text-white bg-white/5"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Terms of Service</span>
          </button>
          <button
            onClick={() => setActiveTab("refunds")}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "refunds"
                ? "bg-cyan-500 text-black shadow-md shadow-cyan-950/50"
                : "text-gray-400 hover:text-white bg-white/5"
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refunds &amp; Cancellations</span>
          </button>
          <button
            onClick={() => setActiveTab("privacy")}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "privacy"
                ? "bg-cyan-500 text-black shadow-md shadow-cyan-950/50"
                : "text-gray-400 hover:text-white bg-white/5"
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Privacy &amp; Data Security</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto pr-2 space-y-6 text-xs text-gray-300 font-sans leading-relaxed">
          {activeTab === "terms" && (
            <div className="space-y-6">
              <section className="bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-4">
                <h3 className="text-sm font-bold text-cyan-300 font-mono uppercase mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  1. Agreement to Terms
                </h3>
                <p>
                  These Terms of Service (&quot;Agreement&quot;) constitute a legally binding agreement between you (&quot;Customer&quot;, &quot;User&quot;, or &quot;Operator&quot;) and <strong>A.T.O.M-i Systems</strong> (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), governing your access to and use of the A.T.O.M-i SaaS application, goal decomposition engines, Eisenhower Matrix organizers, Chrono schedule planners, and Gemini Live Voice debriefing services.
                </p>
                <p className="mt-2 text-gray-400">
                  By clicking &quot;Activate&quot;, &quot;Claim Founder Pass&quot;, subscribing via Stripe Checkout, or accessing the service, you agree to be bound by these Terms and all incorporated policies.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  2. Product Tiers, Billing &amp; Subscriptions
                </h3>
                <p>
                  A.T.O.M-i provides both recurring subscription tiers, standalone one-time lifetime passes, and consumable add-on audio credits:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-300">
                  <li>
                    <strong>Operative Tier (Free)</strong>: Free visual goal decomposition limited to 3 active objectives, interactive node visualization, and basic local persistence.
                  </li>
                  <li>
                    <strong>Tactical Pro Subscription ($15/month or $150/year)</strong>: Unlocks unlimited objective atomization, 4-Quadrant Eisenhower Matrix, Chrono Day Planner, and 15 monthly voice debrief minutes.
                  </li>
                  <li>
                    <strong>Vanguard Live Subscription ($25/month or $250/year)</strong>: Unlocks all Tactical Pro features, 120 monthly Gemini 3.8 Live Voice coaching minutes, multi-member team synchronization, and priority neural execution.
                  </li>
                  <li>
                    <strong>Founder Lifetime Pass ($99 one-time payment)</strong>: A strictly capped non-recurring lifetime access license (limited to 199 operators) granting lifetime Tactical Pro entitlements without recurring subscription fees for the operational lifetime of the platform.
                  </li>
                  <li>
                    <strong>Voice Credit Minute Add-On Packs ($5 for 30m, $12 for 100m, $29 for 300m)</strong>: One-time consumable digital credits consumed in real-time during audio debriefs. Minutes do not expire while account is in good standing.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  3. Payment Processing via Stripe
                </h3>
                <p>
                  All transactions, recurring subscriptions, and payment methods are securely handled by <strong>Stripe, Inc.</strong> as our third-party payment processor. We do not store, process, or transmit raw credit card numbers or payment card CVV codes on our servers. You authorize Stripe to charge your designated payment method for all applicable subscription and purchase fees.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  4. Artificial Intelligence &amp; Autonomous Advice Disclaimer
                </h3>
                <p>
                  A.T.O.M-i utilizes advanced machine learning architectures (including Google Gemini 3.8 Flash, Gemini Live Audio API, and Puter AI). <strong>All task breakdowns, timeline suggestions, and coaching dialogues are generated algorithmically for productivity and brainstorming purposes only.</strong>
                </p>
                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-200">
                  <p className="font-semibold">⚠️ Notice Regarding Professional Advice:</p>
                  <p className="mt-1 text-amber-300/90">
                    A.T.O.M-i does not provide certified legal, medical, accounting, financial, or engineering counsel. Operators are solely responsible for verifying the feasibility, safety, and legal compliance of any objective or decomposed execution plan.
                  </p>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  5. User Data &amp; Intellectual Property Ownership
                </h3>
                <p>
                  You retain 100% ownership of your proprietary goal plans, project blueprints, task descriptions, personal notes, and team rosters created within A.T.O.M-i. We claim no ownership over your inputs or generated project assets.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  6. Limitation of Liability
                </h3>
                <p>
                  To the maximum extent permitted by applicable law, A.T.O.M-i and its operators shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from lost profits, interrupted workflows, data corruption, or reliance on AI-generated timelines.
                </p>
              </section>
            </div>
          )}

          {activeTab === "refunds" && (
            <div className="space-y-6">
              <section className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4">
                <h3 className="text-sm font-bold text-emerald-300 font-mono uppercase mb-2 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  Cancellation &amp; Refund Policy
                </h3>
                <p>
                  We strive for total transparency in our billing. We want every operator to be 100% satisfied with A.T.O.M-i execution velocity.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  1. How to Cancel Your Subscription
                </h3>
                <p>
                  You may cancel your Monthly or Annual subscription at any time without penalty or cancellation fees:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-300">
                  <li>
                    Click on the <strong>Stripe Customer Portal</strong> link in your email receipt, or contact support directly.
                  </li>
                  <li>
                    Upon cancellation, your subscription will not renew at the next billing date.
                  </li>
                  <li>
                    You will retain full access to all features of your active protocol until the end of the current billing cycle already paid for.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  2. 14-Day Refund Guarantee (Subscriptions &amp; Founder Pass)
                </h3>
                <p>
                  If you purchase a <strong>Tactical Pro</strong> subscription, <strong>Vanguard Live</strong> subscription, or <strong>Founder Lifetime Pass</strong> and determine within <strong>14 days of initial purchase</strong> that the platform does not meet your needs, contact us for a full refund of your most recent charge.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  3. Consumable Voice Credits
                </h3>
                <p>
                  Voice minute credit top-ups are consumable digital goods. Unused minutes are eligible for refund within 14 days of purchase. Minutes that have already been streamed or utilized during live Gemini sessions are non-refundable.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  4. Support &amp; Billing Inquiries
                </h3>
                <p>
                  To request a cancellation, invoice copy, or refund review, reach out directly with your checkout email:
                </p>
                <div className="p-3 rounded-lg bg-black/60 border border-cyan-500/30 flex items-center gap-3">
                  <Mail className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-white font-mono font-bold text-xs">A.T.O.M-i Merchant Support</div>
                    <div className="text-cyan-300 font-mono text-[11px]">faux.fuax@gmail.com</div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="space-y-6">
              <section className="bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-4">
                <h3 className="text-sm font-bold text-cyan-300 font-mono uppercase mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  Privacy &amp; Data Security Constitution
                </h3>
                <p>
                  Your privacy and intellectual property are sacred. A.T.O.M-i operates with strict zero-telemetry discipline and zero-surveillance design.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  1. Information We Collect
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-gray-300">
                  <li>
                    <strong>Authentication Data</strong>: When you authenticate via Google Sign-In, we receive your email address, display name, and unique user identifier (UID).
                  </li>
                  <li>
                    <strong>Objective Data</strong>: The goal hierarchy, milestones, and Eisenhower quadrant tasks you create are stored in your private Firestore database partitions protected by security rules.
                  </li>
                  <li>
                    <strong>Billing Data</strong>: Your payment information is stored exclusively by Stripe. We only receive confirmation of payment, tier level, and renewal status.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  2. AI Model Data Transmission
                </h3>
                <p>
                  When you request an AI decomposition or participate in a Gemini Live Voice session, prompt text and audio packets are transmitted via encrypted server proxy directly to Google Cloud enterprise endpoints. Your data is not sold to third-party data brokers.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  3. Data Deletion &amp; Export
                </h3>
                <p>
                  You maintain full rights to export your goals as JSON or clear your cloud database at any time directly through the cockpit interface.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="text-[11px] font-mono text-gray-400">
            Compliant with Stripe Merchant Requirements • Host: <span className="text-cyan-400">atom-i</span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-md shadow-cyan-950/40"
          >
            I Acknowledge &amp; Accept
          </button>
        </div>
      </div>
    </div>
  );
}
