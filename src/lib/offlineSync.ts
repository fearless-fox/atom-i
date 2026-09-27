/**
 * Offline Cache & Background Sync Engine for ATOM-I
 * Caches mutations (goals, tasks, planner items) locally during network disconnects
 * and silently flushes them back to Firebase Firestore when connection re-establishes.
 */

import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Goal, PlannerTask } from "../types";

export interface PendingSyncItem {
  id: string;
  type: "goal" | "planner_task";
  data: any;
  timestamp: number;
  userId: string;
}

const STORAGE_KEY = "atom_i_offline_sync_queue";
const CACHED_GOAL_KEY = "atom_i_offline_cached_goal";

export class OfflineSyncManager {
  private getQueue(): PendingSyncItem[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveQueue(queue: PendingSyncItem[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn("[OfflineSync] Error saving queue to local storage:", e);
    }
  }

  public getPendingCount(): number {
    return this.getQueue().length;
  }

  /**
   * Cache Goal offline and enqueue for Firestore sync
   */
  public enqueueGoal(userId: string, goal: Goal): void {
    if (typeof window === "undefined") return;

    // Cache latest goal locally so user can always reload it even if browser is refreshed offline
    try {
      localStorage.setItem(CACHED_GOAL_KEY, JSON.stringify(goal));
    } catch {}

    const queue = this.getQueue();
    // Replace any existing pending goal sync with latest state to avoid redundant flushes
    const filtered = queue.filter((item) => !(item.type === "goal" && item.id === goal.id));
    filtered.push({
      id: goal.id,
      type: "goal",
      data: goal,
      timestamp: Date.now(),
      userId,
    });
    this.saveQueue(filtered);
  }

  /**
   * Cache Planner Task offline and enqueue for Firestore sync
   */
  public enqueuePlannerTask(userId: string, task: PlannerTask): void {
    const queue = this.getQueue();
    const filtered = queue.filter((item) => !(item.type === "planner_task" && item.id === task.id));
    filtered.push({
      id: task.id,
      type: "planner_task",
      data: task,
      timestamp: Date.now(),
      userId,
    });
    this.saveQueue(filtered);
  }

  /**
   * Get cached offline goal if any
   */
  public getCachedOfflineGoal(): Goal | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(CACHED_GOAL_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Silently sync all queued mutations back to Firebase Firestore
   */
  public async flushQueue(): Promise<{ syncedCount: number; errors: number }> {
    const queue = this.getQueue();
    if (queue.length === 0) return { syncedCount: 0, errors: 0 };

    let syncedCount = 0;
    let errors = 0;
    const remaining: PendingSyncItem[] = [];

    for (const item of queue) {
      try {
        if (item.type === "goal") {
          const goalData: Goal = item.data;
          const payload = {
            id: goalData.id,
            userId: item.userId,
            title: goalData.title,
            description: goalData.description,
            timeline: goalData.timeline || "",
            insight: goalData.insight || "",
            encouragement: goalData.encouragement || "",
            completed: goalData.completed,
            progress: goalData.progress,
            phases: goalData.phases,
            updatedAt: new Date(item.timestamp).toISOString(),
          };

          // Sync to root atomizations collection and user goals subcollection
          await setDoc(doc(db, "atomizations", goalData.id), payload, { merge: true });
          await setDoc(doc(db, "users", item.userId, "goals", goalData.id), payload, { merge: true });
          syncedCount++;
        } else if (item.type === "planner_task") {
          const taskData: PlannerTask = item.data;
          const taskRef = doc(db, "users", item.userId, "planner", taskData.id);
          await setDoc(
            taskRef,
            {
              id: taskData.id,
              userId: item.userId,
              title: taskData.title,
              description: taskData.description || "",
              date: taskData.date,
              startHour: taskData.startHour,
              endHour: taskData.endHour,
              priority: taskData.priority,
              category: taskData.category,
              completed: taskData.completed,
              sourceTaskId: taskData.sourceTaskId || null,
              updatedAt: new Date(item.timestamp).toISOString(),
            },
            { merge: true }
          );
          syncedCount++;
        }
      } catch (err) {
        console.warn(`[OfflineSync] Failed to sync pending item ${item.id}:`, err);
        errors++;
        remaining.push(item);
      }
    }

    this.saveQueue(remaining);
    return { syncedCount, errors };
  }
}

export const offlineSyncManager = new OfflineSyncManager();
