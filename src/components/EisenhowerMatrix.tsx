/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Task } from "../types";
import { CheckSquare, Square, Calendar, Zap, AlertCircle, HelpCircle, Trash2 } from "lucide-react";
import { cyberAudio } from "../lib/cyberAudio";

interface EisenhowerMatrixProps {
  tasks: Task[];
  onSelectTask: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onScheduleTask: (task: Task) => void;
}

export default function EisenhowerMatrix({
  tasks,
  onSelectTask,
  onToggleComplete,
  onScheduleTask,
}: EisenhowerMatrixProps) {
  // Sort tasks into quadrants
  const doFirst = tasks.filter((t) => t.importance === "Important" && t.urgency === "Urgent");
  const schedule = tasks.filter((t) => t.importance === "Important" && t.urgency === "Not Urgent");
  const delegate = tasks.filter((t) => t.importance === "Not Important" && t.urgency === "Urgent");
  const eliminate = tasks.filter((t) => t.importance === "Not Important" && t.urgency === "Not Urgent");

  // Determine priority dynamic level
  let priorityLabel = "LOW";
  let activeBarsCount = 1;
  let barColorClass = "bg-rebel-500/40";

  if (doFirst.length >= 3) {
    priorityLabel = "CRITICAL";
    activeBarsCount = 5;
    barColorClass = "bg-rose-500/60";
  } else if (doFirst.length > 0) {
    priorityLabel = "HIGH";
    activeBarsCount = 4;
    barColorClass = "bg-rust-500/50";
  } else if (schedule.length > 0) {
    priorityLabel = "MEDIUM";
    activeBarsCount = 3;
    barColorClass = "bg-rebel-500/40";
  } else {
    priorityLabel = "LOW";
    activeBarsCount = 2;
    barColorClass = "bg-slate-500/30";
  }

  const renderQuadrant = (
    title: string,
    subtitle: string,
    items: Task[],
    accentColor: string,
    textColor: string
  ) => {
    return (
      <div className="bg-[#08080a] p-3 flex flex-col h-[200px] min-h-[160px]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>
            {title}
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-gray-400">
            {items.length}
          </span>
        </div>
        <p className="text-[8px] text-gray-500 font-mono uppercase tracking-tighter mb-2">
          {subtitle}
        </p>

        {/* Quadrant Content */}
        <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-0.5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center select-none text-[8px] text-gray-600 font-mono uppercase tracking-wider">
              No active items
            </div>
          ) : (
            items.map((task) => (
              <div
                key={task.id}
                onClick={() => {
                  cyberAudio.playNodeSelect();
                  onSelectTask(task.id);
                }}
                className={`group flex items-center justify-between p-1.5 rounded border transition-all duration-200 cursor-pointer hover-focus-trace ${
                  task.completed ? "opacity-35 line-through" : ""
                }`}
                style={{
                  backgroundColor: `${accentColor}08`,
                  borderColor: `${accentColor}25`,
                }}
              >
                <div className="flex items-center gap-1.5 overflow-hidden flex-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      cyberAudio.playTaskToggle(!task.completed);
                      onToggleComplete(task.id);
                    }}
                    className="text-gray-500 hover:text-white transition-colors shrink-0"
                  >
                    {task.completed ? (
                      <CheckSquare className="w-3.5 h-3.5" style={{ color: accentColor }} />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <span className="text-[10px] font-sans truncate font-medium text-gray-200">
                    {task.title}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    title="Schedule in Planner"
                    onClick={(e) => {
                      e.stopPropagation();
                      cyberAudio.playCyberClick(1.15);
                      onScheduleTask(task);
                    }}
                    className="p-0.5 rounded bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-colors"
                  >
                    <Calendar className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col bg-black/50 border border-rebel-900/40 rounded-xl overflow-hidden shadow-lg backdrop-blur-sm tactical-corner-frame hover-focus-border">
      {/* Header */}
      <div className="p-4 border-b border-rebel-900/30 flex justify-between items-center bg-black/35 hover-focus-trace">
        <h3 className="text-xs font-bold text-white tracking-widest flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-rebel-400 animate-pulse" /> EISENHOWER OPTIMIZATION
        </h3>
        <span className="text-[9px] font-mono text-rebel-400 tracking-wider bg-rebel-950/30 border border-rebel-500/20 px-2 py-0.5 rounded">
          AUTO-POPULATED
        </span>
      </div>

      {/* Grid Quadrants */}
      <div className="grid grid-cols-2 gap-px bg-rebel-900/20">
        {renderQuadrant("Q1: Urgent & Important", "Do first immediately", doFirst, "#ef4444", "text-red-200")}
        {renderQuadrant("Q2: Important / Not Urgent", "Schedule strategic dates", schedule, "#06b6d4", "text-rebel-200")}
        {renderQuadrant("Q3: Urgent / Not Important", "Delegate or streamline", delegate, "#FF4D1C", "text-rust-200")}
        {renderQuadrant("Q4: Not Urgent/Important", "Eliminate bottlenecks", eliminate, "#a1a1aa", "text-gray-400")}
      </div>

      {/* Dynamic priority visual indicators from Immersive UI */}
      <div className="p-3 bg-rebel-950/10 border-t border-rebel-900/30 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-[9px] uppercase tracking-wider text-gray-400 font-mono">System Priority Trajectory</span>
          <span className={`text-[10px] font-mono font-bold ${priorityLabel === "CRITICAL" ? "text-rose-500" : priorityLabel === "HIGH" ? "text-rust-400" : "text-rebel-400"}`}>
            {priorityLabel}
          </span>
        </div>
        <div className="flex gap-1 h-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 rounded-sm transition-all duration-500 ${
                i < activeBarsCount ? barColorClass : "bg-gray-800/40"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
