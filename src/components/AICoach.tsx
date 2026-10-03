/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, Goal } from "../types";
import {
  Send,
  Terminal,
  Cpu,
  Sparkles,
  Radio,
  History,
  Archive,
  Search,
  BookOpen,
  ChevronDown,
  Check,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { cyberAudio } from "../lib/cyberAudio";

interface AICoachProps {
  goal: Goal | null;
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isCoachTyping: boolean;
  onOpenLiveVoice?: () => void;
}

export default function AICoach({
  goal,
  messages,
  onSendMessage,
  isCoachTyping,
  onOpenLiveVoice,
}: AICoachProps) {
  const [input, setInput] = useState("");
  // View mode: 'stream' (rolling active stream) or 'archive' (complete searchable log)
  const [viewMode, setViewMode] = useState<"stream" | "archive">("stream");
  // Stream retention size (number of recent messages kept in active HUD)
  const [streamWindowSize, setStreamWindowSize] = useState<number>(5);
  // Reading pause: when paused, new messages don't push older ones out of view until unpaused
  const [isReadingPaused, setIsReadingPaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll the chat list to bottom when new messages arrive (unless user is in archive or reading mode).
  // Scrolls only this panel's own container — never the page (scrollIntoView
  // on mount used to yank the whole cockpit view to the bottom).
  useEffect(() => {
    if (viewMode === "stream" && !isReadingPaused) {
      const el = containerRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length, isCoachTyping, viewMode, isReadingPaused]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    cyberAudio.playCyberClick(1.2);
    setInput("");
    onSendMessage(text);
  };

  // Determine messages to display:
  // In 'stream' mode, only show the latest `streamWindowSize` messages so the chat never grows unbounded.
  // In 'archive' mode, show all messages filtered by search query.
  const visibleMessages =
    viewMode === "archive"
      ? messages.filter((m) =>
          searchQuery
            ? m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
              m.sender.toLowerCase().includes(searchQuery.toLowerCase())
            : true
        )
      : isReadingPaused
      ? messages.slice(-Math.max(streamWindowSize, 8))
      : messages.slice(-streamWindowSize);

  const archivedCount = Math.max(0, messages.length - streamWindowSize);

  return (
    <div className="flex flex-col h-[390px] max-h-[390px] border border-cyan-500/20 bg-black/75 rounded-2xl backdrop-blur-md overflow-hidden shadow-xl shadow-black/50 tactical-corner-frame hover-focus-border">
      {/* Head Panel */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-cyan-950/60 via-purple-950/20 to-black border-b border-cyan-500/20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-950/90 border border-cyan-400/50 text-cyan-400 shrink-0">
            <Cpu className="w-3.5 h-3.5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="truncate">
            <h3 className="font-sans font-bold text-xs tracking-wider text-white flex items-center gap-1.5 leading-tight">
              <span>atom-i</span>
              <span className="text-[9px] text-cyan-400 font-mono font-normal lowercase tracking-normal">
                tactical mentor
              </span>
            </h3>
            <p className="text-[8px] text-cyan-400/70 font-mono tracking-tight leading-none truncate">
              {viewMode === "stream"
                ? `rolling stream • ${isReadingPaused ? "reading mode [held]" : `latest ${streamWindowSize} in hud`}`
                : `full archive transcript • ${messages.length} total`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Pause / Reading Hold toggle */}
          {viewMode === "stream" && messages.length > 2 && (
            <button
              onClick={() => {
                cyberAudio.playCyberClick(1.0);
                setIsReadingPaused(!isReadingPaused);
              }}
              title={
                isReadingPaused
                  ? "Resume rolling stream auto-advance"
                  : "Pause vanishing (Reading Hold) to comfortably finish reading"
              }
              className={`flex items-center gap-1 font-mono text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                isReadingPaused
                  ? "bg-amber-500/20 border-amber-400/50 text-amber-300"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              {isReadingPaused ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
              <span className="hidden sm:inline">{isReadingPaused ? "RESUME" : "HOLD"}</span>
            </button>
          )}

          {/* Toggle between rolling recent stream and archive */}
          <button
            onClick={() => {
              cyberAudio.playCyberClick(1.0);
              setViewMode(viewMode === "stream" ? "archive" : "stream");
            }}
            title={viewMode === "stream" ? "Open Complete Conversation Archive" : "Return to Live Rolling Stream"}
            className={`flex items-center gap-1 font-mono text-[9px] px-2 py-0.5 rounded border transition-colors ${
              viewMode === "archive"
                ? "bg-cyan-500/25 border-cyan-400/60 text-cyan-300 shadow-sm shadow-cyan-500/20"
                : "bg-white/5 border-white/10 text-gray-300 hover:text-white"
            }`}
          >
            <History className="w-3 h-3 text-cyan-400" />
            <span>{viewMode === "archive" ? "STREAM" : `LOG (${messages.length})`}</span>
          </button>

          {onOpenLiveVoice && (
            <button
              onClick={onOpenLiveVoice}
              title="Activate Gemini 3.8 Live Voice"
              className="flex items-center gap-1 font-mono text-[9px] text-cyan-300 bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 px-2 py-0.5 rounded transition-colors"
            >
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span className="hidden sm:inline">LIVE</span>
            </button>
          )}
        </div>
      </div>

      {/* Archive Search Bar (shown only in archive view) */}
      {viewMode === "archive" && (
        <div className="px-3 py-1.5 bg-cyan-950/40 border-b border-cyan-500/20 flex items-center justify-between gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-cyan-400/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search complete transmission log..."
              className="w-full bg-black/60 border border-cyan-500/30 rounded pl-7 pr-2 py-1 text-[10px] text-white font-mono placeholder-gray-500 outline-none focus:border-cyan-400"
            />
          </div>
          <button
            onClick={() => setViewMode("stream")}
            className="text-[9px] font-mono text-cyan-400 hover:text-white underline cursor-pointer shrink-0"
          >
            Return to Stream
          </button>
        </div>
      )}

      {/* Message Output - Strictly contained and scrollable */}
      <div
        ref={containerRef}
        className="flex-1 p-3 overflow-y-auto space-y-2.5 custom-scrollbar bg-black/35 text-xs min-h-0"
      >
        {/* Rolling stream notification bar if earlier messages exist */}
        {viewMode === "stream" && archivedCount > 0 && (
          <div
            onClick={() => {
              cyberAudio.playCyberClick(1.0);
              setViewMode("archive");
            }}
            className="p-1 rounded bg-cyan-950/20 hover:bg-cyan-950/50 border border-cyan-500/20 hover:border-cyan-400/40 text-center font-mono text-[9px] text-cyan-300/80 hover:text-cyan-200 cursor-pointer transition-all flex items-center justify-between px-2"
            title="Click to view all archived messages without losing context"
          >
            <span className="flex items-center gap-1">
              <Archive className="w-2.5 h-2.5 text-cyan-400" />
              <span>↑ {archivedCount} earlier message{archivedCount > 1 ? "s" : ""} archived</span>
            </span>
            <span className="text-[8px] uppercase tracking-wider text-cyan-400 underline">
              View Complete Transcript
            </span>
          </div>
        )}

        {visibleMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-2">
            <Terminal className="w-7 h-7 text-cyan-500/40 animate-pulse" />
            <p className="text-[10px] font-mono text-cyan-400/50 uppercase tracking-widest">
              {viewMode === "archive" ? "No matching log entries found" : "Tactical Feed Initialized"}
            </p>
            <p className="text-[11px] text-gray-400 max-w-xs leading-relaxed font-sans">
              "Affirmative. I'm locked into your atomizer matrix. Toss me whatever goal you're stuck on, and let's chop it into raw, doable momentum."
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {visibleMessages.map((msg, idx) => {
              const isCoach = msg.sender === "coach";
              // Calculate reading index relative to current rolling stream
              const isOlderInStream =
                viewMode === "stream" && idx === 0 && visibleMessages.length >= streamWindowSize;

              return (
                <div
                  key={msg.id || `msg-${idx}`}
                  className={`flex ${isCoach ? "justify-start" : "justify-end"} items-start gap-2 animate-fade-in transition-opacity ${
                    isOlderInStream ? "opacity-90" : "opacity-100"
                  }`}
                >
                  {isCoach && (
                    <div className="flex items-center justify-center w-5 h-5 rounded bg-cyan-950/90 border border-cyan-500/40 text-cyan-400 shrink-0 text-[9px] font-mono mt-0.5">
                      A
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-xl p-2.5 border font-sans text-xs leading-relaxed shadow-sm ${
                      isCoach
                        ? "bg-cyan-950/30 border-cyan-500/20 text-gray-100 rounded-tl-none"
                        : "bg-purple-950/40 border-purple-500/30 text-gray-100 rounded-tr-none"
                    }`}
                  >
                    <p className="whitespace-pre-line select-text">{msg.text}</p>
                    <div
                      className={`text-[8px] font-mono mt-1 flex items-center justify-between gap-2 ${
                        isCoach ? "text-cyan-400/50" : "text-purple-400/50"
                      }`}
                    >
                      <span>{msg.timestamp || "LOGGED"}</span>
                      {viewMode === "archive" && (
                        <span className="text-[7px] uppercase tracking-wider text-gray-500">
                          ARCHIVE ENTRY
                        </span>
                      )}
                    </div>
                  </div>
                  {!isCoach && (
                    <div className="flex items-center justify-center w-5 h-5 rounded bg-purple-950/90 border border-purple-500/40 text-purple-400 shrink-0 text-[9px] font-mono mt-0.5">
                      U
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {isCoachTyping && (
          <div className="flex justify-start items-center gap-2">
            <div className="flex items-center justify-center w-5 h-5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-400 shrink-0 text-[9px] font-mono animate-pulse">
              A
            </div>
            <div className="bg-cyan-950/30 border border-cyan-500/20 text-cyan-300 rounded-xl rounded-tl-none px-3 py-1.5 text-xs font-mono tracking-widest flex items-center gap-1.5">
              <span>DECOMPOSING</span>
              <span className="animate-bounce">.</span>
              <span className="animate-bounce delay-100">.</span>
              <span className="animate-bounce delay-200">.</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Stream Window Adjuster & Reading Status Footer */}
      <div className="px-3 py-1 bg-black/90 border-t border-cyan-500/10 flex items-center justify-between text-[9px] font-mono text-gray-500 shrink-0">
        <div className="flex items-center gap-2">
          <span>HUD CAPACITY:</span>
          {[3, 5, 8].map((size) => (
            <button
              key={size}
              onClick={() => {
                cyberAudio.playCyberClick(0.9);
                setStreamWindowSize(size);
              }}
              title={`Keep latest ${size} messages in active view`}
              className={`px-1.5 py-0.2 rounded transition-colors ${
                streamWindowSize === size
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                  : "hover:text-gray-300"
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 text-[8px] text-cyan-400/70">
          <span>{isReadingPaused ? "⏸ READING HOLD (STREAM FROZEN)" : "AUTO-STREAM ACTIVE"}</span>
        </div>
      </div>

      {/* Chat Form Input */}
      <form
        onSubmit={handleSubmit}
        className="p-2.5 bg-black/80 border-t border-cyan-500/15 flex gap-2 items-center shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            goal
              ? `Ask atom-i about "${goal.title}"...`
              : "Awaiting atomizer compilation..."
          }
          disabled={!goal || isCoachTyping}
          className="flex-1 bg-black/60 border border-cyan-500/25 focus:border-cyan-400 hover:border-cyan-500/40 focus:ring-1 focus:ring-cyan-400/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none transition-all duration-200 font-sans"
        />
        <button
          type="submit"
          disabled={!goal || isCoachTyping || !input.trim()}
          className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-md shadow-cyan-500/20 flex items-center justify-center shrink-0"
          title="Send Transmission"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
