/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  X,
  KeyRound,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  Gift,
  ArrowRight
} from "lucide-react";
import { validatePromoCode, VALID_PROMO_CODES } from "../lib/promoCodes";
import { cyberAudio } from "../lib/cyberAudio";

interface PromoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRedeem: (code: string) => Promise<{ success: boolean; message: string; tierName?: string }>;
  onOpenFounderPerks?: () => void;
}

export const PromoCodeModal: React.FC<PromoCodeModalProps> = ({
  isOpen,
  onClose,
  onRedeem,
  onOpenFounderPerks,
}) => {
  const [code, setCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    tierName: string;
    message: string;
    code: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setErrorMsg(null);
    setIsRedeeming(true);
    cyberAudio.playCyberClick(1.2);

    try {
      const res = await onRedeem(trimmed);
      if (res.success) {
        cyberAudio.playSuccess();
        setSuccessInfo({
          tierName: res.tierName || "Founder Vanguard Lifetime",
          message: res.message,
          code: trimmed,
        });
      } else {
        cyberAudio.playBranchError();
        setErrorMsg(res.message || "Invalid or expired VIP access code.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error validating promo code.");
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleQuickApply = (sampleCode: string) => {
    setCode(sampleCode);
    setErrorMsg(null);
  };

  return (
    <div
      id="promo-code-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#080c16] border border-rebel-500/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl shadow-rebel-950/60 flex flex-col relative tactical-corner-frame"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-rebel-950/50 via-purple-950/30 to-black border-b border-rebel-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rebel-500/20 border border-rebel-400/50 flex items-center justify-center text-rebel-300">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-sm text-white tracking-wide flex items-center gap-1.5">
                atom-i <span className="text-rebel-400 font-mono font-normal lowercase">vip access terminal</span>
              </h3>
              <p className="text-[10px] text-gray-400 font-mono">
                Redeem Founder, Family, or VIP Pass Key
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
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {successInfo ? (
            <div className="text-center py-4 space-y-4 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div>
                <h4 className="text-base font-extrabold text-white">
                  VIP Privileges Granted!
                </h4>
                <p className="text-xs text-emerald-300 font-mono mt-1">
                  {successInfo.tierName} • CODE: {successInfo.code}
                </p>
              </div>

              <div className="p-3 bg-black/60 border border-emerald-500/30 rounded-xl text-left text-xs font-mono text-gray-300 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>UNLOCKED ENTITLEMENTS:</span>
                </div>
                <div className="text-[11px] text-gray-400 pl-5">
                  • Unlimited AI Goal Decomposition &amp; Sub-tasks<br />
                  • 4-Quadrant Eisenhower Matrix &amp; Chrono Day Planner<br />
                  • Unlimited Gemini 3.8 Live Voice Minutes<br />
                  • Genesis Founder NFT Digital Card &amp; Free Sticker Kit
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {onOpenFounderPerks && (
                  <button
                    onClick={() => {
                      cyberAudio.playCyberClick(1.1);
                      onClose();
                      onOpenFounderPerks();
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rust-400 to-rust-500 hover:from-rust-300 hover:to-rust-400 text-black font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-rust-500/20 flex items-center justify-center gap-1.5"
                  >
                    <Gift className="w-4 h-4" />
                    View Founder NFT Badge &amp; Freebie Kit
                  </button>
                )}

                <button
                  onClick={() => {
                    cyberAudio.playCyberClick(1.0);
                    onClose();
                  }}
                  className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-mono text-xs font-semibold uppercase tracking-wider transition-all"
                >
                  Enter Cockpit Now
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-rebel-300 uppercase tracking-wider mb-1.5">
                  Enter VIP Promo or Founder Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      setErrorMsg(null);
                    }}
                    placeholder="ENTER VIP PASS KEY"
                    className="w-full bg-black/60 border border-rebel-500/40 focus:border-rebel-400 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-gray-600 outline-none uppercase tracking-widest transition-all"
                    autoFocus
                  />
                  <KeyRound className="w-4 h-4 text-rebel-400/50 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 font-mono text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isRedeeming || !code.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rebel-500 to-indigo-600 hover:from-rebel-400 hover:to-indigo-500 text-white font-sans text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-rebel-500/20 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isRedeeming ? "Verifying Cryptographic Pass..." : "Redeem Full Access Pass"}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Creator & VIP Invitation Guidance */}
              <div className="pt-2 border-t border-white/5 text-center">
                <p className="text-[10px] font-mono text-gray-500 leading-relaxed">
                  VIP passes and founder keys are issued directly by the creator. If you were gifted an access link or pass code, enter it above.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
