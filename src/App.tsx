/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Goal, Phase, Task, Atom, PlannerTask, ChatMessage } from "./types";
import { DEFAULT_GOAL } from "./defaultGoal";
import ParticleBackground from "./components/ParticleBackground";
import TaskMap from "./components/TaskMap";
import EisenhowerMatrix from "./components/EisenhowerMatrix";
import AICoach from "./components/AICoach";
import Planner from "./components/Planner";
import { LiveVoiceCoach } from "./components/LiveVoiceCoach";
import LandingPage from "./components/LandingPage";
import PaywallModal from "./components/PaywallModal";
import TermsModal, { LegalTab } from "./components/TermsModal";
import { FounderPerksModal } from "./components/FounderPerksModal";
import { PromoCodeModal } from "./components/PromoCodeModal";
import { AmbienceFocusModal } from "./components/AmbienceFocusModal";
import { cyberAudio } from "./lib/cyberAudio";
import { useAuth } from "./contexts/AuthContext";
import { useFirestorePersistence } from "./hooks/useFirestorePersistence";
import { isPuterAvailable, queryPuterChat, decomposeGoalWithPuter } from "./lib/puterAI";
import { hasStaleOwnerSession } from "./lib/sessionHardening";
import {
  Sparkles,
  Cpu,
  Target,
  Terminal,
  Activity,
  AlertCircle,
  Clock,
  Briefcase,
  Layers,
  Wrench,
  CheckCircle,
  TrendingUp,
  X,
  Play,
  Share2,
  Radio,
  LogIn,
  LogOut,
  User,
  Database,
  Cloud,
  Check,
  Shield,
  Lock,
  Layout,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Download,
  Award,
  KeyRound,
  Gift,
  Waves,
} from "lucide-react";
import { useCyberAudio } from "./hooks/useCyberAudio";
import { useOfflineSync } from "./hooks/useOfflineSync";
import { PWAInstallButton } from "./components/PWAInstallButton";

/** Fresh coach transcript for a new / logged-out visit. */
const buildWelcomeMessages = (): ChatMessage[] => [
  {
    id: "welcome",
    sender: "coach",
    text: `[ESTABLISHING SECURE PROTOCOL]
A.T.O.M. (Autonomous Tactical Optimization Mentor) ONLINE.
I have parsed your strategy deck. Double-click any node inside the central particle mindmap to mark it complete, or chat with me to optimize your action items.`,
    timestamp: new Date().toLocaleTimeString(),
  },
];

export default function App() {
  // --- CYBER AUDIO & OFFLINE RESILIENCE ---
  const {
    isAudioEnabled,
    toggleSound,
    playClick,
    playNodeSelect,
    playTaskToggle,
    playDrawer,
    playBranchSuccess,
    playGoalComplete,
  } = useCyberAudio();

  const { isOnline, pendingCount, isSyncing, syncQueue } = useOfflineSync((syncedCount) => {
    playBranchSuccess();
  });

  // --- CORE STATE ---
  const [viewMode, setViewMode] = useState<"cockpit" | "landing">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("view") === "cockpit" || params.get("mode") === "cockpit") {
        return "cockpit";
      }
    }
    return "landing";
  });
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const p = window.location.pathname.toLowerCase();
      const s = window.location.search.toLowerCase();
      return (
        p === "/terms" ||
        p === "/privacy" ||
        p === "/refunds" ||
        p === "/returns" ||
        p === "/support" ||
        p === "/contact" ||
        s.includes("terms") ||
        s.includes("privacy") ||
        s.includes("refund") ||
        s.includes("support") ||
        s.includes("contact")
      );
    }
    return false;
  });
  const [termsTab, setTermsTab] = useState<LegalTab>(() => {
    if (typeof window !== "undefined") {
      const p = window.location.pathname.toLowerCase();
      const s = window.location.search.toLowerCase();
      if (p === "/privacy" || s.includes("privacy")) return "privacy";
      if (p === "/refunds" || p === "/returns" || s.includes("refund") || s.includes("return")) return "refunds";
      if (p === "/support" || p === "/contact" || s.includes("support") || s.includes("contact")) return "support";
    }
    return "terms";
  });

  const handleOpenTerms = (tab?: LegalTab) => {
    setTermsTab(tab || "terms");
    setShowTermsModal(true);
  };

  const [goal, setGoal] = useState<Goal>(() => {
    const saved = localStorage.getItem("goal_atomizer_data");
    return saved ? JSON.parse(saved) : DEFAULT_GOAL;
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string>("root");
  const [selectedNode, setSelectedNode] = useState<{
    type: "goal" | "phase" | "task";
    item: Goal | Phase | Task;
  } | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("goal_atomizer_chat");
    return saved ? JSON.parse(saved) : buildWelcomeMessages();
  });

  const [plannerTasks, setPlannerTasks] = useState<PlannerTask[]>(() => {
    const saved = localStorage.getItem("goal_atomizer_planner");
    if (saved) return JSON.parse(saved);

    // Default demo planner items
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    return [
      {
        id: "demo-task-1",
        title: "Initialize Workspace & Compilers",
        description: "Set up the default SaaS package.",
        date: today,
        startHour: 10,
        endHour: 11,
        priority: "high",
        category: "work",
        completed: true,
        sourceTaskId: "task-1-setup-monorepo",
      },
      {
        id: "demo-task-2",
        title: "Configure Express Gateway Proxy",
        description: "Establish Express proxy.",
        date: tomorrow,
        startHour: 14,
        endHour: 15,
        priority: "high",
        category: "work",
        completed: false,
        sourceTaskId: "task-2-oauth-gateway",
      },
    ];
  });

  const [isCoachTyping, setIsCoachTyping] = useState(false);
  const [isAtomizing, setIsAtomizing] = useState(false);
  const [atomizeError, setAtomizeError] = useState<string | null>(null);
  const [showAtomizeModal, setShowAtomizeModal] = useState(false);
  const [showLiveVoiceModal, setShowLiveVoiceModal] = useState(false);
  const [showFounderPerksModal, setShowFounderPerksModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showAmbienceModal, setShowAmbienceModal] = useState(false);
  const [isAmbienceActive, setIsAmbienceActive] = useState<boolean>(() => {
    return cyberAudio.getAmbienceState().isPlaying;
  });

  const handleToggleAmbience = () => {
    const newState = cyberAudio.toggleAmbience();
    setIsAmbienceActive(newState);
  };

  // Authentication and Firestore Persistence (Connected to atom-i)
  const {
    user,
    loading: authLoading,
    signInWithGoogle,
    requestCalendarAccess,
    hasCalendarAccess,
    signOut,
    error: authError,
  } = useAuth();
  const {
    syncStatus,
    userGoalsList,
    userProfile,
    successStories,
    effectiveUid,
    activePersonaId,
    setActivePersonaId,
    updateTier,
    addVoiceMinutes,
    setPreferredEngine,
    saveGoalToFirestore,
    savePlannerTaskToFirestore,
    deletePlannerTaskFromFirestore,
    loadGoalFromFirestore,
    redeemPromoCode,
    claimFounderMerch,
  } = useFirestorePersistence(goal, setGoal, setPlannerTasks);

  // Logged-out hardening: if a stale owner session was wiped (see
  // useFirestorePersistence), reset the coach transcript to the fresh
  // welcome state instead of showing the previous session's conversation.
  useEffect(() => {
    if (authLoading || user) return;
    if (!hasStaleOwnerSession()) return;
    setMessages(buildWelcomeMessages());
  }, [authLoading, user]);

  // Auto-detect promo code in URL query string or auto-elevate owner email
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const promoFromUrl = urlParams.get("code") || urlParams.get("promo");
    if (promoFromUrl) {
      redeemPromoCode(promoFromUrl).then((res) => {
        if (res.success) {
          playBranchSuccess();
        }
      });
    } else if (
      user?.email === "faux.fuax@gmail.com" &&
      (!userProfile.isCreator || userProfile.founderNumber !== 0 || userProfile.tier !== "founder_lifetime")
    ) {
      // Auto-grant full master creator access ONLY for app owner (faux.fuax@gmail.com)
      redeemPromoCode("FAUX-VIP");
    }

    // Direct link to view 3D holographic badge & freebie perks
    if (urlParams.get("perks") === "true" || urlParams.get("founder") === "true") {
      setShowFounderPerksModal(true);
    }
  }, [user, userProfile.tier, redeemPromoCode, playBranchSuccess]);

  // Auto-save active goal to Firestore whenever goal state changes and user is signed in
  useEffect(() => {
    if (user && goal.id) {
      const timer = setTimeout(() => {
        saveGoalToFirestore(goal);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [goal, user, saveGoalToFirestore]);

  // New Goal Input State
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDesc, setNewGoalDesc] = useState("");

  // Simulated live telemetry clock
  const [systemTime, setSystemTime] = useState("");
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setSystemTime(now.toUTCString().replace("GMT", "UTC"));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem("goal_atomizer_data", JSON.stringify(goal));
  }, [goal]);

  useEffect(() => {
    localStorage.setItem("goal_atomizer_chat", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("goal_atomizer_planner", JSON.stringify(plannerTasks));
  }, [plannerTasks]);

  // Synchronize dynamic selected node object details when goal details evolve
  useEffect(() => {
    if (selectedNodeId === "root") {
      setSelectedNode({ type: "goal", item: goal });
      return;
    }

    // Find Phase
    const phase = goal.phases.find((p) => p.id === selectedNodeId);
    if (phase) {
      setSelectedNode({ type: "phase", item: phase });
      return;
    }

    // Find Task
    for (const p of goal.phases) {
      const task = p.tasks.find((t) => t.id === selectedNodeId);
      if (task) {
        setSelectedNode({ type: "task", item: task });
        return;
      }
    }

    // Default back to root if ID is somehow orphaned
    setSelectedNode({ type: "goal", item: goal });
    setSelectedNodeId("root");
  }, [selectedNodeId, goal]);

  // --- RE-CALCULATE PROGRESS METER ---
  const recalculateGoalProgress = (currentGoal: Goal): Goal => {
    const totalTasks = currentGoal.phases.reduce((sum, p) => sum + p.tasks.length, 0);
    if (totalTasks === 0) return { ...currentGoal, progress: 0, completed: false };

    const completedTasks = currentGoal.phases.reduce(
      (sum, p) => sum + p.tasks.filter((t) => t.completed).length,
      0
    );

    const progress = Math.round((completedTasks / totalTasks) * 100);

    // Update phase completion states too
    const updatedPhases = currentGoal.phases.map((p) => {
      const pCompleted = p.tasks.length > 0 && p.tasks.every((t) => t.completed);
      return { ...p, completed: pCompleted };
    });

    const goalCompleted = progress === 100;

    return {
      ...currentGoal,
      phases: updatedPhases,
      progress,
      completed: goalCompleted,
    };
  };

  // --- ACTIONS ---

  // Handle task selection from components
  const handleSelectNode = (id: string, type: "goal" | "phase" | "task") => {
    playNodeSelect();
    setSelectedNodeId(id);
  };

  // Toggle completion status of any item
  const handleToggleComplete = (id: string, type: "goal" | "phase" | "task") => {
    if (type === "goal") {
      setGoal((g) => {
        const nextState = !g.completed;
        if (nextState) {
          playGoalComplete();
        } else {
          playTaskToggle(false);
        }
        const updatedPhases = g.phases.map((p) => ({
          ...p,
          completed: nextState,
          tasks: p.tasks.map((t) => ({
            ...t,
            completed: nextState,
            atoms: t.atoms?.map((a) => ({ ...a, completed: nextState })),
          })),
        }));
        return recalculateGoalProgress({ ...g, phases: updatedPhases });
      });
      return;
    }

    if (type === "phase") {
      setGoal((g) => {
        const phase = g.phases.find((p) => p.id === id);
        if (!phase) return g;
        const nextState = !phase.completed;

        if (nextState) {
          playBranchSuccess();
        } else {
          playTaskToggle(false);
        }

        const updatedPhases = g.phases.map((p) => {
          if (p.id !== id) return p;
          return {
            ...p,
            completed: nextState,
            tasks: p.tasks.map((t) => ({
              ...t,
              completed: nextState,
              atoms: t.atoms?.map((a) => ({ ...a, completed: nextState })),
            })),
          };
        });
        const recalculated = recalculateGoalProgress({ ...g, phases: updatedPhases });
        if (recalculated.completed && nextState) {
          playGoalComplete();
        }
        return recalculated;
      });
      return;
    }

    if (type === "task") {
      setGoal((g) => {
        let taskToggledTo = false;
        const updatedPhases = g.phases.map((p) => {
          const task = p.tasks.find((t) => t.id === id);
          if (!task) return p;
          const nextState = !task.completed;
          taskToggledTo = nextState;

          return {
            ...p,
            tasks: p.tasks.map((t) => {
              if (t.id !== id) return t;
              return {
                ...t,
                completed: nextState,
                atoms: t.atoms?.map((a) => ({ ...a, completed: nextState })),
              };
            }),
          };
        });

        playTaskToggle(taskToggledTo);

        // Sync with planner tasks
        setPlannerTasks((pts) =>
          pts.map((pt) => {
            if (pt.sourceTaskId === id) {
              const matchingTask = updatedPhases
                .flatMap((p) => p.tasks)
                .find((t) => t.id === id);
              return { ...pt, completed: matchingTask?.completed || false };
            }
            return pt;
          })
        );

        const recalculated = recalculateGoalProgress({ ...g, phases: updatedPhases });
        // Check if branch was completed with this toggle
        const parentPhase = recalculated.phases.find((p) => p.tasks.some((t) => t.id === id));
        if (taskToggledTo && parentPhase?.completed) {
          if (recalculated.completed) {
            playGoalComplete();
          } else {
            playBranchSuccess();
          }
        }
        return recalculated;
      });
    }
  };

  // Toggle sub-micro action atom checklist
  const handleToggleAtom = (taskId: string, atomId: string) => {
    playClick();
    setGoal((g) => {
      const updatedPhases = g.phases.map((p) => {
        const task = p.tasks.find((t) => t.id === taskId);
        if (!task) return p;

        return {
          ...p,
          tasks: p.tasks.map((t) => {
            if (t.id !== taskId) return t;
            const updatedAtoms = t.atoms?.map((a) =>
              a.id === atomId ? { ...a, completed: !a.completed } : a
            );
            const allCompleted = updatedAtoms?.every((a) => a.completed) || false;
            return { ...t, atoms: updatedAtoms, completed: allCompleted };
          }),
        };
      });

      // Sync with planner tasks if task completion changed
      const currentTaskState = updatedPhases
        .flatMap((p) => p.tasks)
        .find((t) => t.id === taskId);
      if (currentTaskState) {
        setPlannerTasks((pts) =>
          pts.map((pt) => {
            if (pt.sourceTaskId === taskId) {
              return { ...pt, completed: currentTaskState.completed };
            }
            return pt;
          })
        );
      }

      return recalculateGoalProgress({ ...g, phases: updatedPhases });
    });
  };

  // Add decomposed task into Weekly planner
  const handleScheduleTask = (task: Task) => {
    const today = new Date().toISOString().split("T")[0];
    const exists = plannerTasks.some((pt) => pt.sourceTaskId === task.id);

    if (exists) {
      alert(`[OPERATION RESTRICTED] Task "${task.title}" is already scheduled in the optimization deck.`);
      return;
    }

    const newPT: PlannerTask = {
      id: `pt-${Date.now()}`,
      title: task.title,
      description: task.description,
      date: today,
      startHour: 9,
      endHour: 10,
      priority: task.priority === "Critical" || task.priority === "High" ? "high" : "medium",
      category: "general",
      completed: task.completed,
      sourceTaskId: task.id,
    };

    setPlannerTasks((pts) => [...pts, newPT]);
    alert(`[SYSTEM CONFIRMATION] "${task.title}" successfully loaded into the Weekly Optimization Schedule.`);
  };

  // Submit chat queries to ATOM AI Coach
  const handleSendCoachMessage = async (text: string, overrideNode?: any) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsCoachTyping(true);

    const activeNode = overrideNode || (selectedNode ? {
      type: selectedNode.type,
      title: selectedNode.item.title,
      description: selectedNode.item.description,
      completed: selectedNode.item.completed,
    } : null);

    const contextSummary = `Goal: ${goal.title}. Progress: ${goal.progress}%. Active node: ${
      activeNode ? `${activeNode.type}: ${activeNode.title}` : "General"
    }.`;

    // 1. If preferred engine is Puter.ai or if Puter is active, try Puter.ai first ($0 server cost)
    if (userProfile.preferredEngine === "puter" && isPuterAvailable()) {
      try {
        const puterText = await queryPuterChat(text, contextSummary);
        const coachMsg: ChatMessage = {
          id: `coach-${Date.now()}`,
          sender: "coach",
          text: puterText,
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, coachMsg]);
        setIsCoachTyping(false);
        return;
      } catch (puterErr) {
        console.warn("Puter.ai chat failed, falling back to server API...", puterErr);
      }
    }

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          selectedNode: activeNode,
          messages: updatedMessages,
          newMessage: text,
        }),
      });

      if (!response.ok) {
        throw new Error("Direct AI communication stream disconnected.");
      }

      const data = await response.json();
      const coachMsg: ChatMessage = {
        id: `coach-${Date.now()}`,
        sender: "coach",
        text: data.text,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, coachMsg]);
    } catch (e: any) {
      console.warn("Coach server API error, trying Puter.ai client-side fallback:", e);

      if (isPuterAvailable()) {
        try {
          const puterText = await queryPuterChat(text, contextSummary);
          const coachMsg: ChatMessage = {
            id: `coach-${Date.now()}`,
            sender: "coach",
            text: puterText,
            timestamp: new Date().toLocaleTimeString(),
          };
          setMessages((prev) => [...prev, coachMsg]);
          setIsCoachTyping(false);
          return;
        } catch (puterErr2) {
          console.warn("Puter fallback also failed:", puterErr2);
        }
      }

      // Cyberpunk automatic local fallback
      const fallbacks = [
        `[COMMUNICATION INTERRUPTED] Reconnecting tactical neural stream. Operative priority should focus on completing: "${
          goal.phases.find((p) => !p.completed)?.tasks.find((t) => !t.completed)?.title || "your active backlog"
        }".`,
        `Analyzing goal trajectory... Advancing at ${goal.progress}% synchronization. Optimize next sub-components to unlock momentum.`,
        `Recommendation: Utilize focused 90-minute Pomodoro sprints. Tackle high-priority Eisenhower items listed in Q1 (Do First).`,
      ];
      const selectedFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];

      const coachMsg: ChatMessage = {
        id: `coach-${Date.now()}`,
        sender: "coach",
        text: `${selectedFallback}\n\n[TACTICAL NOTICE] Neural Core active. Real-time tactical mentorship synchronized.`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, coachMsg]);
    } finally {
      setIsCoachTyping(false);
    }
  };

  // Dedicated action to consult ATOM specifically on an atomic task without resetting goal
  const handleConsultTask = (task: Task) => {
    const prompt = `Give me tactical guidance and execution steps for the task: "${task.title}". Context: ${task.description || "Atomic task in goal"}. How should I execute this efficiently?`;
    handleSendCoachMessage(prompt, {
      type: "task",
      title: task.title,
      description: task.description,
      completed: task.completed,
    });
  };

  // Helper to format AI decomposition JSON into front-end Goal schema
  const formatDecompositionGoal = (data: any, title: string, desc: string): Goal => {
    return {
      id: `goal-${Date.now()}`,
      title: title.trim(),
      description: data.overview || desc.trim() || `Atomized roadmap for ${title}`,
      timeline: data.timeline || "6 weeks",
      insight: data.insight || "Focus on granular micro-actions to maintain momentum.",
      encouragement: data.encouragement || "Execute with discipline.",
      resources: data.resources || [],
      completed: false,
      progress: 0,
      phases: (data.phases || []).map((p: any, pIdx: number) => ({
        id: `phase-${pIdx}-${Date.now()}`,
        title: p.title,
        description: p.description,
        duration: p.duration,
        priority: p.priority || "Medium",
        milestones: p.milestones || [],
        completed: false,
        tasks: (p.tasks || []).map((t: any, tIdx: number) => ({
          id: `task-${pIdx}-${tIdx}-${Date.now()}`,
          title: t.title,
          description: t.description,
          duration: t.duration,
          priority: t.priority || "Medium",
          completed: false,
          tools: t.tools || [],
          deliverable: t.deliverable || "",
          urgency: t.urgency || "Not Urgent",
          importance: t.importance || "Important",
          atoms: (t.atoms || []).map((a: any, aIdx: number) => ({
            id: `atom-${pIdx}-${tIdx}-${aIdx}-${Date.now()}`,
            title: a.title,
            description: a.description,
            completed: false,
          })),
        })),
      })),
    };
  };

  // Perform AI Decomposition to generate a fully atomized Goal
  const handleAtomizeGoal = async () => {
    if (!newGoalTitle.trim()) return;

    // Strict paywall enforcement for Operative tier limit:
    if (
      userProfile.tier === "operative" &&
      userGoalsList.length >= userProfile.atomizationLimit &&
      !userProfile.isFounderLifetime
    ) {
      setAtomizeError(
        `Operative Protocol allocation reached (${userGoalsList.length}/${userProfile.atomizationLimit} objectives). Please upgrade to Tactical Pro ($15/mo) or the Founder Pass ($99) for unlimited objective matrices.`
      );
      setShowPaywallModal(true);
      return;
    }

    setIsAtomizing(true);
    setAtomizeError(null);

    const goalTitle = newGoalTitle.trim();
    const goalDesc = newGoalDesc.trim();

    // 1. If preferred engine is Puter.ai, decompose using free client-side AI ($0 server cost)
    if (userProfile.preferredEngine === "puter" && isPuterAvailable()) {
      try {
        const puterData = await decomposeGoalWithPuter(goalTitle, goalDesc);
        if (puterData && puterData.phases && puterData.phases.length > 0) {
          const freshGoal = formatDecompositionGoal(puterData, goalTitle, goalDesc);
          setGoal(freshGoal);
          setSelectedNodeId("root");
          setMessages([
            {
              id: `atom-init-${Date.now()}`,
              sender: "coach",
              text: `[TACTICAL DECOMPOSITION COMPLETE • NEURAL MATRIX ACTIVE]
New goal matrix assembled for: "${freshGoal.title}".
Timeline: ${freshGoal.timeline}.
Phases: ${freshGoal.phases.length} sequential phases with ${freshGoal.phases.reduce((acc, p) => acc + p.tasks.length, 0)} atomic tasks.
Tactical Directive: "${freshGoal.encouragement}"`,
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);
          setShowAtomizeModal(false);
          setNewGoalTitle("");
          setNewGoalDesc("");
          setIsAtomizing(false);
          return;
        }
      } catch (puterErr) {
        console.warn("Puter decomposition error, trying backend server...", puterErr);
      }
    }

    try {
      const response = await fetch("/api/decompose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: goalTitle,
          description: goalDesc,
        }),
      });

      if (!response.ok) {
        throw new Error("Live backend decomposition matrix rejected.");
      }

      const data = await response.json();
      const freshGoal = formatDecompositionGoal(data, goalTitle, goalDesc);

      setGoal(freshGoal);
      setSelectedNodeId("root");
      setMessages([
        {
          id: `atom-init-${Date.now()}`,
          sender: "coach",
          text: `[DECOMPOSITION COMPLETED SECURELY]
New goal matrix assembled for: "${freshGoal.title}".
Timeline: ${freshGoal.timeline}.
Tactical Warning: "${freshGoal.encouragement}"`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setShowAtomizeModal(false);
      setNewGoalTitle("");
      setNewGoalDesc("");
    } catch (err: any) {
      console.warn("Decomposition API error. Trying Puter.ai or heuristic fallback...", err);

      // Attempt Puter.ai client-side decomposition if server failed
      if (isPuterAvailable()) {
        try {
          const puterData = await decomposeGoalWithPuter(goalTitle, goalDesc);
          if (puterData && puterData.phases && puterData.phases.length > 0) {
            const freshGoal = formatDecompositionGoal(puterData, goalTitle, goalDesc);
            setGoal(freshGoal);
            setSelectedNodeId("root");
            setMessages([
              {
                id: `atom-init-${Date.now()}`,
                sender: "coach",
                text: `[TACTICAL DECOMPOSITION COMPLETE • NEURAL MATRIX ACTIVE]
New goal matrix generated for: "${freshGoal.title}".
Sequential milestones synchronized to your command dashboard.`,
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);
            setShowAtomizeModal(false);
            setNewGoalTitle("");
            setNewGoalDesc("");
            setIsAtomizing(false);
            return;
          }
        } catch (puterErr2) {
          console.warn("Puter secondary fallback failed, proceeding to heuristic:", puterErr2);
        }
      }

      // Informative user-friendly alert with custom elegant fallback
      setAtomizeError(
        "API KEY NOT SPECIFIED: Operations fall back safely to our local heuristic modeling engine. Operates instantly with high precision."
      );

      // Launch heuristic model builder locally
      setTimeout(() => {
        const fallbackPhases = [
          {
            id: `p1-${Date.now()}`,
            title: "Phase 1: Setup & Environment Calibration",
            description: "Prepare required compilers, configure network bounds, and confirm resource listings.",
            duration: "2 weeks",
            priority: "Critical" as const,
            milestones: ["Environment compiled", "Resource assets loaded"],
            completed: false,
            tasks: [
              {
                id: `t1-${Date.now()}`,
                title: `Establish Core Workspace for ${newGoalTitle}`,
                description: `Configure basic toolsets, folder structures, and dependencies related to ${newGoalTitle}.`,
                duration: "3 days",
                priority: "High" as const,
                completed: false,
                urgency: "Urgent" as const,
                importance: "Important" as const,
                tools: ["Terminal", "Markdown", "Git"],
                deliverable: "Standardized target workspace directory.",
                atoms: [
                  { id: `a1-1-${Date.now()}`, title: "Initialize local repositories", completed: false },
                  { id: `a1-2-${Date.now()}`, title: "Create index log structures", completed: false },
                ],
              },
              {
                id: `t2-${Date.now()}`,
                title: "Research Key Optimization Benchmarks",
                description: "Synthesize target guidelines, study comparative models, and catalog parameters.",
                duration: "4 days",
                priority: "Medium" as const,
                completed: false,
                urgency: "Not Urgent" as const,
                importance: "Important" as const,
                tools: ["Google Search", "Docs"],
                deliverable: "Detailed catalog of technical constraints.",
                atoms: [
                  { id: `a2-1-${Date.now()}`, title: "Examine 3 comparative models", completed: false },
                ],
              },
            ],
          },
          {
            id: `p2-${Date.now()}`,
            title: "Phase 2: Execution & Core Prototyping",
            description: "Build, integrate, and test primary modular components of the target project.",
            duration: "4 weeks",
            priority: "High" as const,
            milestones: ["Core functionality validated"],
            completed: false,
            tasks: [
              {
                id: `t3-${Date.now()}`,
                title: "Program Core Logic Matrix",
                description: "Map data handlers, functional triggers, and state models.",
                duration: "6 days",
                priority: "Critical" as const,
                completed: false,
                urgency: "Urgent" as const,
                importance: "Important" as const,
                tools: ["IDE Code Compiler"],
                deliverable: "Robust functional code script.",
                atoms: [
                  { id: `a3-1-${Date.now()}`, title: "Develop mock unit tests", completed: false },
                  { id: `a3-2-${Date.now()}`, title: "Draft core functions", completed: false },
                ],
              },
              {
                id: `t4-${Date.now()}`,
                title: "Refine Visual Interface HUD",
                description: "Compile accessible styles, responsive grids, and visual typography.",
                duration: "5 days",
                priority: "Medium" as const,
                completed: false,
                urgency: "Not Urgent" as const,
                importance: "Not Important" as const,
                tools: ["TailwindCSS"],
                deliverable: "Sleek user interface cockpit.",
                atoms: [
                  { id: `a4-1-${Date.now()}`, title: "Review mobile tap bounds", completed: false },
                ],
              },
            ],
          },
        ];

        const fallbackGoal: Goal = {
          id: `goal-fallback-${Date.now()}`,
          title: newGoalTitle.trim(),
          description: newGoalDesc.trim() || `Decomposed roadmap for ${newGoalTitle}`,
          timeline: "6 weeks",
          insight: "Focus on establishing clean, consistent daily habits instead of long erratic sessions.",
          encouragement: "Heuristic decomposition initialized. Operate on strict task limits to guarantee completion velocity.",
          resources: ["Operational Calendar", "Local HUD Dashboards"],
          completed: false,
          progress: 0,
          phases: fallbackPhases,
        };

        setGoal(fallbackGoal);
        setSelectedNodeId("root");
        setMessages([
          {
            id: `atom-fallback-${Date.now()}`,
            sender: "coach",
            text: `[LOCAL HEURISTIC BUILDER ONLINE]
Roadmap generated instantly for: "${fallbackGoal.title}".
Note: Running in offline/local mode. To unlock live AI decomposition and real-time voice coaching, ensure GEMINI_API_KEY is active in Secrets.`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        setIsAtomizing(false);
        setShowAtomizeModal(false);
        setNewGoalTitle("");
        setNewGoalDesc("");
        setAtomizeError(null);
      }, 1500);
    }
  };

  // --- RENDERS ---

  const activeTasks = goal.phases.flatMap((p) => p.tasks);

  if (viewMode === "landing") {
    return (
      <>
        <LandingPage
          onEnterCockpit={() => setViewMode("cockpit")}
          onOpenPaywall={() => setShowPaywallModal(true)}
          userProfile={userProfile}
          successStories={successStories}
          onSelectTier={updateTier}
          onOpenFounderPerks={() => setShowFounderPerksModal(true)}
          onOpenTerms={handleOpenTerms}
        />
        <PaywallModal
          isOpen={showPaywallModal}
          onClose={() => setShowPaywallModal(false)}
          userProfile={userProfile}
          onSelectTier={updateTier}
          activePersonaId={activePersonaId}
          onSelectPersona={setActivePersonaId}
          atomizationsCount={userGoalsList.length}
          onAddVoiceMinutes={addVoiceMinutes}
          onSelectEngine={setPreferredEngine}
          onOpenFounderPerks={() => setShowFounderPerksModal(true)}
          onRedeemPromoCode={redeemPromoCode}
          onOpenTerms={handleOpenTerms}
        />
        <TermsModal
          isOpen={showTermsModal}
          onClose={() => setShowTermsModal(false)}
          defaultTab={termsTab}
        />
        <FounderPerksModal
          isOpen={showFounderPerksModal}
          onClose={() => setShowFounderPerksModal(false)}
          userProfile={userProfile}
          onClaimMerch={claimFounderMerch}
        />
        <PromoCodeModal
          isOpen={showPromoModal}
          onClose={() => setShowPromoModal(false)}
          onRedeem={redeemPromoCode}
          onOpenFounderPerks={() => setShowFounderPerksModal(true)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-gray-300 font-sans selection:bg-rebel-500/30 selection:text-white flex flex-col relative overflow-x-hidden">
      {/* Interactive Cyber Particle Background */}
      <ParticleBackground />

      {/* Background Particles Grid Overlay and Glowing Gradients */}
      <div className="absolute inset-0 opacity-20 pointer-events-none z-0">
        <div className="absolute w-full h-full" style={{ backgroundImage: "radial-gradient(#00f3ff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="absolute top-0 left-0 w-full h-full" style={{ background: "radial-gradient(circle at 50% 50%, rgba(0, 243, 255, 0.1) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px]" style={{ background: "radial-gradient(circle at 50% 50%, rgba(255, 0, 229, 0.08) 0%, transparent 70%)" }} />
      </div>

      {/* Cyber HUD Header Control Bar */}
      <header className="relative z-10 border-b border-rebel-900/30 bg-black/40 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-rebel-500 to-rebel-600 flex items-center justify-center shadow-lg shadow-rebel-500/15">
            <div className="w-3.5 h-3.5 border-2 border-white rounded-full animate-pulse"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans font-black text-lg tracking-tight text-white flex items-center">
                A.T.O.M<span className="text-rebel-400 font-mono font-bold lowercase">-i</span>
              </h1>
              <span className="font-mono text-[9px] text-rebel-400 border border-rebel-500/30 px-1.5 py-0.5 rounded bg-rebel-950/20">
                v3.8
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[9px] text-gray-400 font-mono tracking-wider leading-none">
                Advanced Tactical Operation Manager • <span className="lowercase text-rebel-400 font-mono">atom-i</span>
              </p>
            </div>
          </div>
        </div>

        {/* Global Progress Indicator & Saved Goals Selector */}
        <div className="flex items-center gap-4 bg-black/50 border border-rebel-900/40 px-4 py-2 rounded-xl backdrop-blur-sm">
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <span className="block text-[8px] font-mono text-rebel-400 uppercase tracking-widest font-bold">
                OBJECTIVE
              </span>
              {userGoalsList.length > 1 && (
                <select
                  value={goal.id}
                  onChange={(e) => loadGoalFromFirestore(e.target.value)}
                  className="bg-rebel-950/80 border border-rebel-500/30 text-[9px] font-mono text-rebel-300 rounded px-1 py-0.5 outline-none cursor-pointer"
                  title="Switch saved goal"
                >
                  {userGoalsList.map((g) => (
                    <option key={g.id} value={g.id} className="bg-black text-white">
                      {g.title.slice(0, 24)}... ({g.progress}%)
                    </option>
                  ))}
                </select>
              )}
            </div>
            <span className="block text-xs font-semibold text-white truncate max-w-[150px]">
              {goal.title}
            </span>
          </div>
          <div className="h-6 w-px bg-rebel-900/30" />
          <div className="text-right">
            <span className="block text-[8px] font-mono text-gray-500 uppercase tracking-widest">
              GLOBAL SYNC LEVEL
            </span>
            <span className="block text-xs font-mono font-bold text-white">
              {goal.progress}% COMPLETE
            </span>
          </div>
          <div className="w-20 h-1.5 bg-gray-900 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-rebel-400 to-rebel-500 rounded-full transition-all duration-500"
              style={{ width: `${goal.progress}%` }}
            />
          </div>
        </div>

        {/* Actions Bar: Sound Toggle, PWA Install, Landing Page, Paywall/Tier, Live Voice, Database/Offline Sync, Google Auth & Decompose Goal */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Cyber Audio Mute / Unmute Toggle */}
          <button
            onClick={() => {
              playClick();
              toggleSound();
            }}
            className={`px-2.5 py-1.5 rounded-lg border font-mono text-xs flex items-center gap-1.5 transition-colors ${
              isAudioEnabled
                ? "bg-rebel-500/10 border-rebel-500/40 text-rebel-400 hover:bg-rebel-500/20"
                : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300"
            }`}
            title={isAudioEnabled ? "Cyber Audio Cues Active (Click to Mute)" : "Audio Muted (Click to Unmute)"}
          >
            {isAudioEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-rebel-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-gray-500" />
            )}
            <span className="hidden sm:inline text-[10px] uppercase font-bold">
              {isAudioEnabled ? "AUDIO" : "MUTED"}
            </span>
          </button>

          {/* Brown Noise & ADHD Flow Ambience Button */}
          <button
            onClick={() => {
              playClick();
              setShowAmbienceModal(true);
            }}
            className={`px-2.5 py-1.5 rounded-lg border font-mono text-xs flex items-center gap-1.5 transition-all ${
              isAmbienceActive
                ? "bg-rust-500/20 border-rust-400 text-rust-300 shadow-md shadow-rust-500/20"
                : "bg-rebel-500/5 hover:bg-rebel-500/10 border-rebel-500/30 text-rebel-400 hover:text-rebel-200"
            }`}
            title="Brown Noise & Deep Focus Ambience (Calms ADHD dopamine restlessness and crushes task inertia)"
          >
            <Waves className={`w-3.5 h-3.5 ${isAmbienceActive ? "text-rust-400 animate-pulse" : "text-rebel-400"}`} />
            <span className="hidden sm:inline text-[10px] uppercase font-bold">
              {isAmbienceActive ? "BROWN NOISE: ON" : "BROWN NOISE"}
            </span>
            {isAmbienceActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-rust-400 animate-ping" />
            )}
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton onInstalledSound={() => playBranchSuccess()} />

          {/* Landing Page Button */}
          <button
            onClick={() => {
              playClick();
              setViewMode("landing");
            }}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-mono text-xs flex items-center gap-1.5 transition-colors"
            title="View Landing Page & Verified Success Stories"
          >
            <Layout className="w-3.5 h-3.5 text-rebel-400" />
            <span className="hidden sm:inline">LANDING</span>
          </button>

          {/* Founder Genesis Badge & Freebies (for Founder Pass owners and Creator) */}
          {(userProfile.tier === "founder_lifetime" ||
            userProfile.isFounderLifetime ||
            userProfile.isCreator ||
            userProfile.founderNumber === 0) && (
            <button
              onClick={() => {
                playClick();
                setShowFounderPerksModal(true);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-rust-500/20 to-rust-600/20 hover:from-rust-500/30 hover:to-rust-600/30 border border-rust-400/50 text-rust-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-rust-950/40"
              title="View Creator / Founder Genesis Pass & Perks"
            >
              <Award className="w-3.5 h-3.5 text-rust-400 animate-pulse" />
              <span>
                {userProfile.isCreator ||
                userProfile.founderNumber === 0 ||
                userProfile.email === "faux.fuax@gmail.com"
                  ? "CREATOR #000"
                  : userProfile.founderNumber !== undefined && userProfile.founderNumber !== null
                  ? `FOUNDER #${String(userProfile.founderNumber).padStart(3, "0")}`
                  : "FOUNDER"}
              </span>
            </button>
          )}

          {/* VIP Access / Promo Code Button for owner, family & friends */}
          <button
            onClick={() => {
              playClick();
              setShowPromoModal(true);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-rebel-500/10 border border-white/10 hover:border-rebel-400/40 text-gray-400 hover:text-rebel-300 font-mono text-xs flex items-center gap-1 transition-colors"
            title="Redeem Founder, Family, or VIP Access Key"
          >
            <KeyRound className="w-3.5 h-3.5 text-rebel-400" />
            <span className="hidden lg:inline text-[10px] uppercase font-bold">VIP KEY</span>
          </button>

          {/* Tier Entitlements & Paywall Button */}
          <button
            onClick={() => {
              playDrawer(true);
              setShowPaywallModal(true);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-rebel-950/70 to-rebel-950/70 hover:from-rebel-900/80 hover:to-rebel-900/80 border border-rebel-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-rebel-950/40"
            title="Open Protocol Upgrades & Entitlements"
          >
            <Shield className="w-3.5 h-3.5 text-rust-400" />
            <span className="uppercase text-rebel-300">
              {userProfile.isCreator || userProfile.founderNumber === 0
                ? "CREATOR"
                : userProfile.tier === "founder_lifetime" || userProfile.isFounderLifetime
                ? "FOUNDER"
                : userProfile.tier === "vanguard_live"
                ? "VANGUARD"
                : userProfile.tier === "tactical_pro"
                ? "TACTICAL PRO"
                : "OPERATIVE"}
            </span>
            <span className="text-[9px] text-gray-400 font-mono">
              ({userGoalsList.length}/{userProfile.atomizationLimit === 999999 ? "∞" : userProfile.atomizationLimit})
            </span>
            {userProfile.tier === "operative" && (
              <span className="ml-1 px-1.5 py-0.2 rounded bg-rust-500/20 text-rust-300 text-[8px] font-bold border border-rust-500/30">
                UPGRADE
              </span>
            )}
          </button>

          {/* Live Voice Cockpit Button (Gated by Voice Minutes / Vanguard Tier) */}
          <button
            onClick={() => {
              if (
                userProfile.voiceMinutesRemaining <= 0 &&
                userProfile.tier !== "vanguard_live" &&
                !userProfile.isFounderLifetime &&
                userProfile.tier !== "founder_lifetime"
              ) {
                playDrawer(true);
                setShowPaywallModal(true);
                return;
              }
              playDrawer(true);
              setShowLiveVoiceModal(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-rebel-950/80 to-rebel-950/80 hover:from-rebel-900 hover:to-rebel-900 border border-rebel-400/40 text-rebel-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-rebel-950/40"
            title={
              userProfile.voiceMinutesRemaining > 0
                ? `${userProfile.voiceMinutesRemaining} voice minutes remaining`
                : "Live Voice requires Vanguard Tier, Founder Pass, or Voice Minute refill"
            }
          >
            <Radio className="w-3.5 h-3.5 text-rebel-400 animate-pulse" />
            <span className="hidden sm:inline">LIVE VOICE</span>
            <span className="text-[9px] font-mono text-rebel-300 px-1 py-0.2 rounded bg-rebel-950/60 border border-rebel-500/30">
              {userProfile.voiceMinutesRemaining}m
            </span>
          </button>

          {/* Offline Resilience / Database Sync Badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/50 border font-mono text-[10px] cursor-pointer"
            onClick={() => {
              if (isOnline && pendingCount > 0) {
                playClick();
                syncQueue();
              }
            }}
            title={
              !isOnline
                ? "Offline Mode: Changes are cached locally in IndexedDB/LocalStorage and will auto-sync when reconnected."
                : pendingCount > 0
                ? `${pendingCount} queued change(s). Click to force push to cloud.`
                : "Live persistent connection to atom-i cloud database"
            }
          >
            {!isOnline ? (
              <span className="text-rust-400 flex items-center gap-1 font-bold">
                <WifiOff className="w-3 h-3 text-rust-400 animate-pulse" /> OFFLINE (CACHED)
              </span>
            ) : isSyncing ? (
              <span className="text-rebel-400 flex items-center gap-1 font-bold animate-pulse">
                <Wifi className="w-3 h-3 text-rebel-400" /> SYNCING ({pendingCount})...
              </span>
            ) : pendingCount > 0 ? (
              <span className="text-rebel-300 flex items-center gap-1 font-bold">
                <Database className="w-3 h-3 text-rebel-400" /> QUEUED ({pendingCount})
              </span>
            ) : syncStatus === "saving" ? (
              <span className="text-rust-300 flex items-center gap-1 font-bold animate-pulse">
                <Database className="w-3 h-3 text-rust-300" /> SAVING...
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <Check className="w-3 h-3 text-emerald-400" /> atom-i SYNCED
              </span>
            )}
          </div>

          {/* Google Auth Sign In / Profile */}
          {user ? (
            <div className="flex items-center gap-2 bg-black/50 border border-rebel-900/40 rounded-lg p-1 pr-2.5">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="w-7 h-7 rounded-full border border-rebel-400/30"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-rebel-950 border border-rebel-400/30 flex items-center justify-center text-rebel-300 font-bold text-xs">
                  {user.displayName?.[0] || user.email?.[0] || "U"}
                </div>
              )}
              <div className="text-left font-mono hidden xl:block">
                <span className="block text-[10px] text-white font-semibold leading-tight truncate max-w-[90px]">
                  {user.displayName || user.email?.split("@")[0]}
                </span>
                <span className="block text-[8px] text-rebel-400/80">AUTHENTICATED</span>
              </div>
              <button
                onClick={() => {
                  playClick();
                  signOut();
                }}
                title="Sign Out"
                className="p-1 rounded text-gray-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                playClick();
                signInWithGoogle();
              }}
              disabled={authLoading}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 font-mono text-xs uppercase tracking-tight transition-all duration-300 flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5 text-rebel-400" />
              <span>{authLoading ? "LINKING..." : "SIGN IN"}</span>
            </button>
          )}

          <button
            onClick={() => {
              if (
                userProfile.tier === "operative" &&
                userGoalsList.length >= userProfile.atomizationLimit &&
                !userProfile.isFounderLifetime
              ) {
                playDrawer(true);
                setShowPaywallModal(true);
                return;
              }
              playDrawer(true);
              setShowAtomizeModal(true);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-rebel-500/10 hover:bg-rebel-500/20 border border-rebel-500/50 text-rebel-400 font-mono text-xs uppercase tracking-tight transition-all duration-300 font-bold"
            title="Decompose a goal into atomic actionable phases and tasks"
          >
            ⚡ DECOMPOSE
          </button>
        </div>
      </header>

      {/* Auth Error Notification Banner */}
      {authError && (
        <div className="relative z-20 max-w-7xl mx-auto px-6 pt-4">
          <div className="p-3.5 rounded-xl bg-rust-950/80 border border-rust-500/50 text-rust-200 font-mono text-xs flex items-center gap-2 shadow-lg shadow-black/50">
            <AlertCircle className="w-4 h-4 text-rust-400 shrink-0" />
            <span className="leading-relaxed">{authError}</span>
          </div>
        </div>
      )}

      {/* Main Grid Deck */}
      <main className="relative z-10 flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        {/* Left Column: Task Map and Node Inspector */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          <div className="h-[460px] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-sans font-bold text-xs tracking-wider text-rebel-400 uppercase flex items-center gap-2">
                <Activity className="w-4 h-4" /> Interactive Node Map
              </h2>
              <span className="text-[9px] text-gray-500 font-mono uppercase">
                Active: "{goal.title}"
              </span>
            </div>
            <div className="flex-1 min-h-0">
              <TaskMap
                goal={goal}
                selectedNodeId={selectedNodeId}
                onSelectNode={handleSelectNode}
                onToggleComplete={handleToggleComplete}
              />
            </div>
          </div>

          {/* Node Inspector details panel */}
          {selectedNode && (
            <div className="border border-rebel-900/40 bg-black/50 rounded-xl p-5 backdrop-blur-sm relative overflow-hidden shadow-lg shadow-black/40 animate-fade-in">
              {/* Highlight scanner line decoration */}
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-rebel-400 to-purple-500" />

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-rebel-900/30 pb-4 mb-4">
                <div>
                  <span className="text-[9px] font-mono text-rebel-400 uppercase tracking-widest bg-rebel-950/20 border border-rebel-400/10 px-2 py-0.5 rounded">
                    {selectedNode.type === "goal"
                      ? "GOAL OBJECTIVE"
                      : selectedNode.type === "phase"
                      ? "STRATEGIC PHASE"
                      : "ATOMIC TASK"}
                  </span>
                  <h3 className="font-sans font-bold text-sm text-white mt-1.5 leading-tight">
                    {selectedNode.item.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleComplete(selectedNode.item.id, selectedNode.type)}
                    className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all duration-300 flex items-center gap-1.5 ${
                      selectedNode.item.completed
                        ? "bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25"
                        : "bg-white/[0.02] border border-white/10 text-gray-300 hover:bg-white/[0.05]"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {selectedNode.item.completed ? "COMPLETED" : "MARK COMPLETE"}
                  </button>

                  {selectedNode.type === "task" && (
                    <>
                      <button
                        onClick={() => handleScheduleTask(selectedNode.item as Task)}
                        className="px-3.5 py-1.5 rounded-lg border border-rebel-500/20 bg-rebel-500/10 hover:bg-rebel-500/20 text-rebel-400 font-mono text-xs font-semibold transition-all duration-300 flex items-center gap-1.5"
                      >
                        <Clock className="w-4 h-4" />
                        SCHEDULE
                      </button>
                      <button
                        onClick={() => handleConsultTask(selectedNode.item as Task)}
                        className="px-3.5 py-1.5 rounded-lg border border-rebel-500/30 bg-rebel-500/10 hover:bg-rebel-500/20 text-rebel-300 font-mono text-xs font-semibold transition-all duration-300 flex items-center gap-1.5"
                        title="Get tactical advice on completing this task without altering the main goal"
                      >
                        <Sparkles className="w-4 h-4 text-rebel-400" />
                        ADVISE ON TASK
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Inspector Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2 space-y-3">
                  <div>
                    <h4 className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                      Objective Description
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {selectedNode.item.description || "No specifications loaded."}
                    </p>
                  </div>

                  {/* Micro-actions checklist for Tasks */}
                  {selectedNode.type === "task" && (selectedNode.item as Task).atoms && (
                    <div>
                      <h4 className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-rebel-400" /> Action Checklist
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(selectedNode.item as Task).atoms?.map((atom) => (
                          <div
                            key={atom.id}
                            onClick={() => handleToggleAtom(selectedNode.item.id, atom.id)}
                            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-all ${
                              atom.completed
                                ? "border-emerald-500/10 bg-emerald-500/5 text-emerald-400 opacity-60"
                                : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03] text-gray-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={atom.completed}
                              onChange={() => {}} // handled by div click
                              className="w-3.5 h-3.5 accent-emerald-400 cursor-pointer"
                            />
                            <div className="text-[11px] truncate leading-none">
                              <div className="font-semibold">{atom.title}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Milestones for Phases */}
                  {selectedNode.type === "phase" && (selectedNode.item as Phase).milestones && (
                    <div>
                      <h4 className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">
                        Phase Deliverables
                      </h4>
                      <ul className="list-disc pl-4 space-y-1 text-xs text-gray-300 font-sans">
                        {(selectedNode.item as Phase).milestones?.map((milestone, idx) => (
                          <li key={idx}>{milestone}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Overview details for Goal */}
                  {selectedNode.type === "goal" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="p-3 border border-rebel-900/40 bg-rebel-950/20 rounded-lg">
                        <h5 className="text-[9px] font-mono text-rebel-400 uppercase tracking-widest mb-1">
                          Tactical Warning
                        </h5>
                        <p className="text-[11px] italic text-gray-300 font-sans leading-relaxed">
                          "{goal.encouragement || "Full execution matrix ready."}"
                        </p>
                      </div>
                      <div className="p-3 border border-purple-900/40 bg-purple-950/20 rounded-lg">
                        <h5 className="text-[9px] font-mono text-purple-400 uppercase tracking-widest mb-1">
                          Optimization Insight
                        </h5>
                        <p className="text-[11px] text-gray-300 font-sans leading-relaxed">
                          {goal.insight || "Prioritize high-impact bottlenecks."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar details */}
                <div className="bg-black/40 border border-rebel-900/40 p-4 rounded-lg space-y-3 font-mono text-[10px]">
                  <div className="flex justify-between items-center pb-2 border-b border-rebel-900/30">
                    <span className="text-gray-500 uppercase tracking-tight">TIMEFRAME</span>
                    <span className="text-white font-bold">
                      {selectedNode.type === "goal"
                        ? (selectedNode.item as Goal).timeline || "Not specified"
                        : (selectedNode.item as Phase | Task).duration || "Ongoing"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-rebel-900/30">
                    <span className="text-gray-500 uppercase tracking-tight">PRIORITY</span>
                    <span
                      className={`font-bold uppercase ${
                        selectedNode.item.priority === "Critical" ||
                        selectedNode.item.priority === "High"
                          ? "text-rose-500"
                          : "text-rebel-400"
                      }`}
                    >
                      {selectedNode.item.priority || "Medium"}
                    </span>
                  </div>

                  {selectedNode.type === "task" && (
                    <>
                      <div className="pb-2 border-b border-rebel-900/30">
                        <span className="text-gray-500 uppercase tracking-tight block mb-1">
                          TOOLS REQUIRED
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {(selectedNode.item as Task).tools?.map((tool, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded bg-black/40 border border-rebel-900/40 text-gray-300 text-[9px]"
                            >
                              {tool}
                            </span>
                          )) || <span className="text-gray-500">None</span>}
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-500 uppercase tracking-tight block mb-1">
                          TANGIBLE DELIVERABLE
                        </span>
                        <span className="text-gray-300 font-sans leading-relaxed block text-[11px]">
                          {(selectedNode.item as Task).deliverable || "No deliverable spec."}
                        </span>
                      </div>
                    </>
                  )}

                  {selectedNode.type === "goal" && (
                    <div>
                      <span className="text-gray-500 uppercase tracking-tight block mb-1.5">
                        UTILITY RESOURCES
                      </span>
                      <div className="flex flex-col gap-1.5">
                        {goal.resources?.map((resName, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-gray-300">
                            <Wrench className="w-3 h-3 text-rebel-400 shrink-0" />
                            <span className="truncate font-sans">{resName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Eisenhower Matrix and AI Coach Chat Terminal */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          {/* Eisenhower Matrix Quadrants (Tier Gated) */}
          <div className="shrink-0">
            {userProfile.hasGrid ? (
              <EisenhowerMatrix
                tasks={activeTasks}
                onSelectTask={(id) => handleSelectNode(id, "task")}
                onToggleComplete={(id) => handleToggleComplete(id, "task")}
                onScheduleTask={handleScheduleTask}
              />
            ) : (
              <div className="border border-rebel-900/40 bg-black/60 rounded-xl p-6 backdrop-blur-sm text-center relative overflow-hidden shadow-lg shadow-black/50">
                <div className="w-10 h-10 rounded-xl bg-rebel-950/80 border border-rebel-500/40 flex items-center justify-center text-rebel-400 mx-auto mb-3">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-rebel-300">
                  Eisenhower Matrix Locked
                </h3>
                <p className="text-[11px] text-gray-400 mt-2 max-w-xs mx-auto leading-relaxed">
                  The 4-Quadrant Urgency vs Importance Priority Engine is unlocked in Package 2 (Tactical Pro) and Package 3 (Vanguard).
                </p>
                <div className="mt-4 flex flex-col gap-2 max-w-xs mx-auto">
                  <button
                    onClick={() => setShowPaywallModal(true)}
                    className="w-full py-2 px-3 rounded-lg bg-rebel-500 hover:bg-rebel-400 text-black font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-md shadow-rebel-950/50"
                  >
                    Upgrade Tier to Unlock
                  </button>
                  <button
                    onClick={() => setActivePersonaId("pkg_2_user_test")}
                    className="w-full py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-mono text-[10px] uppercase transition-colors"
                  >
                    Preview with pkg_2_user_test
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI Guide Coach Chat */}
          <div className="h-[390px] max-h-[390px]">
            <AICoach
              goal={goal}
              messages={messages}
              onSendMessage={handleSendCoachMessage}
              isCoachTyping={isCoachTyping}
              onOpenLiveVoice={() => setShowLiveVoiceModal(true)}
            />
          </div>
        </section>

        {/* Bottom Section: Weekly Optimization Schedule Planner (Tier Gated or Calendar Connected) */}
        <section className="lg:col-span-12">
          {userProfile.hasCalendar || hasCalendarAccess ? (
            <Planner
              plannerTasks={plannerTasks}
              onAddTask={(t) => {
                const newTask: PlannerTask = { ...t, id: `pt-${Date.now()}` };
                setPlannerTasks((pts) => [...pts, newTask]);
                savePlannerTaskToFirestore(newTask);
              }}
              onUpdateTask={(id, updates) => {
                setPlannerTasks((pts) => {
                  const next = pts.map((pt) => (pt.id === id ? { ...pt, ...updates } : pt));
                  const updated = next.find((p) => p.id === id);
                  if (updated) savePlannerTaskToFirestore(updated);
                  return next;
                });
              }}
              onDeleteTask={(id) => {
                setPlannerTasks((pts) => pts.filter((pt) => pt.id !== id));
                deletePlannerTaskFromFirestore(id);
              }}
            />
          ) : (
            <div className="border border-rebel-900/40 bg-black/60 rounded-xl p-8 backdrop-blur-sm text-center relative overflow-hidden shadow-lg shadow-black/50">
              <div className="w-10 h-10 rounded-xl bg-rebel-950/80 border border-rebel-500/40 flex items-center justify-center text-rebel-400 mx-auto mb-3">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-rebel-300">
                Chrono Schedule Planner Locked
              </h3>
              <p className="text-[11px] text-gray-400 mt-2 max-w-sm mx-auto leading-relaxed">
                Direct Drag & Schedule daily hour-blocking calendar with Google Calendar sync is available for Tactical Pro, Vanguard, and Google Calendar connected accounts.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <button
                  onClick={async () => {
                    playClick();
                    await requestCalendarAccess();
                  }}
                  className="py-2 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-rebel-500 hover:from-blue-500 hover:to-rebel-400 text-black font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-rebel-950/50 flex items-center gap-2"
                >
                  Connect Google Calendar
                </button>
                <button
                  onClick={() => setShowPaywallModal(true)}
                  className="py-2 px-4 rounded-lg bg-rebel-500/20 hover:bg-rebel-500/30 border border-rebel-400/40 text-rebel-300 font-mono text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Upgrade Tier
                </button>
                <button
                  onClick={() => setActivePersonaId("pkg_2_user_test")}
                  className="py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-mono text-xs uppercase transition-colors"
                >
                  Preview with pkg_2_user_test
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* FOOTER COCKPIT TELEMETRY - Immersive UI styled */}
      <footer className="relative z-10 h-10 bg-black/90 border-t border-rebel-900/40 flex items-center px-6 justify-between select-none">
        <div className="flex gap-4 items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[9px] font-mono text-gray-400 tracking-wider">
            PROJECT: <span className="text-rebel-400 font-bold">A.T.O.M<span className="lowercase font-mono text-rebel-300">-i</span></span> • OPERATOR: <span className="text-white">{effectiveUid}</span>
          </span>
        </div>
        <div className="hidden md:flex flex-1 mx-8 gap-6 overflow-hidden justify-center pointer-events-none">
          <span className="text-[9px] font-mono text-rebel-700/80 whitespace-nowrap">
            NODE_CLUSTER: 104.22.1 • LATENCY: 14ms • ATOMIC_STEPS: {activeTasks.length} • TARGET_PROGRESS: {goal.progress}%
          </span>
          <span className="text-[9px] font-mono text-rebel-700/70 whitespace-nowrap hidden lg:inline">
            TIER: {userProfile.tier.toUpperCase()} • LIMIT: {userGoalsList.length}/{userProfile.atomizationLimit === 999999 ? "∞" : userProfile.atomizationLimit}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenTerms("terms")}
            className="text-[9px] font-mono text-gray-500 hover:text-rebel-300 transition-colors uppercase tracking-wider"
          >
            [TERMS]
          </button>
          <button
            onClick={() => handleOpenTerms("refunds")}
            className="text-[9px] font-mono text-gray-500 hover:text-rebel-300 transition-colors uppercase tracking-wider"
          >
            [REFUNDS]
          </button>
          <button
            onClick={() => handleOpenTerms("support")}
            className="text-[9px] font-mono text-rebel-400/80 hover:text-rebel-300 transition-colors uppercase tracking-wider"
          >
            [SUPPORT]
          </button>
          <button
            onClick={() => setShowPaywallModal(true)}
            className="text-[9px] font-mono text-rebel-400 hover:text-rebel-300 transition-colors uppercase tracking-wider"
          >
            [MANAGE TIERS]
          </button>
        </div>
      </footer>

      {/* Gemini 3.8 Live Voice Coach Cockpit Modal */}
      <LiveVoiceCoach
        goal={goal}
        isOpen={showLiveVoiceModal}
        onClose={() => setShowLiveVoiceModal(false)}
        voiceMinutesRemaining={userProfile.voiceMinutesRemaining}
        onOpenPaywall={() => setShowPaywallModal(true)}
      />

      {/* Paywall & Entitlement Management Modal */}
      <PaywallModal
        isOpen={showPaywallModal}
        onClose={() => setShowPaywallModal(false)}
        userProfile={userProfile}
        onSelectTier={updateTier}
        activePersonaId={activePersonaId}
        onSelectPersona={setActivePersonaId}
        atomizationsCount={userGoalsList.length}
        onAddVoiceMinutes={addVoiceMinutes}
        onSelectEngine={setPreferredEngine}
        onOpenFounderPerks={() => setShowFounderPerksModal(true)}
        onRedeemPromoCode={redeemPromoCode}
        onOpenTerms={handleOpenTerms}
      />

      {/* Terms of Service & Stripe Compliance Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        defaultTab={termsTab}
      />

      {/* Founder Genesis NFT Badge & Physical Freebie Merch Modal */}
      <FounderPerksModal
        isOpen={showFounderPerksModal}
        onClose={() => setShowFounderPerksModal(false)}
        userProfile={userProfile}
        onClaimMerch={claimFounderMerch}
      />

      {/* VIP Access / Family & Friends Promo Code Terminal */}
      <PromoCodeModal
        isOpen={showPromoModal}
        onClose={() => setShowPromoModal(false)}
        onRedeem={redeemPromoCode}
        onOpenFounderPerks={() => setShowFounderPerksModal(true)}
      />

      {/* Tactical Brown Noise & Flow Ambience Focus Modal */}
      <AmbienceFocusModal
        isOpen={showAmbienceModal}
        onClose={() => setShowAmbienceModal(false)}
        isAmbienceActive={isAmbienceActive}
        onToggleAmbience={handleToggleAmbience}
      />

      {/* --- DECOMPOSE GOAL SETUP DIALOG MODAL --- */}
      {showAtomizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-lg border border-rebel-500/20 bg-[#04040a] p-6 rounded-2xl shadow-2xl shadow-black/80 space-y-5">
            <button
              onClick={() => !isAtomizing && setShowAtomizeModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors disabled:opacity-40"
              disabled={isAtomizing}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rebel-500 to-purple-600 mx-auto flex items-center justify-center text-white shadow-md shadow-rebel-500/10">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="font-sans font-black text-lg text-white uppercase tracking-wider">
                Decompose New Objective
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                Enter your target. AI will break down your objective into sequential milestones, tasks, checklists, and Eisenhower sectors.
              </p>
            </div>

            {/* Quota Check Banner */}
            {userGoalsList.length >= userProfile.atomizationLimit && (
              <div className="p-3 border border-rust-500/30 bg-rust-500/10 rounded-xl text-rust-300 font-mono text-[11px] leading-relaxed flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rust-400" />
                  <span>Quota reached ({userGoalsList.length}/{userProfile.atomizationLimit} objectives).</span>
                </div>
                <button
                  onClick={() => {
                    setShowAtomizeModal(false);
                    setShowPaywallModal(true);
                  }}
                  className="px-2.5 py-1 rounded bg-rust-400 text-black font-bold text-[10px] uppercase shrink-0 hover:bg-rust-300 transition-colors"
                >
                  Upgrade
                </button>
              </div>
            )}

            {atomizeError && (
              <div className="p-3 border border-rust-500/20 bg-rust-500/10 rounded-xl text-rust-400 font-mono text-[10px] leading-relaxed flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 shrink-0 text-rust-400" />
                <span>{atomizeError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-rebel-400 uppercase tracking-widest mb-1.5">
                  Target Objective Title
                </label>
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="e.g., Run a full marathon, Learn Web3 development, Launch SaaS..."
                  disabled={isAtomizing}
                  className="w-full bg-black/40 border border-rebel-500/20 focus:border-rebel-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-700 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-rebel-400 uppercase tracking-widest mb-1.5">
                  Context, Resource Details & Constraints
                </label>
                <textarea
                  value={newGoalDesc}
                  onChange={(e) => setNewGoalDesc(e.target.value)}
                  placeholder="Include any critical parameters: timeline limits, tech preferences, your active skills, or custom constraints..."
                  rows={3}
                  disabled={isAtomizing}
                  className="w-full bg-black/40 border border-rebel-500/20 focus:border-rebel-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-700 outline-none transition-all resize-none"
                />
              </div>

              {isAtomizing ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <span className="absolute border-2 border-rebel-500/20 w-full h-full rounded-full" />
                    <span className="absolute border-2 border-t-rebel-400 w-full h-full rounded-full animate-spin" />
                    <Cpu className="w-5 h-5 text-rebel-400 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-mono text-rebel-400 uppercase tracking-widest animate-pulse">
                      ATOM COMPILING ROADMAP
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">
                      Assigning priorities, milestones, checklists, and Eisenhower grids
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleAtomizeGoal}
                  disabled={!newGoalTitle.trim() || userGoalsList.length >= userProfile.atomizationLimit}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-br from-rebel-500 to-purple-600 hover:from-rebel-400 hover:to-purple-500 text-white font-sans text-xs font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-rebel-500/10"
                >
                  ⚡ Execute Atomizer Pipeline
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
