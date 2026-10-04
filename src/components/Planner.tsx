/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { PlannerTask, GoogleCalendarEvent } from "../types";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
  X,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  CalendarCheck,
  CalendarPlus,
  Radio,
} from "lucide-react";
import { cyberAudio } from "../lib/cyberAudio";
import { useAuth } from "../contexts/AuthContext";
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "../lib/googleCalendar";

interface PlannerProps {
  plannerTasks: PlannerTask[];
  onAddTask: (task: Omit<PlannerTask, "id">) => void;
  onUpdateTask: (id: string, updates: Partial<PlannerTask>) => void;
  onDeleteTask: (id: string) => void;
  onScheduleTaskClose?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  general: "border-rebel-500/30 text-rebel-400 bg-rebel-950/10 hover:bg-rebel-950/20",
  work: "border-purple-500/30 text-purple-400 bg-purple-950/10 hover:bg-purple-950/20",
  personal: "border-pink-500/30 text-pink-400 bg-pink-950/10 hover:bg-pink-950/20",
  health: "border-emerald-500/30 text-emerald-400 bg-emerald-950/10 hover:bg-emerald-950/20",
  learning: "border-rust-500/30 text-rust-400 bg-rust-950/10 hover:bg-rust-950/20",
  creative: "border-violet-500/30 text-violet-400 bg-violet-950/10 hover:bg-violet-950/20",
};

export default function Planner({
  plannerTasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}: PlannerProps) {
  const { user, hasCalendarAccess, requestCalendarAccess } = useAuth();

  const [view, setView] = useState<"week" | "month">("week");
  const [offset, setOffset] = useState(0); // Offset in weeks or months
  const [quickTitle, setQuickTitle] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Edit / Add Task Dialog States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<PlannerTask> | null>(null);

  // Google Calendar Integration States
  const [gcalEvents, setGcalEvents] = useState<GoogleCalendarEvent[]>([]);
  const [showGcalOverlay, setShowGcalOverlay] = useState(false);
  const [isLoadingGcal, setIsLoadingGcal] = useState(false);
  const [isSyncingGcal, setIsSyncingGcal] = useState(false);
  const [gcalFeedback, setGcalFeedback] = useState<string | null>(null);

  // Confirmation Modals for Mandatory Destructive / Mutating Operations
  const [batchSyncModalOpen, setBatchSyncModalOpen] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    task: PlannerTask;
    hasGcal: boolean;
  } | null>(null);

  // Get start of the current week (Monday) with offsets
  const getWeekRange = () => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + 1 + offset * 7);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  // Get current month offset details
  const getMonthDetails = () => {
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const end = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
    return { start, end, label: targetDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }) };
  };

  const handleNext = () => setOffset((o) => o + 1);
  const handlePrev = () => setOffset((o) => o - 1);
  const handleToday = () => setOffset(0);

  // Fetch Google Calendar events if overlay is enabled
  useEffect(() => {
    if (!hasCalendarAccess || !showGcalOverlay) {
      setGcalEvents([]);
      return;
    }

    let isMounted = true;
    const fetchOverlay = async () => {
      setIsLoadingGcal(true);
      try {
        const { start, end } = view === "week" ? getWeekRange() : getMonthDetails();
        const events = await getCalendarEvents(start, end);
        if (isMounted) {
          setGcalEvents(events);
        }
      } catch (err: any) {
        console.warn("Could not load Google Calendar events overlay:", err);
      } finally {
        if (isMounted) setIsLoadingGcal(false);
      }
    };

    fetchOverlay();
    return () => {
      isMounted = false;
    };
  }, [hasCalendarAccess, showGcalOverlay, view, offset]);

  // Create Quick Task on Today
  const handleQuickAdd = () => {
    if (!quickTitle.trim()) return;
    cyberAudio.playCyberClick(1.2);
    const today = new Date().toISOString().split("T")[0];
    onAddTask({
      title: quickTitle.trim(),
      description: "Quick-scheduled action item.",
      date: today,
      startHour: 9,
      endHour: 10,
      priority: "medium",
      category: "general",
      completed: false,
    });
    setQuickTitle("");
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, id: string) => {
    cyberAudio.playCyberClick(0.9);
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dateStr: string, hour: number) => {
    e.preventDefault();
    if (!draggedTaskId) return;
    cyberAudio.playCyberClick(1.15);
    onUpdateTask(draggedTaskId, {
      date: dateStr,
      startHour: hour,
      endHour: hour + 1,
    });
    setDraggedTaskId(null);
  };

  // Open task editor modal
  const handleOpenEdit = (task: PlannerTask) => {
    cyberAudio.playCyberClick(1.0);
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleOpenCreate = (dateStr: string, hour: number) => {
    cyberAudio.playCyberClick(1.0);
    setEditingTask({
      title: "",
      description: "",
      date: dateStr,
      startHour: hour,
      endHour: hour + 1,
      priority: "medium",
      category: "general",
      completed: false,
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = () => {
    if (!editingTask || !editingTask.title?.trim()) return;
    cyberAudio.playBranchSuccess();

    if ("id" in editingTask && editingTask.id) {
      onUpdateTask(editingTask.id, editingTask);
    } else {
      onAddTask(editingTask as Omit<PlannerTask, "id">);
    }
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleDeleteRequest = () => {
    if (!editingTask || !("id" in editingTask) || !editingTask.id) return;
    const task = plannerTasks.find((t) => t.id === editingTask.id);
    if (!task) return;

    if (task.googleCalendarEventId) {
      // Destructive confirmation dialog required by workspace integration
      setDeleteConfirmModal({
        task,
        hasGcal: true,
      });
      setIsModalOpen(false);
    } else {
      cyberAudio.playCyberClick(0.85);
      onDeleteTask(task.id);
      setIsModalOpen(false);
      setEditingTask(null);
    }
  };

  // Connect Google Calendar
  const handleConnectCalendar = async () => {
    cyberAudio.playCyberClick(1.1);
    try {
      const token = await requestCalendarAccess();
      if (token) {
        cyberAudio.playBranchSuccess();
        setGcalFeedback("Google Calendar successfully connected!");
        setTimeout(() => setGcalFeedback(null), 3500);
      }
    } catch (err: any) {
      setGcalFeedback(`Authentication failed: ${err.message || "Unknown error"}`);
      setTimeout(() => setGcalFeedback(null), 4000);
    }
  };

  // Batch Sync: Sync tasks of the currently viewed week/month to Google Calendar
  const getTasksEligibleForSync = () => {
    const { start, end } = view === "week" ? getWeekRange() : getMonthDetails();
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];
    return plannerTasks.filter((t) => t.date >= startStr && t.date <= endStr);
  };

  const handleConfirmBatchSync = async () => {
    const tasks = getTasksEligibleForSync();
    if (tasks.length === 0) {
      setBatchSyncModalOpen(false);
      return;
    }

    setIsSyncingGcal(true);
    setBatchSyncModalOpen(false);
    cyberAudio.playCyberClick(1.0);

    let syncedCount = 0;
    try {
      for (const task of tasks) {
        if (task.googleCalendarEventId) {
          // Update existing
          const result = await updateCalendarEvent(task.googleCalendarEventId, task);
          onUpdateTask(task.id, {
            googleCalendarHtmlLink: result.htmlLink || task.googleCalendarHtmlLink,
            syncedAt: new Date().toISOString(),
          });
        } else {
          // Create new event
          const result = await createCalendarEvent(task);
          onUpdateTask(task.id, {
            googleCalendarEventId: result.id,
            googleCalendarHtmlLink: result.htmlLink,
            syncedAt: new Date().toISOString(),
          });
        }
        syncedCount++;
      }

      cyberAudio.playBranchSuccess();
      setGcalFeedback(`Successfully synchronized ${syncedCount} task(s) to Google Calendar!`);
      setTimeout(() => setGcalFeedback(null), 4000);
    } catch (err: any) {
      console.error("Batch sync error:", err);
      setGcalFeedback(`Google Calendar sync error: ${err.message || "Operation failed"}`);
      setTimeout(() => setGcalFeedback(null), 5000);
    } finally {
      setIsSyncingGcal(false);
    }
  };

  // Sync individual task from edit modal
  const handleSyncSingleTask = async (task: PlannerTask) => {
    setIsSyncingGcal(true);
    try {
      if (task.googleCalendarEventId) {
        const result = await updateCalendarEvent(task.googleCalendarEventId, task);
        onUpdateTask(task.id, {
          googleCalendarHtmlLink: result.htmlLink || task.googleCalendarHtmlLink,
          syncedAt: new Date().toISOString(),
        });
        setEditingTask((prev) => (prev ? { ...prev, syncedAt: new Date().toISOString() } : prev));
      } else {
        const result = await createCalendarEvent(task);
        onUpdateTask(task.id, {
          googleCalendarEventId: result.id,
          googleCalendarHtmlLink: result.htmlLink,
          syncedAt: new Date().toISOString(),
        });
        setEditingTask((prev) =>
          prev
            ? {
                ...prev,
                googleCalendarEventId: result.id,
                googleCalendarHtmlLink: result.htmlLink,
                syncedAt: new Date().toISOString(),
              }
            : prev
        );
      }
      cyberAudio.playBranchSuccess();
      setGcalFeedback(`Task synchronized with Google Calendar.`);
      setTimeout(() => setGcalFeedback(null), 3000);
    } catch (err: any) {
      console.error("Task sync error:", err);
      setGcalFeedback(`Sync failed: ${err.message}`);
      setTimeout(() => setGcalFeedback(null), 4000);
    } finally {
      setIsSyncingGcal(false);
    }
  };

  // Execute deletion with user choice regarding Google Calendar
  const handleExecuteDelete = async (deleteOnGcal: boolean) => {
    if (!deleteConfirmModal) return;
    const { task } = deleteConfirmModal;

    if (deleteOnGcal && task.googleCalendarEventId) {
      try {
        await deleteCalendarEvent(task.googleCalendarEventId);
      } catch (err) {
        console.warn("Failed to delete event from Google Calendar:", err);
      }
    }

    onDeleteTask(task.id);
    cyberAudio.playCyberClick(0.85);
    setDeleteConfirmModal(null);
    setEditingTask(null);
    setGcalFeedback(
      deleteOnGcal
        ? "Task deleted locally and removed from Google Calendar."
        : "Task deleted from atom-i planner (kept in Google Calendar)."
    );
    setTimeout(() => setGcalFeedback(null), 3500);
  };

  // Check if a calendar event falls on a specific date and hour
  const getGcalEventsForSlot = (dateStr: string, hour: number) => {
    return gcalEvents.filter((ev) => {
      if (!ev.start?.dateTime) return false;
      const evStart = new Date(ev.start.dateTime);
      const evDateStr = evStart.toISOString().split("T")[0];
      const evHour = evStart.getHours();
      return evDateStr === dateStr && evHour === hour;
    });
  };

  // Render standard Week grid columns (Monday to Sunday)
  const renderWeek = () => {
    const { start } = getWeekRange();
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 AM to 9:00 PM

    const dates = days.map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });

    return (
      <div className="flex flex-col flex-1 min-h-[350px] overflow-x-auto">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-white/5 bg-black/40 min-w-[700px]">
          {/* Hour padding column */}
          <div className="p-2 border-r border-white/5 font-mono text-[9px] text-gray-500 uppercase tracking-widest text-right">
            Time
          </div>
          {dates.map((date, i) => {
            const isToday = new Date().toDateString() === date.toDateString();
            return (
              <div
                key={i}
                className={`p-2 border-r border-white/5 text-center ${
                  isToday ? "bg-rebel-500/10 border-b-2 border-b-rebel-400" : ""
                }`}
              >
                <div
                  className={`text-[10px] uppercase font-mono tracking-wider ${
                    isToday ? "text-rebel-400 font-bold" : "text-gray-400"
                  }`}
                >
                  {days[i]}
                </div>
                <div
                  className={`text-xs font-sans mt-0.5 ${
                    isToday ? "text-white font-extrabold" : "text-gray-500"
                  }`}
                >
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scrollable Hours Matrix */}
        <div className="flex-1 min-w-[700px] overflow-y-auto max-h-[420px] custom-scrollbar">
          {hours.map((hour) => {
            const timeStr = `${hour.toString().padStart(2, "0")}:00`;
            return (
              <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-white/[0.03]">
                {/* Time labels */}
                <div className="p-2 border-r border-white/5 text-right font-mono text-[10px] text-gray-500 pr-3 flex items-center justify-end">
                  {timeStr}
                </div>

                {/* Day columns */}
                {dates.map((date, i) => {
                  const dateStr = date.toISOString().split("T")[0];
                  const slotTasks = plannerTasks.filter(
                    (t) => t.date === dateStr && t.startHour === hour
                  );
                  const slotGcalEvents = showGcalOverlay ? getGcalEventsForSlot(dateStr, hour) : [];

                  return (
                    <div
                      key={i}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, dateStr, hour)}
                      onClick={() => handleOpenCreate(dateStr, hour)}
                      className="min-h-[46px] border-r border-white/[0.03] p-1 relative hover:bg-rebel-500/[0.02] transition-all cursor-crosshair group flex flex-col gap-1"
                    >
                      {/* External Google Calendar Overlay Events */}
                      {slotGcalEvents.map((ev) => (
                        <div
                          key={`gcal-${ev.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (ev.htmlLink) {
                              window.open(ev.htmlLink, "_blank", "noopener,noreferrer");
                            }
                          }}
                          className="p-1 rounded bg-rust-500/10 border border-rust-500/30 text-rust-300 text-[9px] font-mono leading-tight flex items-center gap-1 cursor-pointer hover:bg-rust-500/20 truncate"
                          title={`Google Calendar: ${ev.summary || "Busy"}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-rust-400 shrink-0" />
                          <span className="font-semibold shrink-0">[G-CAL]</span>
                          <span className="truncate">{ev.summary || "Busy"}</span>
                        </div>
                      ))}

                      {/* Atom-i Planner Tasks */}
                      {slotTasks.map((task) => {
                        const styleClass = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.general;
                        return (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(task);
                            }}
                            className={`p-1.5 rounded-lg border text-[10px] leading-tight font-sans cursor-grab active:cursor-grabbing shadow-sm transition-all truncate select-none ${styleClass} ${
                              task.completed ? "opacity-35 line-through" : ""
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1 truncate">
                                <span className="font-mono text-[8px] opacity-75">{task.startHour}:00</span>
                                <span className="font-medium truncate">{task.title}</span>
                              </div>
                              {task.googleCalendarEventId && (
                                <span
                                  className="w-2 h-2 rounded-full bg-rebel-400 shrink-0 shadow-sm shadow-rebel-400"
                                  title="Synced with Google Calendar"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Month Matrix View
  const renderMonth = () => {
    const { start } = getMonthDetails();
    const year = start.getFullYear();
    const month = start.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const daysList = [];
    for (let i = 0; i < startOffset; i++) {
      daysList.push(null);
    }
    for (let day = 1; day <= lastDay.getDate(); day++) {
      daysList.push(new Date(year, month, day));
    }

    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return (
      <div className="flex flex-col flex-1">
        <div className="grid grid-cols-7 border-b border-white/5 bg-black/40 text-center font-mono text-[10px] text-gray-400 uppercase py-2">
          {dayNames.map((name) => (
            <div key={name} className="tracking-wider">
              {name}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 mt-1.5">
          {daysList.map((date, idx) => {
            if (!date)
              return (
                <div
                  key={`empty-${idx}`}
                  className="p-2 min-h-[75px] opacity-20 bg-white/[0.01] rounded-lg border border-transparent"
                />
              );

            const dateStr = date.toISOString().split("T")[0];
            const isToday = new Date().toDateString() === date.toDateString();
            const dayTasks = plannerTasks.filter((t) => t.date === dateStr);

            return (
              <div
                key={dateStr}
                onClick={() => handleOpenCreate(dateStr, 9)}
                className={`p-2 min-h-[75px] border rounded-lg hover:border-rebel-400/30 hover:bg-rebel-500/[0.01] cursor-pointer transition-all ${
                  isToday
                    ? "border-rebel-500/30 bg-rebel-950/10 shadow-md shadow-rebel-500/5"
                    : "border-white/5 bg-white/[0.01]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono ${isToday ? "text-rebel-400 font-bold" : "text-gray-400"}`}>
                    {date.getDate()}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rebel-400 animate-pulse" />
                  )}
                </div>

                <div className="mt-1.5 flex flex-col gap-1 overflow-hidden">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(task);
                      }}
                      className="px-1 py-0.5 rounded border border-rebel-500/25 bg-rebel-500/5 text-[9px] text-rebel-300 font-sans truncate hover:bg-rebel-500/15 flex items-center justify-between gap-1"
                    >
                      <span className="truncate">{task.title}</span>
                      {task.googleCalendarEventId && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rebel-400 shrink-0" />
                      )}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-[8px] font-mono text-gray-500 text-center">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getHeaderDateLabel = () => {
    if (view === "month") {
      return getMonthDetails().label;
    }
    const { start, end } = getWeekRange();
    const opts = { month: "short", day: "numeric" } as const;
    return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
  };

  const eligibleTasks = getTasksEligibleForSync();
  const unsyncedCount = eligibleTasks.filter((t) => !t.googleCalendarEventId).length;

  return (
    <div className="flex flex-col border border-rebel-900/40 bg-black/50 rounded-xl backdrop-blur-sm overflow-hidden p-4 shadow-lg shadow-black/60 tactical-corner-frame hover-focus-border">
      {/* Planner Header Control Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 pb-3 border-b border-rebel-900/30 mb-3 hover-focus-trace">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-rebel-400" />
          <h2 className="font-sans font-bold text-xs tracking-widest text-white uppercase">
            Tactical Chrono Matrix
          </h2>
        </div>

        {/* Google Calendar Controls */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
          {!hasCalendarAccess ? (
            <button
              onClick={handleConnectCalendar}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600/20 to-rebel-500/20 hover:from-blue-600/30 hover:to-rebel-500/30 border border-blue-500/40 text-blue-300 font-mono text-xs flex items-center gap-2 transition-all shadow-sm"
              title="Connect your Google Calendar to sync tasks and prevent scheduling conflicts"
            >
              {/* Official Google 'G' icon */}
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.15C3.26 21.36 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.28C.46 8.23 0 10.06 0 12s.46 3.77 1.28 5.39l3.99-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.28 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
                />
              </svg>
              <span>Connect Google Calendar</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Live Status indicator */}
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-mono text-[10px]"
                title="Google Calendar API connected and ready"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">G-CAL ACTIVE</span>
              </div>

              {/* Toggle Google Calendar overlay */}
              <button
                onClick={() => {
                  cyberAudio.playCyberClick(1.0);
                  setShowGcalOverlay(!showGcalOverlay);
                }}
                className={`px-2.5 py-1.5 rounded-lg border font-mono text-[10px] flex items-center gap-1.5 transition-all ${
                  showGcalOverlay
                    ? "bg-rust-500/20 border-rust-500/40 text-rust-300"
                    : "bg-black/50 border-white/10 text-gray-400 hover:text-white"
                }`}
                title="Overlay your real Google Calendar events directly into this week's grid"
              >
                <Radio className={`w-3 h-3 ${showGcalOverlay ? "text-rust-400 animate-pulse" : ""}`} />
                <span>{showGcalOverlay ? "Hide G-Cal Overlay" : "Show G-Cal Overlay"}</span>
                {isLoadingGcal && <RefreshCw className="w-2.5 h-2.5 animate-spin text-rust-400 ml-1" />}
              </button>

              {/* Sync Button */}
              <button
                onClick={() => {
                  cyberAudio.playCyberClick(1.1);
                  setBatchSyncModalOpen(true);
                }}
                disabled={isSyncingGcal || eligibleTasks.length === 0}
                className="px-3 py-1.5 rounded-lg bg-rebel-500/20 hover:bg-rebel-500/30 border border-rebel-400/50 text-rebel-300 font-mono text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                title="Sync all planned tasks to your Google Calendar"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-rebel-400" />
                <span>SYNC TO G-CAL</span>
                {unsyncedCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rebel-400 text-black font-bold text-[9px]">
                    {unsyncedCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Navigation & View controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-black/50 border border-rebel-900/30 rounded-lg p-0.5 font-mono text-xs">
              <button
                onClick={handlePrev}
                className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-gray-300 min-w-[95px] text-center font-mono text-[11px] font-semibold">
                {getHeaderDateLabel()}
              </span>
              <button
                onClick={handleNext}
                className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleToday}
              className="px-2.5 py-1.5 rounded-lg border border-rebel-400/20 bg-black/60 hover:bg-rebel-500/10 text-rebel-400 font-mono text-[10px] transition-all"
            >
              TODAY
            </button>

            <div className="flex p-0.5 rounded-lg bg-black/50 border border-white/5">
              <button
                onClick={() => {
                  setView("week");
                  setOffset(0);
                }}
                className={`px-2 py-1 rounded text-[10px] font-mono transition-all uppercase ${
                  view === "week" ? "bg-rebel-400/10 text-rebel-400 font-bold" : "text-gray-500"
                }`}
              >
                Week
              </button>
              <button
                onClick={() => {
                  setView("month");
                  setOffset(0);
                }}
                className={`px-2 py-1 rounded text-[10px] font-mono transition-all uppercase ${
                  view === "month" ? "bg-rebel-400/10 text-rebel-400 font-bold" : "text-gray-500"
                }`}
              >
                Month
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Status Banner */}
      {gcalFeedback && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-rebel-950/60 border border-rebel-500/40 text-rebel-300 text-xs font-mono flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-rebel-400 shrink-0" />
            <span>{gcalFeedback}</span>
          </div>
          <button onClick={() => setGcalFeedback(null)} className="text-gray-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quick Add Bar */}
      <div className="flex gap-2 mb-3 bg-white/[0.01] border border-white/5 p-2 rounded-xl">
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Enter quick task title to schedule for today..."
          onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
          className="flex-1 bg-black/20 border border-white/5 focus:border-rebel-400/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 outline-none"
        />
        <button
          onClick={handleQuickAdd}
          className="px-3 py-1.5 rounded-lg bg-rebel-400/10 hover:bg-rebel-400/20 border border-rebel-400/20 text-rebel-400 font-mono text-xs flex items-center gap-1 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> ADD
        </button>
      </div>

      {/* Main Grid View */}
      {view === "week" ? renderWeek() : renderMonth()}

      {/* TASK ADD/EDIT MODAL */}
      {isModalOpen && editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-md border border-rebel-500/20 bg-[#0B0B0F] p-5 rounded-2xl shadow-xl shadow-black/50 space-y-4 font-sans">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between pr-8">
              <h3 className="font-sans font-bold text-xs tracking-widest text-rebel-400 uppercase flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />{" "}
                {"id" in editingTask ? "Configure Scheduled Task" : "Schedule Atomic Task"}
              </h3>

              {editingTask.googleCalendarEventId && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rebel-950/60 border border-rebel-500/30 text-rebel-300 font-mono text-[9px]">
                  <CheckCircle2 className="w-3 h-3 text-rebel-400" />
                  <span>SYNCED TO G-CAL</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={editingTask.title || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  placeholder="e.g., Code the API layer"
                  className="w-full bg-black/40 border border-white/5 focus:border-rebel-400/40 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">
                  Description
                </label>
                <textarea
                  value={editingTask.description || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  placeholder="Task specifications, instructions..."
                  rows={2}
                  className="w-full bg-black/40 border border-white/5 focus:border-rebel-400/40 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">
                    Date Target
                  </label>
                  <input
                    type="date"
                    value={editingTask.date || ""}
                    onChange={(e) => setEditingTask({ ...editingTask, date: e.target.value })}
                    className="w-full bg-black/40 border border-white/5 focus:border-rebel-400/40 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">
                    Start Hour
                  </label>
                  <select
                    value={editingTask.startHour !== undefined ? editingTask.startHour : 9}
                    onChange={(e) => {
                      const h = parseInt(e.target.value);
                      setEditingTask({ ...editingTask, startHour: h, endHour: h + 1 });
                    }}
                    className="w-full bg-black/40 border border-white/5 focus:border-rebel-400/40 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                  >
                    {Array.from({ length: 15 }, (_, i) => i + 8).map((h) => (
                      <option key={h} value={h} className="bg-[#0B0B0F]">
                        {h.toString().padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">
                    Sector
                  </label>
                  <select
                    value={editingTask.category || "general"}
                    onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value as any })}
                    className="w-full bg-black/40 border border-white/5 focus:border-rebel-400/40 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="general" className="bg-[#0B0B0F]">General</option>
                    <option value="work" className="bg-[#0B0B0F]">Work</option>
                    <option value="personal" className="bg-[#0B0B0F]">Personal</option>
                    <option value="health" className="bg-[#0B0B0F]">Health</option>
                    <option value="learning" className="bg-[#0B0B0F]">Learning</option>
                    <option value="creative" className="bg-[#0B0B0F]">Creative</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">
                    Priority
                  </label>
                  <select
                    value={editingTask.priority || "medium"}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as any })}
                    className="w-full bg-black/40 border border-white/5 focus:border-rebel-400/40 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="low" className="bg-[#0B0B0F]">Low</option>
                    <option value="medium" className="bg-[#0B0B0F]">Medium</option>
                    <option value="high" className="bg-[#0B0B0F]">High</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="modal-completed"
                  checked={editingTask.completed || false}
                  onChange={(e) => setEditingTask({ ...editingTask, completed: e.target.checked })}
                  className="w-3.5 h-3.5 accent-rebel-400"
                />
                <label
                  htmlFor="modal-completed"
                  className="text-xs text-gray-300 font-sans cursor-pointer select-none"
                >
                  Mark complete in logs
                </label>
              </div>

              {/* Google Calendar sync actions for individual task */}
              {hasCalendarAccess && "id" in editingTask && editingTask.id && (
                <div className="pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-rebel-400" />
                      Google Calendar Integration
                    </span>
                    {editingTask.googleCalendarHtmlLink && (
                      <a
                        href={editingTask.googleCalendarHtmlLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono text-rebel-400 hover:underline flex items-center gap-1"
                      >
                        View in G-Cal <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSyncSingleTask(editingTask as PlannerTask)}
                    disabled={isSyncingGcal}
                    className="mt-2 w-full py-1.5 rounded-lg border border-rebel-500/30 bg-rebel-950/30 hover:bg-rebel-950/50 text-rebel-300 font-mono text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {isSyncingGcal ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-rebel-400" />
                    ) : (
                      <CalendarPlus className="w-3.5 h-3.5 text-rebel-400" />
                    )}
                    <span>
                      {editingTask.googleCalendarEventId
                        ? "Update Event on Google Calendar"
                        : "Push to Google Calendar"}
                    </span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveModal}
                className="flex-1 py-2 rounded-xl bg-gradient-to-br from-rebel-500 to-purple-600 hover:from-rebel-400 hover:to-purple-500 text-white font-sans text-xs font-semibold shadow-md shadow-rebel-500/10 transition-all duration-300"
              >
                SAVE TARGET
              </button>
              {"id" in editingTask && editingTask.id && (
                <button
                  onClick={handleDeleteRequest}
                  className="p-2 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-all"
                  title="Delete scheduled task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY USER CONFIRMATION DIALOG: BATCH SYNC TO GOOGLE CALENDAR */}
      {batchSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in font-mono">
          <div className="relative w-full max-w-lg border border-rebel-500/40 bg-[#060810] p-6 rounded-2xl shadow-2xl shadow-rebel-950/50 space-y-4">
            <button
              onClick={() => setBatchSyncModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 text-rebel-400">
              <CalendarCheck className="w-5 h-5 text-rebel-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Confirm Google Calendar Synchronization
              </h3>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed font-sans">
              This will create or update <strong className="text-rebel-400">{eligibleTasks.length} event(s)</strong>{" "}
              on your primary Google Calendar, setting reminders and tagging focus blocks directly into your schedule:
            </p>

            <div className="max-h-48 overflow-y-auto space-y-1.5 p-3 rounded-lg bg-black/50 border border-white/5 custom-scrollbar text-xs">
              {eligibleTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-1.5 rounded bg-white/[0.02]">
                  <div className="truncate mr-2">
                    <span className="font-mono text-rebel-400 font-semibold">{t.date}</span>
                    <span className="text-gray-400 font-mono ml-1.5">{t.startHour}:00</span>
                    <span className="text-gray-200 ml-2 font-sans font-medium">{t.title}</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-white/10 text-gray-400 shrink-0">
                    {t.category}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setBatchSyncModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-gray-400 font-sans font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBatchSync}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rebel-500 to-blue-600 hover:from-rebel-400 hover:to-blue-500 text-black font-mono text-xs font-bold uppercase tracking-wider shadow-md shadow-rebel-500/20 transition-all"
              >
                Proceed & Sync
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY USER CONFIRMATION DIALOG: DESTRUCTIVE GOOGLE CALENDAR DELETION */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in font-mono">
          <div className="relative w-full max-w-md border border-rose-500/40 bg-[#080812] p-6 rounded-2xl shadow-2xl shadow-rose-950/50 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Delete Google Calendar Event?
              </h3>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed font-sans">
              Task <strong className="text-white">"{deleteConfirmModal.task.title}"</strong> is currently synchronized with your Google Calendar.
            </p>

            <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20 text-xs text-rose-300 font-sans">
              Would you like to delete it from both atom-i and your Google Calendar, or remove it from atom-i only?
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => handleExecuteDelete(true)}
                className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-md shadow-rose-900/40"
              >
                Delete from Both (G-Cal & Local)
              </button>
              <button
                onClick={() => handleExecuteDelete(false)}
                className="w-full py-2 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 font-mono text-xs transition-colors"
              >
                Remove from Atom-i Only (Keep on G-Cal)
              </button>
              <button
                onClick={() => setDeleteConfirmModal(null)}
                className="w-full py-1.5 text-gray-500 hover:text-white font-mono text-xs transition-colors text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
