/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserTier } from "../types";

export type PromoActionType = "grant_tier" | "voice_boost" | "founder_discount";

export interface PromoCodeDefinition {
  code: string;
  action: PromoActionType;
  label: string;
  description: string;
  tier?: UserTier;
  voiceMinutes?: number;
  bonusVoiceMinutes?: number;
  founderDiscountPercent?: number;
  founderNumber?: number;
  isFounder?: boolean;
  /**
   * When true, the code dies after `maxUses` total redemptions across ALL
   * accounts (enforced by a Firestore transaction), so an issued code can
   * never be passed around and reused. Omit / false = reusable.
   */
  singleUse?: boolean;
  maxUses?: number;
}

// Master VIP promo codes, upvoter discounts, and voice minute boosters
export const VALID_PROMO_CODES: PromoCodeDefinition[] = [
  // 1. MASTER FOUNDER & OWNER BYPASS CODES
  // FAUX-VIP is the project owner's master key. It is ONLY redeemable by
  // faux.fuax@gmail.com (enforced in redeemPromoCode) — absolutely nobody
  // else may receive creator #000 or its privileges through any code.
  {
    code: "FAUX-VIP",
    action: "grant_tier",
    tier: "founder_lifetime",
    voiceMinutes: 999999,
    label: "Creator & Master Architect Access",
    description: "Full Lifetime Vanguard & Founder Access with unlimited live voice and priority cluster compute.",
    founderNumber: 0,
    isFounder: true,
  },
  {
    code: "FOUNDER-VIP",
    singleUse: true,
    maxUses:10,
    action: "grant_tier",
    tier: "founder_lifetime",
    voiceMinutes: 60,
    label: "Executive Founder Vanguard VIP",
    description: "Full Lifetime Founder Pass with unlimited AI atomizations, Chrono Planner, and live voice.",
    isFounder: true,
  },
  {
    code: "ATOM-FAMILY",
    singleUse: true,
    maxUSes: 20,
    action: "grant_tier",
    tier: "founder_lifetime",
    voiceMinutes: 120,
    label: "Family VIP Lifetime Pass",
    description: "Full complimentary Founder tier for family members with unlimited voice and planning.",
    isFounder: true,
  },
  {
    code: "ATOM-FRIENDS",
    singleUse: true,
    maxUses: 10,
    action: "grant_tier",
    tier: "vanguard_live",
    voiceMinutes: 60,
    label: "Friends of A.T.O.M-i Lifetime Pass",
    description: "Full complimentary Founder tier for close friends with unlimited voice and planning.",
    isFounder: true,
  },
  {
    code: "ATOM-FOUNDER",
    singleUse: true,
    maxUses: 05,
    action: "grant_tier",
    tier: "founder_lifetime",
    voiceMinutes: 120,
    label: "Official Founder Genesis Pass",
    description: "Unlocks Option B Lifetime Founder Pass + Genesis Holographic NFT badge.",
    isFounder: true,
  },
  {
    code: "GENESIS-199",
    singleUse: true,
    action: "grant_tier",
    tier: "founder_lifetime",
    voiceMinutes: 240,
    label: "Genesis 199 Founder Allocation",
    description: "Unlocks Option B Lifetime Founder privileges.",
    founderNumber: 138,
    isFounder: true,
  },
  {
    code: "VANGUARD-VIP",
    singleUse: true,
    action: "grant_tier",
    tier: "vanguard_live",
    voiceMinutes: 240,
    label: "Vanguard Live VIP Pass",
    description: "Unlocks Vanguard Live tier with high-frequency voice sessions.",
    isFounder: false,
  },

  // 2. PRODUCT HUNT & COMMUNITY UPVOTER PERKS
  {
    code: "PH-UPVOTE",
    singleUse: true,
    maxUses: 20,
    action: "grant_tier",
    tier: "tactical_pro",
    bonusVoiceMinutes: 30,
    label: "Product Hunt Upvoter Special",
    description: "30 Free Live Voice Minutes + Full Tactical Eisenhower Grid Unlocked.",
    isFounder: false,
  },
  {
    code: "PRODUCTHUNT",    
    singleUse: true,
    maxUses: 20,
    action: "grant_tier",
    tier: "tactical_pro",
    bonusVoiceMinutes: 30,
    label: "Product Hunt Supporter Pass",
    description: "30 Free Live Voice Minutes + Eisenhower Matrix Access.",
    isFounder: false,
  },
  {
    code: "SHOW-HN",
    singleUse: true,
    maxUses: 10,
    action: "grant_tier",
    tier: "tactical_pro",
    bonusVoiceMinutes: 30,
    label: "Hacker News Community Perk",
    description: "30 Free Live Voice Minutes + Tactical Pro features.",
    isFounder: false,
  },

  // 3. FOUNDER PASS DISCOUNT CODES (FOR UPVOTERS & PROMOS)
  {
    code: "PH-FOUNDER-50",
    singleUse: true,
    maxUses: 02,
    action: "founder_discount",
    founderDiscountPercent: 50, // 50% off $99 = $49
    bonusVoiceMinutes: 30,
    label: "Product Hunt Upvoter 50% Founder Discount",
    description: "50% Discount on Option B Lifetime Founder Pass ($49 instead of $99) + 30 Bonus Voice Minutes.",
  },
  {
    code: "UPVOTER-50",
    singleUse: true,
    maxUses: 02,
    action: "founder_discount",
    founderDiscountPercent: 50,
    bonusVoiceMinutes: 30,
    label: "Early Supporter 50% Founder Discount",
    description: "50% Discount on Option B Lifetime Founder Pass ($49 instead of $99).",
  },

  // 4. ADDITIVE VOICE BOOSTERS (ADDS EXTRA MINUTES TO ANY TIER)
  {
    code: "VOICE-BOOST-30",
    singleUse: true,
    maxUses: 20,
    action: "voice_boost",
    bonusVoiceMinutes: 30,
    label: "+30 Live Voice Minutes Recharge",
    description: "Injects 30 complimentary Gemini Live voice coaching minutes into your balance.",
  },
  {
    code: "VOICE-BOOST-60",
    singleUse: true,
    maxUses: 20,
    action: "voice_boost",
    bonusVoiceMinutes: 60,
    label: "+60 Live Voice Minutes Recharge",
    description: "Injects 60 complimentary Gemini Live voice coaching minutes into your balance.",
  },
  {
    code: "HUNTER-VOICE",
    singleUse: true,
    maxUses: 20,
    action: "voice_boost",
    bonusVoiceMinutes: 45,
    label: "+45 Hunter Live Voice Minutes",
    description: "Injects 45 complimentary Gemini Live voice coaching minutes into your balance.",
  },
];

/**
 * Normalizes and checks if a promo code string is valid
 */
export function validatePromoCode(rawCode: string): PromoCodeDefinition | null {
  if (!rawCode) return null;
  const cleaned = rawCode.trim().toUpperCase().replace(/\s+/g, "");
  
  // Match exact or without hyphens
  const match = VALID_PROMO_CODES.find(
    (p) => p.code === cleaned || p.code.replace(/-/g, "") === cleaned.replace(/-/g, "")
  );

  return match || null;
}
