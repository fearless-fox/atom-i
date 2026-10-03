import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Radio,
  X,
  AlertCircle,
  Square,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Volume2,
  Sparkles,
  Zap,
  UserCheck
} from "lucide-react";
import { Goal } from "../types";
import { float32ToPCM16Base64, downsampleTo16k, LiveAudioPlayer } from "../lib/audioLive";
import { cyberAudio } from "../lib/cyberAudio";
import { MaleVoiceModal } from "./MaleVoiceModal";

interface LiveVoiceCoachProps {
  goal: Goal;
  isOpen: boolean;
  onClose: () => void;
  voiceMinutesRemaining?: number;
  onOpenPaywall?: () => void;
}

export const LiveVoiceCoach: React.FC<LiveVoiceCoachProps> = ({
  goal,
  isOpen,
  onClose,
  voiceMinutesRemaining = 0,
  onOpenPaywall,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [echoShield, setEchoShield] = useState(true);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isForcedOverride, setIsForcedOverride] = useState(false);
  const [statusText, setStatusText] = useState("Tap Connect to begin real-time voice session");
  const [liveTranscript, setLiveTranscript] = useState<Array<{ sender: "user" | "coach"; text: string }>>([]);
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Male Voice Matrix Configuration
  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    return localStorage.getItem("atom_male_voice") || "Pegasus";
  });
  const [selectedAccent, setSelectedAccent] = useState<"uk" | "global">(() => {
    return (localStorage.getItem("atom_male_accent") as "uk" | "global") || "uk";
  });
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);

  const selectedVoiceRef = useRef(selectedVoice);
  const selectedAccentRef = useRef(selectedAccent);

  useEffect(() => {
    selectedVoiceRef.current = selectedVoice;
  }, [selectedVoice]);

  useEffect(() => {
    selectedAccentRef.current = selectedAccent;
  }, [selectedAccent]);

  const wsRef = useRef<WebSocket | null>(null);
  const audioPlayerRef = useRef<LiveAudioPlayer | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const isMutedRef = useRef(false);
  const echoShieldRef = useRef(true);
  const isAiSpeakingRef = useRef(false);
  const isForcedOverrideRef = useRef(false);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const transcriptContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    echoShieldRef.current = echoShield;
  }, [echoShield]);

  useEffect(() => {
    isForcedOverrideRef.current = isForcedOverride;
  }, [isForcedOverride]);

  useEffect(() => {
    // Scroll only the transcript's own container — never the page.
    const el = transcriptContainerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [liveTranscript]);

  // Spacebar hotkey to immediately interrupt/stop the AI if speaking
  useEffect(() => {
    if (!isOpen || !isConnected) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.code === "Space") {
        if (isAiSpeakingRef.current) {
          e.preventDefault();
          handleInterruptOrStop();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isConnected]);

  // User Stop / Interrupt action
  const handleInterruptOrStop = () => {
    cyberAudio.playCyberClick(1.35);

    if (audioPlayerRef.current) {
      audioPlayerRef.current.stopAll();
    }
    setIsAiSpeaking(false);
    isAiSpeakingRef.current = false;
    setIsForcedOverride(false);
    isForcedOverrideRef.current = false;

    setStatusText("Coach stopped • Your mic is open, speak now.");

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "client_interrupted" }));
    }
  };

  const disconnectSession = () => {
    // Stop mic stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Stop script processor
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    // Close AudioContext
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop audio player
    if (audioPlayerRef.current) {
      audioPlayerRef.current.close();
      audioPlayerRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setIsAiSpeaking(false);
    isAiSpeakingRef.current = false;
    setIsForcedOverride(false);
    isForcedOverrideRef.current = false;
    setVolumeLevel(0);
    setStatusText("Session terminated. Ready to reconnect.");
  };

  const handleSelectVoice = (voice: string, accent: "uk" | "global") => {
    cyberAudio.playCyberClick(1.2);
    setSelectedVoice(voice);
    setSelectedAccent(accent);
    localStorage.setItem("atom_male_voice", voice);
    localStorage.setItem("atom_male_accent", accent);

    if (isConnected) {
      disconnectSession();
      setStatusText(`Re-establishing neural link: ${voice} (${accent === "uk" ? "English U.K." : "Global"})...`);
      setTimeout(() => {
        connectSession(voice, accent);
      }, 350);
    }
  };

  const connectSession = async (overrideVoice?: string, overrideAccent?: "uk" | "global") => {
    try {
      setErrorMsg(null);
      setIsConnecting(true);
      const activeVoice = overrideVoice || selectedVoiceRef.current;
      const activeAccent = overrideAccent || selectedAccentRef.current;
      setStatusText(`Initializing Gemini 3.8 Live neural link [${activeVoice} • ${activeAccent.toUpperCase()}]...`);

      // Initialize audio player with playback state listener
      const player = new LiveAudioPlayer();
      audioPlayerRef.current = player;

      player.onPlaybackStateChange = (playing: boolean) => {
        setIsAiSpeaking(playing);
        isAiSpeakingRef.current = playing;

        if (playing) {
          if (echoShieldRef.current && !isForcedOverrideRef.current) {
            setStatusText("Gemini is speaking • Mic muted (Echo Shield active)");
          } else {
            setStatusText("Gemini is speaking • Full duplex live");
          }
        } else {
          setIsForcedOverride(false);
          isForcedOverrideRef.current = false;
          setStatusText("Live listening • Speak anytime...");
        }
      };

      // Determine websocket protocol and host
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatusText(`Handshaking with Gemini 3.8 Live model (${activeVoice})...`);
        // Send start handshake with current goal overview
        const goalContext = `Goal Title: ${goal.title}.
Progress: ${goal.progress}%.
Phases: ${goal.phases.map((p) => `${p.title} (${p.tasks.length} tasks)`).join(", ")}.
Strategic Insight: ${goal.insight || "Focus on atomic high-impact tasks."}`;

        ws.send(
          JSON.stringify({
            type: "start",
            goalContext,
            voice: activeVoice,
            accent: activeAccent,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "ready") {
            setIsConnected(true);
            setIsConnecting(false);
            setStatusText("Connected • Gemini 3.8 Live is listening. Speak clearly.");
          } else if (data.type === "audio" && data.audio) {
            audioPlayerRef.current?.playChunk(data.audio);
          } else if (data.type === "text" && data.text) {
            setLiveTranscript((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.sender === "coach") {
                return [...prev.slice(0, -1), { ...last, text: last.text + data.text }];
              }
              return [...prev, { sender: "coach", text: data.text }];
            });
          } else if (data.type === "interrupted") {
            audioPlayerRef.current?.stopAll();
            setIsAiSpeaking(false);
            isAiSpeakingRef.current = false;
            setStatusText("Coach interrupted • Listening to you...");
          } else if (data.type === "turnComplete") {
            if (!audioPlayerRef.current?.getIsPlaying()) {
              setStatusText("Live listening • Speak anytime...");
            }
          } else if (data.type === "error") {
            setErrorMsg(data.error);
            setStatusText("Encountered connection error.");
          }
        } catch (e) {
          console.error("WS parse error:", e);
        }
      };

      ws.onerror = (err) => {
        console.error("Live WebSocket error:", err);
        setErrorMsg("Failed to connect to Live API backend.");
        setIsConnecting(false);
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        setIsAiSpeaking(false);
        isAiSpeakingRef.current = false;
      };

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      // Use ScriptProcessorNode to capture raw PCM audio chunks
      const processor = audioCtx.createScriptProcessor(2048, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        // Echo Shield auto-mute logic:
        // When AI is speaking, suppress mic transmission to prevent audio playback feedback loop
        const aiSpeaking = isAiSpeakingRef.current;
        const shieldActive = echoShieldRef.current && !isForcedOverrideRef.current;
        const isAutoMuted = shieldActive && aiSpeaking;
        const isSuppressed = isMutedRef.current || isAutoMuted;

        if (isSuppressed || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          setVolumeLevel(0);
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);

        // Calculate simple volume level for visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += Math.abs(inputData[i]);
        }
        const avg = sum / inputData.length;
        setVolumeLevel(Math.min(100, Math.round(avg * 400)));

        // Downsample input to 16kHz
        const downsampled = downsampleTo16k(inputData, audioCtx.sampleRate);
        const base64PCM = float32ToPCM16Base64(downsampled);

        wsRef.current.send(
          JSON.stringify({
            type: "audio",
            audio: base64PCM,
          })
        );
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
    } catch (err: any) {
      console.error("Failed to start Live session:", err);
      setErrorMsg(err.message || "Microphone access denied or audio failed.");
      setIsConnecting(false);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    return () => {
      disconnectSession();
    };
  }, []);

  if (!isOpen) return null;

  const isMicCurrentlyShielded = echoShield && isAiSpeaking && !isForcedOverride;

  return (
    <div
      id="live-voice-coach-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-[#08080f] border border-cyan-500/30 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col relative tactical-corner-frame">
        {/* Glow Header */}
        <div className="p-4 bg-black/70 border-b border-cyan-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-fuchsia-600 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
              <Radio className={`w-5 h-5 text-white ${isConnected ? "animate-pulse text-cyan-200" : ""}`} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-sans font-bold text-sm text-white tracking-wider flex items-center">
                  atom-i <span className="text-[11px] text-cyan-400 font-mono font-normal ml-1.5 lowercase">powered by gemini</span>
                </h3>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/40">
                  GEMINI 3.8 LIVE
                </span>
                <button
                  onClick={() => {
                    cyberAudio.playCyberClick(1.1);
                    setShowVoiceModal(true);
                  }}
                  className="font-mono text-[9px] text-cyan-300 hover:text-white bg-cyan-950/70 hover:bg-cyan-900/70 border border-cyan-500/50 hover:border-cyan-400 px-2 py-0.5 rounded transition-all flex items-center gap-1 shadow-sm shadow-cyan-950/50"
                  title="Configure Male Voice Matrix (Pegasus / UK Accent)"
                >
                  <span>🎙️ {selectedVoice} ({selectedAccent === "uk" ? "U.K." : "Global"})</span>
                  <span className="text-[8px] text-cyan-400">▾</span>
                </button>
              </div>
              <p className="text-[10px] text-gray-400 font-mono flex flex-wrap items-center gap-1.5 mt-0.5">
                <span>Male Voice: <strong className="text-cyan-300 font-mono">{selectedVoice}</strong></span>
                <span>•</span>
                <span>Dialect: <strong className="text-cyan-300">{selectedAccent === "uk" ? "English (U.K.) Direct" : "Deep Raw Grit"}</strong></span>
                <span>•</span>
                <span>PCM 16kHz</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-fuchsia-950/60 border border-fuchsia-500/30 font-mono text-[10px]">
              <span className="text-gray-400">BALANCE:</span>
              <strong className="text-fuchsia-300">{voiceMinutesRemaining} MINS</strong>
              {onOpenPaywall && (
                <button
                  onClick={onOpenPaywall}
                  className="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 hover:bg-fuchsia-500/40 uppercase"
                >
                  + Top Up
                </button>
              )}
            </div>

            <button
              onClick={() => {
                disconnectSession();
                onClose();
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tactical Hologram Audio Wave Visualizer */}
        <div className="p-6 flex flex-col items-center justify-center bg-gradient-to-b from-cyan-950/20 via-black to-black border-b border-cyan-900/30 relative">
          
          {/* Echo Shield Status Ribbon */}
          <div className="mb-2 flex items-center gap-2">
            {isMicCurrentlyShielded ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 text-[10px] font-mono tracking-wider shadow-lg shadow-cyan-900/40 animate-pulse">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>ECHO SHIELD ACTIVE: MIC AUTO-MUTED (AI SPEAKING)</span>
              </div>
            ) : isConnected ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono tracking-wider">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>MIC OPEN & LISTENING • SPEAK FREELY</span>
              </div>
            ) : null}
          </div>

          <div className="relative w-36 h-36 flex items-center justify-center my-2">
            {/* Dynamic radar rings */}
            <div
              className={`absolute inset-0 rounded-full border border-cyan-500/20 transition-all duration-300 ${
                isConnected ? "animate-ping opacity-30" : "opacity-10"
              }`}
              style={{
                transform: `scale(${1 + (isAiSpeaking ? 25 : volumeLevel) * 0.01})`,
                borderColor: isAiSpeaking ? "rgba(217, 70, 239, 0.4)" : "rgba(6, 182, 212, 0.4)"
              }}
            />
            <div
              className={`absolute inset-2 rounded-full border transition-all duration-150 ${
                isAiSpeaking
                  ? "border-fuchsia-500/40 scale-105"
                  : isConnected
                  ? "border-cyan-500/20"
                  : "border-gray-800"
              }`}
            />
            <div className="w-24 h-24 rounded-full bg-black/90 border border-cyan-400/40 flex flex-col items-center justify-center shadow-inner relative z-10">
              {isAiSpeaking ? (
                <Volume2 className="w-8 h-8 text-fuchsia-400 animate-pulse" />
              ) : (
                <Sparkles
                  className={`w-8 h-8 transition-colors ${
                    isConnected ? "text-cyan-400 animate-pulse" : "text-gray-600"
                  }`}
                />
              )}
              <span className="text-[8px] font-mono font-bold mt-1 uppercase tracking-widest text-center px-1">
                {isAiSpeaking ? (
                  <span className="text-fuchsia-400">AI TALKING</span>
                ) : isConnected ? (
                  <span className="text-cyan-400">LISTENING</span>
                ) : isConnecting ? (
                  <span className="text-amber-400">LINKING</span>
                ) : (
                  <span className="text-gray-500">STANDBY</span>
                )}
              </span>
            </div>
          </div>

          {/* Real-time VU Frequency Bars */}
          <div className="flex items-center gap-1.5 h-6 mt-2">
            {Array.from({ length: 24 }).map((_, i) => {
              const active = isAiSpeaking
                ? Math.sin(Date.now() / 200 + i) > -0.2
                : isConnected && !isMuted && volumeLevel > i * 4;
              return (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-75 ${
                    active
                      ? isAiSpeaking
                        ? "bg-gradient-to-t from-fuchsia-600 to-cyan-400 h-6"
                        : "bg-gradient-to-t from-cyan-500 to-emerald-400 h-6"
                      : "bg-gray-800/40 h-2"
                  }`}
                />
              );
            })}
          </div>

          <p className="mt-3 text-xs font-mono text-cyan-300 text-center tracking-wide">
            {statusText}
          </p>

          {/* Quick Override / Stop Coach Banner when speaking */}
          {isConnected && isAiSpeaking && (
            <div className="mt-3 flex items-center gap-2 animate-fade-in">
              <button
                onClick={handleInterruptOrStop}
                className="px-4 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/60 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-rose-900/30 transition-all hover:scale-105 active:scale-95"
                title="Immediately stop Gemini's voice and open your mic"
              >
                <Square className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
                STOP COACH (Space)
              </button>

              <button
                onClick={() => {
                  cyberAudio.playCyberClick(1.1);
                  setIsForcedOverride(!isForcedOverride);
                }}
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-mono uppercase tracking-wider transition-all ${
                  isForcedOverride
                    ? "bg-amber-500/30 border-amber-500 text-amber-200"
                    : "bg-white/5 border-white/20 text-gray-300 hover:text-white hover:bg-white/10"
                }`}
                title="Force microphone open to speak over the coach"
              >
                {isForcedOverride ? "Override: Mic Forced ON" : "Talk Over (Override)"}
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="mt-3 px-3 py-1.5 bg-rose-950/40 border border-rose-500/40 rounded-lg flex items-center gap-2 text-rose-300 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Live Conversation Stream Transcript */}
        <div
          ref={transcriptContainerRef}
          className="flex-1 p-4 max-h-56 overflow-y-auto custom-scrollbar space-y-2 bg-black/40 text-xs font-sans"
        >
          {liveTranscript.length === 0 ? (
            <div className="text-center py-6 text-gray-500 font-mono text-[11px] uppercase tracking-wider">
              No live speech exchanges yet. Connect and talk naturally to atom-i powered by gemini.
            </div>
          ) : (
            liveTranscript.map((entry, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${entry.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-2.5 rounded-xl text-xs font-sans leading-relaxed ${
                    entry.sender === "user"
                      ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-100"
                      : "bg-fuchsia-950/30 border border-fuchsia-500/30 text-gray-200"
                  }`}
                >
                  <span className="block text-[9px] font-mono font-bold tracking-widest mb-1 text-gray-400">
                    {entry.sender === "user" ? "You" : "atom-i powered by gemini (Live Voice)"}
                  </span>
                  {entry.text}
                </div>
              </div>
            ))
          )}
          <div ref={transcriptEndRef} />
        </div>

        {/* Control Footer */}
        <div className="p-4 bg-black/60 border-t border-cyan-900/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {!isConnected ? (
              <button
                onClick={() => connectSession()}
                disabled={isConnecting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white font-sans text-xs font-bold tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                <Mic className="w-4 h-4" />
                {isConnecting ? "Connecting..." : "Connect Voice Session"}
              </button>
            ) : (
              <>
                <button
                  onClick={disconnectSession}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-mono text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2"
                >
                  <MicOff className="w-4 h-4" />
                  End Session
                </button>

                {/* Instant Stop / Cut-In Button */}
                {isAiSpeaking && (
                  <button
                    onClick={handleInterruptOrStop}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 shadow-md shadow-amber-900/20"
                    title="Stop Gemini talking and switch to listening mode"
                  >
                    <Square className="w-3.5 h-3.5 fill-amber-300" />
                    Stop Voice
                  </button>
                )}

                {/* Manual Mute Toggle */}
                <button
                  onClick={() => {
                    cyberAudio.playCyberClick(isMuted ? 1.2 : 0.8);
                    setIsMuted(!isMuted);
                  }}
                  className={`p-2 rounded-xl border transition-all ${
                    isMuted
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                      : "bg-white/5 border-white/10 text-gray-300 hover:text-white"
                  }`}
                  title={isMuted ? "Unmute microphone" : "Mute microphone"}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </>
            )}

            {/* Voice Matrix Launcher */}
            <button
              onClick={() => {
                cyberAudio.playCyberClick(1.0);
                setShowVoiceModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-mono bg-cyan-950/60 border-cyan-500/40 text-cyan-300 hover:border-cyan-400 hover:text-white transition-all shadow-sm shadow-cyan-950/40"
              title="Open Male Voice Matrix Modal (Pegasus / UK Accent)"
            >
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              <span>Voice: <strong className="text-white">{selectedVoice}</strong> ({selectedAccent === "uk" ? "U.K." : "Global"})</span>
            </button>
          </div>

          {/* Echo Shield Settings & Info */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                cyberAudio.playCyberClick(echoShield ? 0.9 : 1.15);
                setEchoShield(!echoShield);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-mono transition-all ${
                echoShield
                  ? "bg-cyan-950/60 border-cyan-500/40 text-cyan-300"
                  : "bg-black/60 border-gray-700 text-gray-400 hover:text-white"
              }`}
              title="Automatically mutes microphone while Gemini speaks to prevent acoustic loop and stutter"
            >
              {echoShield ? (
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 text-gray-500" />
              )}
              <span>Echo Shield: {echoShield ? "ON" : "OFF"}</span>
            </button>

            <div className="text-right font-mono text-[9px] text-gray-500 hidden sm:block">
              16kHz PCM • DAMPED ECHO SUPPRESSION
            </div>
          </div>
        </div>
      </div>

      {/* Male Voice Modal */}
      <MaleVoiceModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        selectedVoice={selectedVoice}
        selectedAccent={selectedAccent}
        onSelectVoice={handleSelectVoice}
        isConnected={isConnected}
      />
    </div>
  );
};
