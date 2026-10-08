/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Award,
  Sparkles,
  Package,
  Check,
  Download,
  Share2,
  Flame,
  Truck,
  MapPin,
  ExternalLink,
  RotateCw,
  RefreshCw,
  Eye,
} from "lucide-react";
import { UserProfile } from "../types";
import { cyberAudio } from "../lib/cyberAudio";

interface FounderPerksModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onClaimMerch?: (shippingData: {
    fullName: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    notes?: string;
  }) => Promise<void>;
}

export const FounderPerksModal: React.FC<FounderPerksModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onClaimMerch,
}) => {
  const [activeTab, setActiveTab] = useState<"nft_badge" | "sticker_merch">("nft_badge");
  const [isSubmittingShipping, setIsSubmittingShipping] = useState(false);
  const [shippingSubmitted, setShippingSubmitted] = useState<boolean>(() => {
    return !!localStorage.getItem("atom_founder_merch_claimed") || !!userProfile.founderMerchClaimed;
  });

  // Shipping Form State
  const [fullName, setFullName] = useState(userProfile.displayName || "");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("United States");
  const [notes, setNotes] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // 360-Degree Interactive 3D Card State
  const [rotationY, setRotationY] = useState(0);
  const [tiltX, setTiltX] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const startRotationYRef = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Auto-Orbit 360-Degree Animation
  useEffect(() => {
    if (!isAutoRotating) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }
    let lastTime = performance.now();
    const tick = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      setRotationY((prev) => (prev + delta * 35) % 360);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isAutoRotating]);

  if (!isOpen) return null;

  const founderNumber =
    userProfile.founderNumber !== undefined && userProfile.founderNumber !== null
      ? userProfile.founderNumber
      : (userProfile.email === "faux.fuax@gmail.com" || userProfile.founderPromoCodeUsed === "FAUX-VIP"
          ? 0
          : 138);
  const formattedNumber = String(founderNumber).padStart(3, "0");
  const isCreatorRoot = formattedNumber === "000";

  // Physical card thickness (px). Faces sit at +/- half; four metallic edge
  // strips bridge the gap so a spin never shows a hollow flicker edge-on.
  const CARD_T = 14;
  const CARD_HALF = CARD_T / 2;
  const edgeSheenH = isCreatorRoot
    ? "linear-gradient(90deg, #4c1d95, #a78bfa 30%, #ede9fe 50%, #a78bfa 70%, #4c1d95)"
    : "linear-gradient(90deg, #8a6d2f, #f5d67b 30%, #fff3c4 50%, #f5d67b 70%, #8a6d2f)";
  const edgeSheenV = isCreatorRoot
    ? "linear-gradient(180deg, #4c1d95, #a78bfa 30%, #ede9fe 50%, #a78bfa 70%, #4c1d95)"
    : "linear-gradient(180deg, #8a6d2f, #f5d67b 30%, #fff3c4 50%, #f5d67b 70%, #8a6d2f)";

  // Trigger one-shot 360-degree flip
  const handleTrigger360Spin = () => {
    if (isSpinning) return;
    cyberAudio.playCyberClick(1.3);
    setIsSpinning(true);
    setIsAutoRotating(false);
    const start = rotationY;
    const target = start + 360;
    const duration = 1000; // ms
    const startTime = performance.now();

    const animateSpin = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setRotationY(start + (target - start) * ease);

      if (progress < 1) {
        requestAnimationFrame(animateSpin);
      } else {
        setRotationY(target % 360);
        setIsSpinning(false);
        cyberAudio.playSuccess();
      }
    };
    requestAnimationFrame(animateSpin);
  };

  // Drag / Touch handlers for manual 360 scrubbing
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    startRotationYRef.current = rotationY;
    setIsAutoRotating(false);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      const deltaX = e.clientX - dragStartXRef.current;
      const newY = (startRotationYRef.current + deltaX * 0.9) % 360;
      setRotationY(newY < 0 ? newY + 360 : newY);
    } else if (!isAutoRotating && !isSpinning && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const centerY = rect.height / 2;
      const rotX = ((y - centerY) / centerY) * -12;
      setTiltX(rotX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleResetOrientation = () => {
    cyberAudio.playCyberClick(0.9);
    setIsAutoRotating(false);
    setRotationY(0);
    setTiltX(0);
  };

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!street || !city || !postalCode) return;

    setIsSubmittingShipping(true);
    cyberAudio.playCyberClick(1.2);

    try {
      if (onClaimMerch) {
        await onClaimMerch({ fullName, street, city, postalCode, country, notes });
      }
      localStorage.setItem("atom_founder_merch_claimed", "true");
      setShippingSubmitted(true);
      cyberAudio.playSuccess();
    } catch (err) {
      console.error("Error submitting merch claim:", err);
    } finally {
      setIsSubmittingShipping(false);
    }
  };

  const handleDownloadCard = () => {
    cyberAudio.playCyberClick(1.1);
    // Generate an SVG certificate file for download
    const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#05070e" />
          <stop offset="50%" stop-color="#120c24" />
          <stop offset="100%" stop-color="#021420" />
        </linearGradient>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FF4D1C" />
          <stop offset="50%" stop-color="#FF4D1C" />
          <stop offset="100%" stop-color="#d97706" />
        </linearGradient>
        <linearGradient id="cyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#7C3AED" />
          <stop offset="100%" stop-color="#6366f1" />
        </linearGradient>
      </defs>
      <rect width="800" height="500" rx="24" fill="url(#bg)" stroke="#FF4D1C" stroke-width="4"/>
      <rect x="20" y="20" width="760" height="460" rx="16" fill="none" stroke="#7C3AED" stroke-width="1" stroke-opacity="0.3"/>
      
      <text x="50" y="70" font-family="monospace" font-size="14" fill="#FF4D1C" letter-spacing="4">GENESIS FOUNDER PASS • ${isCreatorRoot ? "ROOT ARCHITECT #000 EDITION" : "199 EDITION"}</text>
      <text x="50" y="120" font-family="sans-serif" font-weight="900" font-size="34" fill="#ffffff">${isCreatorRoot ? "CREATOR & MASTER ARCHITECT" : "atom-i FOUNDING MEMBER"}</text>
      <text x="50" y="150" font-family="monospace" font-size="16" fill="#7C3AED">MEMBER #${formattedNumber} / 199 ${isCreatorRoot ? "(ROOT ARCHITECT)" : ""}</text>
      
      <line x1="50" y1="180" x2="750" y2="180" stroke="#374151" stroke-width="1" />
      
      <text x="50" y="220" font-family="monospace" font-size="12" fill="#9ca3af">STATUS: LIFETIME PRO PRIVILEGES VERIFIED</text>
      <text x="50" y="250" font-family="sans-serif" font-size="15" fill="#e5e7eb">• Unlimited AI Objective Decomposition</text>
      <text x="50" y="280" font-family="sans-serif" font-size="15" fill="#e5e7eb">• 4-Quadrant Eisenhower Matrix &amp; Chrono Day Planner</text>
      <text x="50" y="310" font-family="sans-serif" font-size="15" fill="#e5e7eb">• Gemini 3.8 Live Voice Tactical Mentor Integration</text>
      <text x="50" y="340" font-family="sans-serif" font-size="15" fill="#e5e7eb">• Exclusive Die-Cut Metallic Holographic Sticker Kit Access</text>
      
      <rect x="50" y="390" width="300" height="50" rx="8" fill="#111827" stroke="#374151"/>
      <text x="65" y="412" font-family="monospace" font-size="10" fill="#9ca3af">COLLECTIBLE 3D ORIGINAL ART</text>
      <text x="65" y="430" font-family="monospace" font-size="12" fill="#FF4D1C">by the founder</text>
      
      <text x="600" y="440" font-family="monospace" font-size="12" fill="#7C3AED" text-anchor="middle">CERTIFIED ATOM-I</text>
    </svg>
    `;
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `atom-i-founder-${formattedNumber}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Determine whether the back face is facing the user in 3D space (90° to 270°)
  // This eliminates Chrome/WebKit stacking-context bleed-through where child elements
  // fail backface-visibility culling and appear reversed on the back.
  const normalizedAngle = ((Math.round(rotationY) % 360) + 360) % 360;
  const isBackFacing = normalizedAngle > 90 && normalizedAngle < 270;

  return (
    <div
      id="founder-perks-modal"
      className="fixed inset-0 z-50 flex p-4 bg-black/90 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#070a12] border-2 border-rust-500/50 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl shadow-rust-950/40 flex flex-col relative m-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="p-5 bg-gradient-to-r from-rust-950/60 via-purple-950/40 to-rebel-950/60 border-b border-rust-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rust-400 to-rust-600 p-0.5 shadow-lg shadow-rust-500/30 flex items-center justify-center text-black font-black">
              <Award className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans font-black text-base text-white tracking-wide flex items-center">
                  atom-i <span className="text-rust-400 font-mono font-bold lowercase ml-1.5">founding member privileges</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rust-400 text-black font-extrabold uppercase">
                  199 GENESIS EDITION
                </span>
              </div>
              <p className="text-xs text-rust-200/70 font-mono">
                Operator Pass #{formattedNumber} / 199 • {isCreatorRoot ? "Master Creator Root Pass" : "Collectible 3D Original Art by the Founder & Physical Freebie Kit"}
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

        {/* Tab Selector */}
        <div className="flex border-b border-white/10 bg-black/40 px-6 pt-3 gap-3">
          <button
            onClick={() => {
              cyberAudio.playCyberClick(1.0);
              setActiveTab("nft_badge");
            }}
            className={`pb-3 px-3 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "nft_badge"
                ? "border-rust-400 text-rust-300"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4 text-rust-400" />
            <span>3D Art Genesis Pass</span>
          </button>

          <button
            onClick={() => {
              cyberAudio.playCyberClick(1.0);
              setActiveTab("sticker_merch");
            }}
            className={`pb-3 px-3 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "sticker_merch"
                ? "border-rust-400 text-rust-300"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <Package className="w-4 h-4 text-rust-400" />
            <span>Physical Sticker & Welcome Kit</span>
            {shippingSubmitted && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Tab 1: Holographic 3D Art Collectible Badge */}
        {activeTab === "nft_badge" && (
          <div className="p-6 flex flex-col items-center justify-center space-y-5 bg-gradient-to-b from-black/60 to-[#070a14]">
            {/* 360-Degree Interactive 3D Card Container */}
            <div
              className="w-full max-w-md h-80 relative select-none cursor-grab active:cursor-grabbing group touch-none"
              style={{ perspective: "1200px" }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <div
                ref={cardRef}
                style={{
                  width: "100%",
                  height: "100%",
                  position: "relative",
                  transformStyle: "preserve-3d",
                  transform: `rotateX(${tiltX}deg) rotateY(${rotationY}deg)`,
                  transition:
                    isDraggingRef.current || isAutoRotating || isSpinning
                      ? "none"
                      : "transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
                }}
              >
                {/* FRONT FACE (0 deg) — founder's original circuit artwork, animated HUD */}
                <div
                  className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border border-cyan-200/30 text-white"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: `rotateY(0deg) translateZ(${CARD_HALF}px)`,
                    backgroundColor: "#000000",
                    visibility: isBackFacing ? "hidden" : "visible",
                    opacity: isBackFacing ? 0 : 1,
                    pointerEvents: isBackFacing ? "none" : "auto",
                    transition: "opacity 0.15s ease",
                    boxShadow: "0 0 32px rgba(103,232,249,0.18), 0 25px 50px -12px rgba(0,0,0,0.8)",
                  }}
                >
                  <div className="absolute -inset-3 hud-flicker">
                    <img
                      src="/founder-card-front.png"
                      alt="Original circuit artwork by the founder"
                      className="w-full h-full object-cover hud-drift"
                      draggable={false}
                    />
                  </div>
                  {/* HUD scanline sweep */}
                  <div
                    className="absolute left-0 right-0 h-24 hud-scan pointer-events-none"
                    style={{ background: "linear-gradient(to bottom, transparent, rgba(103,232,249,0.16), rgba(103,232,249,0.05), transparent)" }}
                  />
                  {/* Holographic sheen slide */}
                  <div
                    className="absolute inset-y-[-10%] w-1/4 hud-sheen-slide pointer-events-none"
                    style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.10), transparent)" }}
                  />
                  {/* Blinking status lights */}
                  <div className="absolute top-[3.5%] left-[4.5%] w-2 h-2 rounded-full bg-cyan-300 hud-blink" style={{ boxShadow: "0 0 10px rgba(103,232,249,0.9)" }} />
                  <div className="absolute top-[3.5%] right-[5%] w-2 h-2 rounded-full bg-rose-500 hud-blink-slow" style={{ boxShadow: "0 0 10px rgba(244,63,94,0.9)" }} />
                  <div className="absolute bottom-[4%] left-[4.5%] w-2 h-2 rounded-full bg-emerald-400 hud-blink-slow" style={{ boxShadow: "0 0 10px rgba(52,211,153,0.9)", animationDelay: "0.7s" }} />
                  {/* CRT vignette + pulsing edge glow */}
                  <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ boxShadow: "inset 0 0 70px rgba(0,0,0,0.62)" }} />
                  <div className="absolute inset-0 pointer-events-none rounded-2xl hud-glow-pulse" style={{ boxShadow: "inset 0 0 24px rgba(103,232,249,0.22)" }} />
                </div>
{/* BACK FACE (180 deg) — Genesis Pass frame + live member data */}
                <div
                  className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border border-cyan-200/30 text-white"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: `rotateY(180deg) translateZ(${CARD_HALF}px)`,
                    backgroundColor: "#000000",
                    visibility: isBackFacing ? "visible" : "hidden",
                    opacity: isBackFacing ? 1 : 0,
                    pointerEvents: isBackFacing ? "auto" : "none",
                    transition: "opacity 0.15s ease",
                    boxShadow: "0 0 32px rgba(103,232,249,0.18), 0 25px 50px -12px rgba(0,0,0,0.8)",
                  }}
                >
                  <div className="absolute -inset-3 hud-flicker">
                    <img
                      src="/founder-card-back.png"
                      alt="Genesis pass frame artwork by the founder"
                      className="w-full h-full object-cover hud-drift"
                      style={{ animationDuration: "18s" }}
                      draggable={false}
                    />
                  </div>
                  <div
                    className="absolute left-0 right-0 h-24 hud-scan pointer-events-none"
                    style={{ background: "linear-gradient(to bottom, transparent, rgba(103,232,249,0.12), transparent)", animationDuration: "6s" }}
                  />
                  <div
                    className="absolute inset-y-[-10%] w-1/4 hud-sheen-slide pointer-events-none"
                    style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)", animationDuration: "7s" }}
                  />
                  {/* Live member data in the frame's empty center */}
                  <div className="absolute inset-x-0 top-[40%] flex flex-col items-center text-center px-10 pointer-events-none">
                    <div className="font-mono text-[10px] tracking-[0.4em] uppercase text-cyan-200/75">
                      {isCreatorRoot ? "Root Architect" : "Founding Operator"}
                    </div>
                    <div
                      className="font-black text-6xl tracking-widest text-white mt-2"
                      style={{ textShadow: "0 0 22px rgba(103,232,249,0.7), 0 0 44px rgba(103,232,249,0.3)" }}
                    >
                      #{formattedNumber}
                    </div>
                    <div className="font-mono text-sm text-cyan-100/90 mt-2 tracking-wide">
                      {userProfile.displayName || "Founding Member"}
                    </div>
                    <div className="mt-3 pt-3 border-t border-cyan-200/25 font-mono text-[9px] tracking-[0.3em] uppercase text-cyan-200/60 leading-relaxed">
                      Collectible 3D original art<br />by the founder
                    </div>
                  </div>
                  <div className="absolute top-[3.5%] left-[4.5%] w-2 h-2 rounded-full bg-cyan-300 hud-blink" style={{ boxShadow: "0 0 10px rgba(103,232,249,0.9)" }} />
                  <div className="absolute top-[3.5%] right-[5%] w-2 h-2 rounded-full bg-rose-500 hud-blink-slow" style={{ boxShadow: "0 0 10px rgba(244,63,94,0.9)" }} />
                  <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ boxShadow: "inset 0 0 70px rgba(0,0,0,0.62)" }} />
                  <div className="absolute inset-0 pointer-events-none rounded-2xl hud-glow-pulse" style={{ boxShadow: "inset 0 0 24px rgba(103,232,249,0.22)" }} />
                </div>
{/* Card thickness: metallic edge strips bridging front/back faces.
                    Always visible (no backface culling) so the spin reads as a
                    solid card instead of flickering hollow at edge-on angles. */}
                <div
                  aria-hidden
                  className="absolute pointer-events-none"
                  style={{
                    top: -CARD_HALF, left: 0, width: "100%", height: CARD_T,
                    transform: "rotateX(-90deg)", background: edgeSheenH,
                  }}
                />
                <div
                  aria-hidden
                  className="absolute pointer-events-none"
                  style={{
                    bottom: -CARD_HALF, left: 0, width: "100%", height: CARD_T,
                    transform: "rotateX(90deg)", background: edgeSheenH,
                  }}
                />
                <div
                  aria-hidden
                  className="absolute pointer-events-none"
                  style={{
                    left: -CARD_HALF, top: 0, height: "100%", width: CARD_T,
                    transform: "rotateY(-90deg)", background: edgeSheenV,
                  }}
                />
                <div
                  aria-hidden
                  className="absolute pointer-events-none"
                  style={{
                    right: -CARD_HALF, top: 0, height: "100%", width: CARD_T,
                    transform: "rotateY(90deg)", background: edgeSheenV,
                  }}
                />
              </div>
            </div>

            {/* 360-Degree Interactive Control Toolbar */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                onClick={handleTrigger360Spin}
                disabled={isSpinning}
                className="px-3 py-1.5 rounded-lg bg-rust-500/20 hover:bg-rust-500/30 border border-rust-400/50 text-rust-300 font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                title="Perform an instant 360-degree spin"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isSpinning ? "animate-spin" : ""}`} />
                <span>Spin 360°</span>
              </button>

              <button
                onClick={() => {
                  cyberAudio.playCyberClick(1.0);
                  setIsAutoRotating((prev) => !prev);
                }}
                className={`px-3 py-1.5 rounded-lg border font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  isAutoRotating
                    ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/20"
                    : "bg-white/5 hover:bg-white/10 border-white/20 text-gray-300"
                }`}
                title="Toggle continuous 360-degree orbit rotation"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAutoRotating ? "animate-spin" : ""}`} />
                <span>{isAutoRotating ? "Orbiting (Active)" : "Auto-Orbit 360°"}</span>
              </button>

              <button
                onClick={() => {
                  cyberAudio.playCyberClick(1.0);
                  setIsAutoRotating(false);
                  setRotationY((prev) => (prev + 180) % 360);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/20 text-gray-300 hover:text-white font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                title="Flip between front holographic pass and back motherboard spec"
              >
                <Eye className="w-3.5 h-3.5 text-rebel-400" />
                <span>Flip 180°</span>
              </button>

              <button
                onClick={handleResetOrientation}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white font-mono text-[11px] transition-all"
                title="Reset angle to default (0° front view)"
              >
                Reset
              </button>
            </div>

            <p className="text-[11px] text-gray-400 text-center font-mono max-w-md">
              💡 <strong>Drag or swipe</strong> left/right on the card to inspect all 360 degrees in 3D, or use the controls above.
            </p>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                onClick={handleDownloadCard}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rust-400 to-rust-500 hover:from-rust-300 hover:to-rust-400 text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-rust-500/20 transition-all"
              >
                <Download className="w-4 h-4" />
                Download 3D Art Certificate (SVG)
              </button>

              <button
                onClick={() => {
                  cyberAudio.playCyberClick(1.0);
                  setActiveTab("sticker_merch");
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-mono text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all"
              >
                <Truck className="w-4 h-4 text-rust-400" />
                Claim Physical Sticker Kit
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Physical Merch & Sticker Pack Claim Kit */}
        {activeTab === "sticker_merch" && (
          <div className="p-6 space-y-6 bg-gradient-to-b from-black/60 to-[#070a14]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Sticker Preview Box */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-rust-500/40 bg-gradient-to-br from-rust-950/30 via-black to-rebel-950/30 p-5 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rust-400/20 text-rust-300 font-bold border border-rust-400/40">
                      FREE WITH FOUNDER PASS
                    </span>
                    <Sparkles className="w-4 h-4 text-rust-400 animate-pulse" />
                  </div>

                  <h4 className="font-sans font-black text-lg text-white">
                    Official atom-i Founder Die-Cut Metallic Sticker Pack
                  </h4>

                  <p className="text-xs text-gray-300 font-sans leading-relaxed">
                    Designed exclusively for founding members. We will ship a premium 4-piece die-cut sticker set featuring:
                  </p>

                  <ul className="text-xs text-gray-400 font-mono space-y-2 pl-1">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-rust-400 shrink-0" />
                      <span>1x Large Holographic Hex-Shield <strong>atom-i</strong> emblem</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-rust-400 shrink-0" />
                      <span>1x Brushed Chrome "GENESIS 199 FOUNDER" laptop bumper</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-rust-400 shrink-0" />
                      <span>2x Matte Black &amp; Cyan tactical micro-crests</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-rust-400 shrink-0" />
                      <span>Ultra-durable, waterproof, UV-proof 3M vinyl</span>
                    </li>
                  </ul>

                  <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-center gap-3 mt-4">
                    <Package className="w-5 h-5 text-rust-400 shrink-0" />
                    <div className="text-[11px] font-mono text-gray-300">
                      <div>SHIPPING: <strong>100% Free Worldwide Dispatch</strong></div>
                      <div className="text-[10px] text-gray-500">Tracked shipping to your designated address</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Claim Form or Already Claimed Badge */}
              <div className="rounded-2xl border border-white/10 bg-black/50 p-5">
                {shippingSubmitted ? (
                  <div className="py-6 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                      <Check className="w-8 h-8 stroke-[3]" />
                    </div>
                    <div>
                      <h4 className="font-sans font-black text-lg text-white">
                        Founder Freebie Claim Registered!
                      </h4>
                      <p className="text-xs text-emerald-300 font-mono mt-1">
                        Batch Dispatch #01 • Status: Queue Confirmed
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 font-sans leading-relaxed max-w-sm mx-auto">
                      Your custom <strong>atom-i</strong> Founder Die-Cut Sticker Pack has been logged. When the print batch prepares for shipping, confirmation will be dispatched.
                    </p>
                    <button
                      onClick={() => {
                        cyberAudio.playCyberClick(1.0);
                        setShippingSubmitted(false);
                      }}
                      className="text-xs font-mono text-rebel-400 hover:text-rebel-300 underline"
                    >
                      Update Shipping Information
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleShippingSubmit} className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-sans font-bold text-sm text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rust-400" />
                        Enter Shipping Destination
                      </h4>
                      <span className="text-[10px] font-mono text-gray-400">FREE GLOBAL</span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                        Recipient Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Operative Name"
                        className="w-full bg-black/60 border border-white/20 focus:border-rust-400 rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        required
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="123 Tactical Sector Blvd, Apt 4B"
                        className="w-full bg-black/60 border border-white/20 focus:border-rust-400 rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                          City / State
                        </label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="City, State/Region"
                          className="w-full bg-black/60 border border-white/20 focus:border-rust-400 rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                          Postal / Zip Code
                        </label>
                        <input
                          type="text"
                          required
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="Postal Code"
                          className="w-full bg-black/60 border border-white/20 focus:border-rust-400 rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        required
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="United States, Canada, UK, etc."
                        className="w-full bg-black/60 border border-white/20 focus:border-rust-400 rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                        Custom Inscription Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Include custom callsign on package"
                        className="w-full bg-black/60 border border-white/20 focus:border-rust-400 rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingShipping}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rust-400 to-rust-500 hover:from-rust-300 hover:to-rust-400 text-black font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-rust-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Truck className="w-4 h-4" />
                      {isSubmittingShipping ? "Transmitting..." : "Dispatch Free Founder Sticker Kit"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-black/80 border-t border-rust-500/20 flex items-center justify-between">
          <p className="text-[10px] font-mono text-gray-500">
            A.T.O.M-i Genesis Cohort • Restricted strictly to the initial 199 founding operators
          </p>
          <button
            onClick={() => {
              cyberAudio.playCyberClick(1.0);
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-mono text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
