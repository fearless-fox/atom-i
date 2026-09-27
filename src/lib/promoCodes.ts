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
}

// Master VIP promo codes, upvoter discounts, and voice minute boosters
export const VALID_PROMO_CODES: PromoCodeDefinition[] = [
  // 1. MASTER FOUNDER & OWNER BYPASS CODES
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
    action: "grant_tier",
    tier: "founder_lifetime",
    voiceMinutes: 999999,
    label: "Executive Founder Vanguard VIP",
    description: "Full Lifetime Founder Pass with unlimited AI atomizations, Chrono Planner, and live voice.",
    founderNumber: 2,
    isFounder: true,
  },
  {
    code: "ATOM-FAMILY",
    action: "grant_tier",
    tier: "founder_lifetime",
    voiceMinutes: 999999,
    label: "Family VIP Lifetime Pass",
    description: "Full complimentary Founder tier for family members with unlimited voice and planning.",
    founderNumber: 7,
    isFounder: true,
  },
  {
    code: "ATOM-FRIENDS",
    action: "grant_tier",
    tier: "founder_lifetime",
    voiceMinutes: 999999,
    label: "Friends of A.T.O.M-i Lifetime Pass",
    description: "Full complimentary Founder tier for close friends with unlimited voice and planning.",
    founderNumber: 12,
    isFounder: true,
  },
  {
    code: "ATOM-FOUNDER",
    action: "grant_tier",
    tier: "founder_lifetime",
    voiceMinutes: 999999,
    label: "Official Founder Genesis Pass",
    description: "Unlocks Option B Lifetime Founder Pass + Genesis Holographic NFT badge.",
    founderNumber: 88,
    isFounder: true,
  },
  {
    code: "GENESIS-199",
    action: "grant_tier",
    tier: "founder_lifetime",
    voiceMinutes: 500,
    label: "Genesis 199 Founder Allocation",
    description: "Unlocks Option B Lifetime Founder privileges.",
    founderNumber: 138,
    isFounder: true,
  },
  {
    code: "VANGUARD-VIP",
    action: "grant_tier",
    tier: "vanguard_live",
    voiceMinutes: 300,
    label: "Vanguard Live VIP Pass",
    description: "Unlocks Vanguard Live tier with high-frequency voice sessions.",
    isFounder: false,
  },

  // 2. PRODUCT HUNT & COMMUNITY UPVOTER PERKS
  {
    code: "PH-UPVOTE",
    action: "grant_tier",
    tier: "tactical_pro",
    bonusVoiceMinutes: 30,
    label: "Product Hunt Upvoter Special",
    description: "30 Free Live Voice Minutes + Full Tactical Eisenhower Grid Unlocked.",
    isFounder: false,
  },
  {
    code: "PRODUCTHUNT",
    action: "grant_tier",
    tier: "tactical_pro",
    bonusVoiceMinutes: 30,
    label: "Product Hunt Supporter Pass",
    description: "30 Free Live Voice Minutes + Eisenhower Matrix Access.",
    isFounder: false,
  },
  {
    code: "SHOW-HN",
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
    action: "founder_discount",
    founderDiscountPercent: 50, // 50% off $99 = $49
    bonusVoiceMinutes: 30,
    label: "Product Hunt Upvoter 50% Founder Discount",
    description: "50% Discount on Option B Lifetime Founder Pass ($49 instead of $99) + 30 Bonus Voice Minutes.",
  },
  {
    code: "UPVOTER-50",
    action: "founder_discount",
    founderDiscountPercent: 50,
    bonusVoiceMinutes: 30,
    label: "Early Supporter 50% Founder Discount",
    description: "50% Discount on Option B Lifetime Founder Pass ($49 instead of $99).",
  },

  // 4. ADDITIVE VOICE BOOSTERS (ADDS EXTRA MINUTES TO ANY TIER)
  {
    code: "VOICE-BOOST-30",
    action: "voice_boost",
    bonusVoiceMinutes: 30,
    label: "+30 Live Voice Minutes Recharge",
    description: "Injects 30 complimentary Gemini Live voice coaching minutes into your balance.",
  },
  {
    code: "VOICE-BOOST-60",
    action: "voice_boost",
    bonusVoiceMinutes: 60,
    label: "+60 Live Voice Minutes Recharge",
    description: "Injects 60 complimentary Gemini Live voice coaching minutes into your balance.",
  },
  {
    code: "HUNTER-VOICE",
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
