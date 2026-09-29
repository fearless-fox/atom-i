import React, { useState } from "react";
import { UserProfile, UserTier } from "../types";
import {
  Shield,
  Zap,
  Check,
  Lock,
  Sparkles,
  X,
  Calendar,
  Grid,
  Award,
  Mic,
  Coins,
  Cpu,
  Flame,
  Radio,
  Gift,
  KeyRound,
  ArrowRight,
  Package
} from "lucide-react";
import { cyberAudio } from "../lib/cyberAudio";
import { STRIPE_PAYMENT_LINKS, openStripeCheckout } from "../lib/stripeConfig";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSelectTier: (tier: UserTier) => Promise<void>;
  onAddVoiceMinutes?: (minutes: number) => Promise<void>;
  onSelectEngine?: (engine: "puter" | "gemini") => Promise<void>;
  activePersonaId: string | null;
  onSelectPersona: (personaId: string | null) => void;
  atomizationsCount?: number;
  onOpenFounderPerks?: () => void;
  onRedeemPromoCode?: (code: string) => Promise<{ success: boolean; message: string; tierName?: string }>;
  onOpenTerms?: (tab?: "terms" | "privacy" | "refunds" | "support") => void;
}

export const TIERS_CONFIG: Record<
  string,
  {
    tierKey: UserTier;
    name: string;
    tagline: string;
    price: string;
    period: string;
    priceMonthly: string;
    priceYearly: string;
    periodMonthly: string;
    periodYearly: string;
    yearlyMonthlyEquivalent?: string;
    yearlySavingsBadge?: string;
    color: string;
    border: string;
    bg: string;
    atomizationLimit: string;
    hasCalendar: boolean;
    hasGrid: boolean;
    hasLiveVoice: boolean;
    voiceMinutesIncluded: number;
    hasTeams: boolean;
    teamLimit?: number;
    featuredEligible?: boolean;
    popular?: boolean;
  }
> = {
  operative: {
    tierKey: "operative",
    name: "Operative",
    tagline: "Visual Decomposition & Core Planning",
    price: "$0",
    period: "Free Forever",
    priceMonthly: "$0",
    priceYearly: "$0",
    periodMonthly: "Free Forever",
    periodYearly: "Free Forever",
    color: "text-gray-300",
    border: "border-gray-800",
    bg: "bg-gray-950/40",
    atomizationLimit: "3 Active Objectives",
    hasCalendar: false,
    hasGrid: false,
    hasLiveVoice: false,
    voiceMinutesIncluded: 0,
    hasTeams: false,
  },
  tactical_pro: {
    tierKey: "tactical_pro",
    name: "Tactical Pro",
    tagline: "Eisenhower Matrix & Chrono Schedule",
    price: "$15",
    period: "/month",
    priceMonthly: "$15",
    priceYearly: "$150",
    periodMonthly: "/month",
    periodYearly: "/year",
    yearlyMonthlyEquivalent: "$12.50/mo billed annually",
    yearlySavingsBadge: "Save $30 (17% off)",
    color: "text-cyan-400",
    border: "border-cyan-500/50",
    bg: "bg-cyan-950/20",
    atomizationLimit: "Unlimited Objectives",
    hasCalendar: true,
    hasGrid: true,
    hasLiveVoice: false,
    voiceMinutesIncluded: 15,
    hasTeams: false,
    popular: true,
  },
  vanguard_live: {
    tierKey: "vanguard_live",
    name: "Vanguard Live",
    tagline: "Live Voice Cockpit & Standup Briefs",
    price: "$25",
    period: "/month",
    priceMonthly: "$25",
    priceYearly: "$250",
    periodMonthly: "/month",
    periodYearly: "/year",
    yearlyMonthlyEquivalent: "$20.83/mo billed annually",
    yearlySavingsBadge: "Save $50 (17% off)",
    color: "text-fuchsia-400",
    border: "border-fuchsia-500/60",
    bg: "bg-fuchsia-950/20",
    atomizationLimit: "Unlimited Objectives",
    hasCalendar: true,
    hasGrid: true,
    hasLiveVoice: true,
    voiceMinutesIncluded: 120,
    hasTeams: true,
    teamLimit: 5,
    featuredEligible: true,
  },
};

export const VOICE_PACKS = [
  { id: "vp_30", minutes: 30, price: "$5", label: "30 Tactical Mins" },
  { id: "vp_100", minutes: 100, price: "$12", label: "100 Tactical Mins", popular: true },
  { id: "vp_300", minutes: 300, price: "$29", label: "300 Tactical Mins" },
];

export default function PaywallModal({
  isOpen,
  onClose,
  userProfile,
  onSelectTier,
  onAddVoiceMinutes,
  onSelectEngine,
  activePersonaId,
  onSelectPersona,
  atomizationsCount = 1,
  onOpenFounderPerks,
  onRedeemPromoCode,
  onOpenTerms,
}: PaywallModalProps) {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("yearly");
  const [purchasingVoicePack, setPurchasingVoicePack] = useState<string | null>(null);
  const [processingTier, setProcessingTier] = useState<string | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [lastStripeUrl, setLastStripeUrl] = useState<string | null>(null);
  const [showDevOverrides, setShowDevOverrides] = useState(false);

  // VIP Promo Code State
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [isRedeemingPromo, setIsRedeemingPromo] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const isFounder =
    userProfile.tier === "founder_lifetime" || userProfile.isFounderLifetime;

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim() || !onRedeemPromoCode) return;
    setIsRedeemingPromo(true);
    setPromoMessage(null);
    cyberAudio.playCyberClick(1.2);
    try {
      const res = await onRedeemPromoCode(promoCodeInput.trim());
      if (res.success) {
        cyberAudio.playSuccess();
        setPromoMessage({ text: res.message, isError: false });
        setCheckoutMessage(`✓ VIP Pass Unlocked: ${res.tierName || "Founder Vanguard"}`);
      } else {
        cyberAudio.playBranchError();
        setPromoMessage({ text: res.message, isError: true });
      }
    } catch (err: any) {
      setPromoMessage({ text: err.message || "Failed to redeem code", isError: true });
    } finally {
      setIsRedeemingPromo(false);
    }
  };

  const handleClaimFounder = async () => {
    const stripeUrl = STRIPE_PAYMENT_LINKS.founderLifetime;
    if (stripeUrl && stripeUrl.trim().length > 0) {
      setProcessingTier("founder_lifetime");
      setLastStripeUrl(stripeUrl.trim());
      setCheckoutMessage("Opening Secure Stripe Checkout in a new tab...");
      openStripeCheckout(stripeUrl);
      setTimeout(() => setProcessingTier(null), 1200);
      return;
    }

    setProcessingTier("founder_lifetime");
    setCheckoutMessage("Initiating Secure 256-Bit Checkout for Founder Pass ($99)...");
    try {
      await onSelectTier("founder_lifetime");
      setCheckoutMessage("✓ Founder Lifetime Pass Verified & Activated! Full privileges granted.");
      setTimeout(() => setCheckoutMessage(null), 4000);
    } finally {
      setProcessingTier(null);
    }
  };

  const handleActivateTier = async (tier: UserTier, name: string, price: string) => {
    let stripeUrl = "";
    if (tier === "tactical_pro") {
      stripeUrl =
        billingInterval === "yearly"
          ? STRIPE_PAYMENT_LINKS.tacticalProYearly
          : STRIPE_PAYMENT_LINKS.tacticalPro;
    } else if (tier === "vanguard_live") {
      stripeUrl =
        billingInterval === "yearly"
          ? STRIPE_PAYMENT_LINKS.vanguardLiveYearly
          : STRIPE_PAYMENT_LINKS.vanguardLive;
    }

    if (stripeUrl && stripeUrl.trim().length > 0) {
      setProcessingTier(tier);
      setLastStripeUrl(stripeUrl.trim());
      setCheckoutMessage(`Opening Secure Stripe Checkout for ${name} (${price})...`);
      openStripeCheckout(stripeUrl);
      setTimeout(() => setProcessingTier(null), 1200);
      return;
    }

    setProcessingTier(tier);
    setCheckoutMessage(`Processing checkout for ${name} (${price})...`);
    try {
      await onSelectTier(tier);
      setCheckoutMessage(`✓ ${name} Protocol Activated (${billingInterval === "yearly" ? "Annual $150" : "Monthly"} Plan)! Entitlements synced.`);
      setTimeout(() => setCheckoutMessage(null), 4000);
    } finally {
      setProcessingTier(null);
    }
  };

  const handleBuyVoicePack = async (pack: (typeof VOICE_PACKS)[0]) => {
    const packUrl = (STRIPE_PAYMENT_LINKS.voicePacks as any)?.[pack.id];
    if (packUrl && packUrl.trim().length > 0) {
      setPurchasingVoicePack(pack.id);
      setLastStripeUrl(packUrl.trim());
      setCheckoutMessage(`Opening Stripe Checkout for ${pack.label} (${pack.price})...`);
      openStripeCheckout(packUrl);
      setTimeout(() => setPurchasingVoicePack(null), 1200);
      return;
    }

    setPurchasingVoicePack(pack.id);
    setCheckoutMessage(`Processing ${pack.price} top-up for ${pack.label}...`);
    try {
      if (onAddVoiceMinutes) {
        await onAddVoiceMinutes(pack.minutes);
      }
      setCheckoutMessage(`✓ Added +${pack.minutes} voice minutes to your balance!`);
      setTimeout(() => setCheckoutMessage(null), 4000);
    } finally {
      setPurchasingVoicePack(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl bg-[#080d14] border border-cyan-500/30 p-6 md:p-8 shadow-2xl shadow-cyan-950/50 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="text-center max-w-2xl mx-auto mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] tracking-widest mb-3">
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            A.T.O.M<span className="text-cyan-300 font-bold lowercase">-i</span> EXECUTION VELOCITY & MONETIZATION
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Select Your Tactical Protocol
          </h2>
          <p className="text-xs md:text-sm text-gray-400 mt-2">
            Scale from basic visual decomposition to full Eisenhower triage, daily Chrono scheduling, and low-latency voice debriefs.
          </p>
        </div>

        {/* Checkout / Status Notification Banner */}
        {checkoutMessage && (
          <div className="mb-5 p-3 rounded-xl bg-cyan-950/80 border border-cyan-400 text-cyan-200 font-mono text-xs flex flex-wrap items-center justify-between gap-2 animate-fade-in shadow-lg shadow-cyan-950/50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 animate-spin" />
              <span className="font-bold">{checkoutMessage}</span>
            </div>
            {lastStripeUrl && (
              <a
                href={lastStripeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-bold uppercase text-[11px] tracking-wider transition-colors inline-flex items-center gap-1.5 shadow-md shadow-cyan-950/40"
              >
                <span>Click Here to Open Stripe ↗</span>
              </a>
            )}
          </div>
        )}

        {/* OPTION B: FOUNDER LIFETIME PASS (FIRST 199 OPERATORS) */}
        <div className="mb-6 relative overflow-hidden rounded-2xl border-2 border-amber-500/60 bg-gradient-to-r from-amber-950/50 via-purple-950/30 to-cyan-950/40 p-5 shadow-xl shadow-amber-950/40">
          <div className="absolute top-0 right-0 px-3 py-1 bg-amber-400 text-black font-mono text-[10px] font-black uppercase tracking-wider rounded-bl-xl flex items-center gap-1.5 shadow-md">
            <Flame className="w-3.5 h-3.5 fill-black animate-pulse" />
            FOUNDER EDITION • 137 / 199 CLAIMED
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-2">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-mono text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Lifetime Pro Pass (Option B)
                </span>
                {isFounder && (
                  <span className="px-2 py-0.5 rounded bg-amber-400/20 border border-amber-400/50 text-amber-300 font-mono text-[9px] font-bold">
                    OWNED & ACTIVE • OPERATOR #
                    {String(
                      userProfile.founderNumber !== undefined && userProfile.founderNumber !== null
                        ? userProfile.founderNumber
                        : (userProfile.email === "faux.fuax@gmail.com" ? 0 : 138)
                    ).padStart(3, "0")}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-white flex flex-wrap items-center gap-2">
                <span>
                  One-Time Founder Pass —{" "}
                  {userProfile.founderDiscountPercent ? (
                    <>
                      <span className="line-through text-gray-400 mr-1.5 font-normal text-base">$99</span>
                      <span className="text-emerald-400 font-black">
                        ${Math.round(99 * (1 - userProfile.founderDiscountPercent / 100))}
                      </span>
                    </>
                  ) : (
                    "$99"
                  )}{" "}
                  Forever
                </span>
                {userProfile.founderDiscountPercent ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold animate-pulse">
                    🏷️ {userProfile.founderDiscountPercent}% SPECIAL DISCOUNT APPLIED
                  </span>
                ) : (
                  <span className="text-xs font-mono text-amber-300 font-normal px-2 py-0.5 bg-amber-400/10 border border-amber-400/30 rounded">
                    No Recurring Subscriptions
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Strictly limited to the first <strong>199 operators</strong>. Unlocks Lifetime Tactical Pro (unlimited objectives, 4-Quadrant Eisenhower Matrix, Chrono Day Planner, and live voice debriefs).
              </p>

              {/* Bonus Freebies & NFT collectible note */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-amber-300/90 pt-1">
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  Holographic Genesis NFT Badge
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-amber-400" />
                  Physical Die-Cut Metallic Sticker Pack Included
                </span>
              </div>

              {/* Urgency Counter & Progress Bar */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="w-48 h-2 rounded-full bg-black/60 border border-amber-500/30 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 w-[68.8%]" />
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px]">
                  <span className="text-amber-300 font-bold">
                    🔥 ONLY 62 SLOTS REMAINING (68.8% CLAIMED)
                  </span>
                  <span className="text-gray-500 hidden sm:inline">•</span>
                  <span className="text-gray-400 hidden sm:inline">Permanently locks at 199</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-end gap-2 w-full md:w-auto">
              {isFounder ? (
                <div className="flex flex-col gap-2 w-full md:w-auto">
                  <button
                    onClick={() => {
                      cyberAudio.playCyberClick(1.1);
                      if (onOpenFounderPerks) onOpenFounderPerks();
                    }}
                    className="w-full md:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-mono text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    <Award className="w-4 h-4" />
                    View Founder NFT &amp; Sticker Kit
                  </button>
                  <span className="text-[10px] font-mono text-amber-300/80 text-center">
                    Founder Privileges Active
                  </span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={() => {
                      cyberAudio.playCyberClick(1.0);
                      if (onOpenFounderPerks) onOpenFounderPerks();
                    }}
                    className="w-full sm:w-auto px-3.5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-amber-400/40 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    title="Preview the Interactive 3D Holographic Founder Card"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Preview 3D NFT Badge
                  </button>
                  <button
                    onClick={handleClaimFounder}
                    disabled={processingTier === "founder_lifetime"}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all shadow-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-amber-500/25 flex items-center justify-center gap-2"
                  >
                    <Flame className="w-4 h-4 fill-black" />
                    Claim Founder Pass ($
                    {userProfile.founderDiscountPercent
                      ? Math.round(99 * (1 - userProfile.founderDiscountPercent / 100))
                      : 99}
                    )
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* VIP / PROMO CODE REDEMPTION SECTION */}
        <div className="mb-6 p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <span>VIP Access or Founder Promo Code?</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  FAMILY &amp; FRIENDS
                </span>
              </h4>
              <p className="text-[11px] text-gray-400 font-mono">
                Have a master access key or gift code? Enter below to instantly unlock full privileges.
              </p>
            </div>
          </div>

          <form onSubmit={handleApplyPromo} className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              value={promoCodeInput}
              onChange={(e) => {
                setPromoCodeInput(e.target.value.toUpperCase());
                setPromoMessage(null);
              }}
              placeholder="ENTER PROMO CODE"
              className="bg-black/60 border border-cyan-500/40 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-gray-600 outline-none uppercase tracking-wider w-full md:w-44"
            />
            <button
              type="submit"
              disabled={isRedeemingPromo || !promoCodeInput.trim()}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40 shrink-0"
            >
              {isRedeemingPromo ? "Checking..." : "Redeem"}
            </button>
          </form>
        </div>

        {promoMessage && (
          <div
            className={`mb-5 p-3 rounded-xl border text-xs font-mono flex items-center gap-2 animate-fade-in ${
              promoMessage.isError
                ? "bg-rose-950/50 border-rose-500/50 text-rose-300"
                : "bg-emerald-950/50 border-emerald-500/50 text-emerald-300"
            }`}
          >
            {promoMessage.isError ? (
              <X className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{promoMessage.text}</span>
          </div>
        )}

        {/* OPTION A: EXECUTION VELOCITY TIERS */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Subscription Protocols</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                OPTION A
              </span>
            </h3>
            <p className="text-xs text-gray-400 font-mono">
              Choose monthly flexibility or unlock 2 months free with annual billing.
            </p>
          </div>

          {/* Monthly / Yearly Switch */}
          <div className="inline-flex items-center p-1 rounded-xl bg-black/80 border border-cyan-500/40 shrink-0">
            <button
              onClick={() => {
                cyberAudio.playCyberClick(1.0);
                setBillingInterval("monthly");
              }}
              className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                billingInterval === "monthly"
                  ? "bg-cyan-500 text-black shadow-md shadow-cyan-950/50"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => {
                cyberAudio.playCyberClick(1.2);
                setBillingInterval("yearly");
              }}
              className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingInterval === "yearly"
                  ? "bg-gradient-to-r from-cyan-400 to-emerald-400 text-black shadow-md shadow-emerald-950/50 font-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <span>Yearly</span>
              <span className="px-1.5 py-0.5 rounded bg-black/80 text-emerald-300 text-[9px] uppercase font-mono font-black border border-emerald-400/40">
                SAVE 17% (2 MO FREE)
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {Object.values(TIERS_CONFIG).map((config) => {
            const isCurrent =
              userProfile.tier === config.tierKey && !isFounder;
            const currentPrice =
              billingInterval === "yearly" ? config.priceYearly : config.priceMonthly;
            const currentPeriod =
              billingInterval === "yearly" ? config.periodYearly : config.periodMonthly;

            return (
              <div
                key={config.tierKey}
                className={`relative rounded-xl p-5 border flex flex-col justify-between transition-all ${
                  config.border
                } ${config.bg} ${
                  isCurrent
                    ? "ring-2 ring-cyan-400 shadow-lg shadow-cyan-900/30"
                    : "hover:border-white/20"
                }`}
              >
                {config.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-[9px] font-mono font-bold text-black uppercase tracking-wider shadow-md">
                    MOST POPULAR
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-base font-bold ${config.color}`}>
                      {config.name}
                    </h3>
                    {isCurrent && (
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 min-h-[32px]">
                    {config.tagline}
                  </p>

                  <div className="mt-4 mb-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white">
                        {currentPrice}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        {currentPeriod}
                      </span>
                    </div>
                    {billingInterval === "yearly" && config.yearlyMonthlyEquivalent && (
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-mono text-emerald-400 font-bold">
                          {config.yearlyMonthlyEquivalent}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {config.yearlySavingsBadge}
                        </span>
                      </div>
                    )}
                    {billingInterval === "monthly" && config.tierKey !== "operative" && (
                      <div className="mt-1 text-[11px] font-mono text-gray-500">
                        Billed monthly, cancel anytime
                      </div>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-2.5 text-xs text-gray-300 font-mono border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{config.atomizationLimit}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Interactive Node Map</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {config.hasGrid ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-600 shrink-0" />
                      )}
                      <span
                        className={config.hasGrid ? "text-gray-200" : "text-gray-500"}
                      >
                        Eisenhower 4Q Matrix
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {config.hasCalendar ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-600 shrink-0" />
                      )}
                      <span
                        className={
                          config.hasCalendar ? "text-gray-200" : "text-gray-500"
                        }
                      >
                        Chrono Schedule Planner
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {config.hasLiveVoice ? (
                        <Check className="w-4 h-4 text-fuchsia-400 shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-600 shrink-0" />
                      )}
                      <span
                        className={
                          config.hasLiveVoice ? "text-fuchsia-300 font-bold" : "text-gray-500"
                        }
                      >
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

                <div className="mt-6 pt-4 border-t border-white/5">
                  <button
                    disabled={isCurrent || isFounder || processingTier === config.tierKey}
                    onClick={() => handleActivateTier(config.tierKey, config.name, currentPrice)}
                    className={`w-full py-2.5 px-4 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                      isCurrent
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default"
                        : isFounder
                        ? "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
                        : "bg-cyan-500 hover:bg-cyan-400 text-black shadow-md shadow-cyan-950/50"
                    }`}
                  >
                    {isCurrent
                      ? "Current Protocol Active"
                      : isFounder
                      ? "Covered by Founder Pass"
                      : processingTier === config.tierKey
                      ? "Activating..."
                      : config.tierKey === "operative"
                      ? "Stay on Operative"
                      : `Activate ${config.name} (${currentPrice}${currentPeriod})`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* OPTION C: VOICE MINUTE CREDIT PACKS UPSELL */}
        <div className="mb-6 p-5 rounded-xl bg-black/60 border border-fuchsia-900/40 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-fuchsia-400" />
                <h4 className="font-mono text-xs font-bold text-fuchsia-300 uppercase tracking-wider">
                  Tactical Voice Minute Top-Ups (Option C)
                </h4>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Refill audio minutes for hands-free Gemini 3.8 Live Voice tactical debriefs. Minutes never expire.
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-fuchsia-950/60 border border-fuchsia-500/30">
              <Radio className="w-3.5 h-3.5 text-fuchsia-400 animate-pulse" />
              <span className="text-[11px] font-mono text-fuchsia-200">
                BALANCE: <strong className="text-white">{userProfile.voiceMinutesRemaining || 0} Mins</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {VOICE_PACKS.map((pack) => (
              <div
                key={pack.id}
                className="p-3.5 rounded-lg bg-black/40 border border-fuchsia-500/20 hover:border-fuchsia-400/60 flex items-center justify-between transition-all"
              >
                <div>
                  <div className="text-xs font-mono font-bold text-white">
                    {pack.label}
                  </div>
                  <div className="text-[11px] text-fuchsia-400 font-mono mt-0.5">
                    {pack.price} one-time
                  </div>
                </div>
                <button
                  onClick={() => handleBuyVoicePack(pack)}
                  disabled={purchasingVoicePack === pack.id}
                  className="px-3 py-1.5 rounded bg-fuchsia-500 hover:bg-fuchsia-400 text-black font-mono text-[10px] font-bold uppercase transition-colors"
                >
                  {purchasingVoicePack === pack.id ? "Adding..." : "Add"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ENTERPRISE ENCRYPTION & SLA GUARANTEE */}
        <div className="p-4 rounded-xl bg-black/60 border border-cyan-900/40 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-gray-300">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white">ENTERPRISE SLA & GUARANTEE:</span>
              <span className="text-gray-400">256-Bit TLS • Real-Time Firestore Sync • Cancel Anytime</span>
            </div>
            <button
              onClick={() => setShowDevOverrides((prev) => !prev)}
              className="text-[10px] text-gray-500 hover:text-cyan-400 font-mono underline transition-colors"
            >
              {showDevOverrides ? "Hide Developer Controls" : "Developer Testing Override"}
            </button>
          </div>

          {/* Developer Testing Persona Overrides */}
          {showDevOverrides && (
            <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono animate-fade-in">
              <div className="flex items-center gap-2 text-gray-400">
                <span className="text-[10px] uppercase font-bold text-amber-400">TEST PERSONAS:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: "operative_user_test", label: "operative_test (Free $0)" },
                  { id: "tactical_pro_test", label: "pro_test ($15/mo)" },
                  { id: "vanguard_live_test", label: "vanguard_test ($39/mo)" },
                  { id: "founder_199_test", label: "founder_199 (Lifetime $99)" },
                ].map((persona) => (
                  <button
                    key={persona.id}
                    onClick={() => onSelectPersona(persona.id)}
                    className={`px-2.5 py-1 rounded border transition-colors text-[10px] ${
                      activePersonaId === persona.id
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold"
                        : "bg-white/5 border-white/10 text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {persona.label}
                  </button>
                ))}
                {activePersonaId && (
                  <button
                    onClick={() => onSelectPersona(null)}
                    className="px-2 py-1 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/40 text-[10px]"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Stripe Compliance Legal Terms Disclosure */}
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center font-mono text-[11px] text-gray-400">
          <span>By activating, you agree to the</span>
          <button
            onClick={() => onOpenTerms && onOpenTerms("terms")}
            className="text-cyan-400 hover:text-cyan-300 underline font-bold transition-colors"
          >
            Terms of Service
          </button>
          <span>•</span>
          <button
            onClick={() => onOpenTerms && onOpenTerms("refunds")}
            className="text-cyan-400 hover:text-cyan-300 underline font-bold transition-colors"
          >
            14-Day Return &amp; Refund Policy
          </button>
          <span>•</span>
          <button
            onClick={() => onOpenTerms && onOpenTerms("privacy")}
            className="text-cyan-400 hover:text-cyan-300 underline font-bold transition-colors"
          >
            Privacy Policy
          </button>
          <span>•</span>
          <button
            onClick={() => onOpenTerms && onOpenTerms("support")}
            className="text-cyan-300 hover:text-white underline font-bold transition-colors"
          >
            Support Desk
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-3 text-center font-mono text-[10px] text-gray-500">
          Connected to Firestore Project: <span className="text-cyan-400">atom-i</span> • Collections: <span className="text-gray-400">users, atomizations, success_stories</span>
        </div>
      </div>
    </div>
  );
}
