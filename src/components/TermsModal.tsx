import React, { useState, useEffect } from "react";
import {
  X,
  Shield,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Scale,
  Lock,
  RefreshCw,
  Mail,
  Copy,
  Check,
  Headphones,
  Clock,
  Send,
  HelpCircle,
  DollarSign,
  PackageCheck
} from "lucide-react";

export type LegalTab = "terms" | "refunds" | "privacy" | "support";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: LegalTab;
}

export default function TermsModal({ isOpen, onClose, defaultTab = "terms" }: TermsModalProps) {
  const [activeTab, setActiveTab] = useState<LegalTab>(defaultTab);
  const [copied, setCopied] = useState(false);
  const [supportSubject, setSupportSubject] = useState("Billing & Refund Request");
  const [supportMessage, setSupportMessage] = useState("");

  const SUPPORT_EMAIL = "faux.machine@gmail.com";

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, isOpen]);

  if (!isOpen) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      `[A.T.O.M-i Support] ${supportSubject}`
    )}&body=${encodeURIComponent(supportMessage || "Hello A.T.O.M-i Support Team,\n\nI need assistance with...")}`;
    window.location.href = mailtoUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-[#080d15] border border-cyan-500/40 p-6 md:p-8 shadow-2xl shadow-cyan-950/60 my-8 max-h-[90vh] flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  A.T.O.M<span className="text-cyan-400 lowercase">-i</span> Legal &amp; Support Center
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                  STRIPE VERIFIED
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                  24H SUPPORT SLA
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Official Terms of Service, Return &amp; Refund Policy, Privacy, &amp; Support
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close legal modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 mt-4 mb-4 border-b border-white/5 pb-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab("terms")}
            className={`px-3.5 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
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
            className={`px-3.5 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "refunds"
                ? "bg-cyan-500 text-black shadow-md shadow-cyan-950/50"
                : "text-gray-400 hover:text-white bg-white/5"
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Return &amp; Refund Policy</span>
          </button>
          <button
            onClick={() => setActiveTab("privacy")}
            className={`px-3.5 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "privacy"
                ? "bg-cyan-500 text-black shadow-md shadow-cyan-950/50"
                : "text-gray-400 hover:text-white bg-white/5"
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Privacy Policy</span>
          </button>
          <button
            onClick={() => setActiveTab("support")}
            className={`px-3.5 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "support"
                ? "bg-cyan-500 text-black shadow-md shadow-cyan-950/50"
                : "text-gray-400 hover:text-white bg-white/5"
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>Contact Support</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto pr-2 space-y-6 text-xs text-gray-300 font-sans leading-relaxed">
          {/* TAB 1: TERMS OF SERVICE */}
          {activeTab === "terms" && (
            <div className="space-y-6">
              <section className="bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-4">
                <h3 className="text-sm font-bold text-cyan-300 font-mono uppercase mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  1. Agreement to Terms
                </h3>
                <p>
                  These Terms of Service (&quot;Agreement&quot;) constitute a legally binding agreement between you (&quot;Customer&quot;, &quot;User&quot;, or &quot;Operator&quot;) and <strong>A.T.O.M-i Systems</strong> (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), governing your access to and use of the A.T.O.M-i application, goal decomposition engines, Eisenhower Matrix organizers, Chrono schedule planners, and Gemini Live Voice debriefing services.
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
                  A.T.O.M-i provides recurring subscription tiers, standalone one-time lifetime passes, and consumable add-on audio credits:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-300">
                  <li>
                    <strong>Operative Tier (Free)</strong>: Visual goal decomposition limited to 3 active objectives, interactive node visualization, and basic local persistence.
                  </li>
                  <li>
                    <strong>Tactical Pro Subscription ($15/month or $150/year)</strong>: Unlocks unlimited objective atomization, 4-Quadrant Eisenhower Matrix, Chrono Day Planner, and 15 monthly voice debrief minutes.
                  </li>
                  <li>
                    <strong>Vanguard Live Subscription ($25/month or $250/year)</strong>: Unlocks all Tactical Pro features, 120 monthly Gemini 3.8 Live Voice coaching minutes, multi-member team synchronization, and priority neural execution.
                  </li>
                  <li>
                    <strong>Founder Lifetime Pass ($99 one-time payment)</strong>: A strictly capped non-recurring lifetime access license (limited to 199 operators) granting lifetime Tactical Pro entitlements without recurring subscription fees.
                  </li>
                  <li>
                    <strong>Voice Credit Minute Add-On Packs ($5 for 30m, $12 for 100m, $29 for 300m)</strong>: One-time consumable digital credits consumed in real-time during audio debriefs.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  3. Payment Processing via Stripe
                </h3>
                <p>
                  All transactions, recurring subscriptions, and payment methods are securely handled by <strong>Stripe, Inc.</strong> as our third-party payment processor. We do not store, process, or transmit raw credit card numbers or CVV codes on our servers. You authorize Stripe to charge your designated payment method for all applicable fees.
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

          {/* TAB 2: RETURN & REFUND POLICY */}
          {activeTab === "refunds" && (
            <div className="space-y-6">
              <section className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4">
                <h3 className="text-sm font-bold text-emerald-300 font-mono uppercase mb-2 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  Return &amp; Refund Policy (Stripe Compliant)
                </h3>
                <p>
                  We stand behind the execution velocity of A.T.O.M-i. If you are not satisfied with your purchase, we provide a clear, no-hassle return and refund policy outlined below.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-cyan-400" />
                  1. 14-Day Full Money-Back Guarantee
                </h3>
                <p>
                  If you purchase a <strong>Tactical Pro</strong> subscription (Monthly or Yearly), <strong>Vanguard Live</strong> subscription (Monthly or Yearly), or <strong>Founder Lifetime Pass</strong>, you are entitled to a <strong>100% full refund within 14 days</strong> of your initial purchase date if you are unsatisfied for any reason.
                </p>
                <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-cyan-200">
                  <p className="font-semibold">How to Request Your Refund:</p>
                  <p className="mt-1">
                    Simply send an email to <strong className="text-white font-mono">{SUPPORT_EMAIL}</strong> with the subject line <em>&quot;Refund Request&quot;</em> and your Stripe checkout email. We process all valid refund requests within <strong>24 business hours</strong>. Refunds are credited back to your original payment method via Stripe (typically appearing in 5-10 business days depending on your bank).
                  </p>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  2. Easy Subscription Cancellation
                </h3>
                <p>
                  You can cancel your subscription at any time without penalty, lock-in, or cancellation fees:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-gray-300">
                  <li>
                    Click the <strong>Manage Subscription / Stripe Portal</strong> link found in your Stripe email receipt.
                  </li>
                  <li>
                    Or email <strong className="text-white font-mono">{SUPPORT_EMAIL}</strong> asking to cancel future renewals.
                  </li>
                  <li>
                    Upon cancellation, you retain full access through the end of the billing period you already paid for, and no further charges will occur.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-amber-400" />
                  3. Founder Pass Physical Merchandise &amp; Returns
                </h3>
                <p>
                  Founder Pass operators who receive physical bonus items (such as the Holographic Cyberpunk Sticker Pack) are not required to return physical stickers to receive a digital refund within the 14-day refund window. If physical merchandise arrives damaged or defective, email <strong className="text-white font-mono">{SUPPORT_EMAIL}</strong> with a photo for a free replacement.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  4. Voice Minute Add-On Packs
                </h3>
                <p>
                  Unused voice minute packs (VP-30, VP-100, VP-300) are eligible for a 100% refund within 14 days of purchase. Minutes that have already been streamed or consumed during live coaching audio sessions are non-refundable.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  5. Dedicated Support Contact for Billing
                </h3>
                <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-6 h-6 text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-white font-mono font-bold text-xs">Official Billing &amp; Returns Desk</div>
                      <div className="text-cyan-300 font-mono text-xs">{SUPPORT_EMAIL}</div>
                      <div className="text-gray-400 text-[11px] mt-0.5">Response Time: Under 24 hours guaranteed</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("support")}
                    className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold transition-colors shrink-0"
                  >
                    Open Contact Form
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* TAB 3: PRIVACY POLICY */}
          {activeTab === "privacy" && (
            <div className="space-y-6">
              <section className="bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-4">
                <h3 className="text-sm font-bold text-cyan-300 font-mono uppercase mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  Privacy &amp; Data Security Constitution
                </h3>
                <p>
                  Your privacy and intellectual property are sacred. A.T.O.M-i operates with strict zero-telemetry discipline and zero-surveillance design. We never sell, rent, or monetize your personal information or objective blueprints.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  1. Information We Collect
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-gray-300">
                  <li>
                    <strong>Authentication Data</strong>: When you authenticate via Google Sign-In or Firebase Auth, we receive your email address, display name, and unique user identifier (UID).
                  </li>
                  <li>
                    <strong>Objective &amp; Productivity Data</strong>: The goal hierarchy, milestones, and Eisenhower quadrant tasks you create are stored in your private Firestore database partitions protected by strict security rules.
                  </li>
                  <li>
                    <strong>Billing &amp; Transaction Records</strong>: Payment card information is stored exclusively by Stripe. We only receive confirmation of payment, tier level, and renewal status.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  2. AI Model Data Transmission
                </h3>
                <p>
                  When you request an AI decomposition or participate in a Gemini Live Voice session, prompt text and audio packets are transmitted via encrypted server proxy directly to Google Cloud enterprise endpoints. Your data is not used to train public third-party foundation models without consent.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  3. Cookies &amp; Local Storage
                </h3>
                <p>
                  We use browser local storage and essential session cookies strictly to preserve your offline goal edits, visual theme preference, and login tokens. We do not use third-party behavioral advertising trackers.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  4. Data Deletion &amp; GDPR / CCPA Compliance
                </h3>
                <p>
                  You maintain full rights to export your goals as JSON or request permanent deletion of your account and cloud records. To request complete data erasure, email <strong className="text-white font-mono">{SUPPORT_EMAIL}</strong> with the subject <em>&quot;Data Deletion Request&quot;</em>.
                </p>
              </section>
            </div>
          )}

          {/* TAB 4: SUPPORT CONTACT PAGE */}
          {activeTab === "support" && (
            <div className="space-y-6">
              <section className="bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-500/30 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shrink-0">
                    <Headphones className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-wide">
                      A.T.O.M-i Customer Support &amp; Help Desk
                    </h3>
                    <p className="text-xs text-gray-300 mt-1">
                      Need help with your subscription, refund, goal atomization, or voice coaching? We provide direct human support with guaranteed turnaround.
                    </p>
                  </div>
                </div>
              </section>

              {/* Support Channels Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0b121f] border border-cyan-500/20 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-cyan-300 font-mono font-bold text-xs uppercase mb-2">
                      <Mail className="w-4 h-4 text-cyan-400" />
                      Primary Support Email
                    </div>
                    <div className="text-white font-mono font-bold text-sm select-all">
                      {SUPPORT_EMAIL}
                    </div>
                    <p className="text-gray-400 text-[11px] mt-1.5">
                      Direct inbox for billing, refunds, technical issues, and founder pass claims.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={handleCopyEmail}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Copied to Clipboard!" : "Copy Email"}</span>
                    </button>
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Mail App</span>
                    </a>
                  </div>
                </div>

                <div className="bg-[#0b121f] border border-cyan-500/20 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-300 font-mono font-bold text-xs uppercase mb-2">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      Service Level Agreement (SLA)
                    </div>
                    <div className="text-white font-mono font-bold text-sm">
                      Under 24-Hour Turnaround
                    </div>
                    <p className="text-gray-400 text-[11px] mt-1.5">
                      Support desk operates 7 days a week. Urgent billing and refund requests are prioritized for resolution within 12 hours.
                    </p>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active Support Desk Online</span>
                  </div>
                </div>
              </div>

              {/* Direct Support Message Composer */}
              <div className="bg-[#0b121f] border border-cyan-500/20 rounded-xl p-5">
                <h4 className="text-xs font-mono font-bold uppercase text-white mb-3 flex items-center gap-2">
                  <Send className="w-4 h-4 text-cyan-400" />
                  Quick Message Dispatch
                </h4>
                <form onSubmit={handleSendEmail} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1.5">
                      Select Topic:
                    </label>
                    <select
                      value={supportSubject}
                      onChange={(e) => setSupportSubject(e.target.value)}
                      className="w-full bg-[#050911] border border-cyan-500/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                    >
                      <option value="Billing & Refund Request">Billing &amp; Refund Request (14-Day Guarantee)</option>
                      <option value="Subscription Cancellation">Subscription Cancellation</option>
                      <option value="Founder Pass & Merch Claim">Founder Pass &amp; Merch Claim</option>
                      <option value="Voice Minutes Credit Inquiry">Voice Minutes / Gemini Live Issue</option>
                      <option value="Technical Support & Bug Report">Technical Support &amp; Bug Report</option>
                      <option value="General Question">General Question</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1.5">
                      Your Message or Details (optional):
                    </label>
                    <textarea
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      rows={3}
                      placeholder="Include your Stripe checkout email and any details so we can assist you immediately..."
                      className="w-full bg-[#050911] border border-cyan-500/30 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono resize-none placeholder-gray-600"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <span className="text-[11px] text-gray-400 font-mono">
                      Submitting opens your email client directly addressed to <span className="text-cyan-300">{SUPPORT_EMAIL}</span>
                    </span>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-md shadow-cyan-950/40 flex items-center justify-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send to {SUPPORT_EMAIL}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Merchant Compliance Summary */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono text-gray-400 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-gray-500">Merchant Entity:</span> <strong className="text-white">A.T.O.M-i Systems</strong>
                </div>
                <div>
                  <span className="text-gray-500">Official Contact:</span> <strong className="text-cyan-300">{SUPPORT_EMAIL}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Payment Engine:</span> <strong className="text-emerald-400">Stripe Verified</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="text-[11px] font-mono text-gray-400 flex items-center gap-2">
            <span>Support:</span>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-cyan-400 hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-md shadow-cyan-950/40"
          >
            I Acknowledge &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
}
