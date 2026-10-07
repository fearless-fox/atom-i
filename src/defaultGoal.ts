/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Goal } from "./types";

/**
 * Fresh-state goal: a single instructional node. New (and logged-out)
 * visitors see exactly one node telling them how to start — no fake demo
 * data, no stale sessions.
 */
export const DEFAULT_GOAL: Goal = {
  id: "welcome-first-objective",
  title: "Atomize your first objective",
  description: `Welcome to ATOM-I, operator. Right now your command deck is a single node — waiting on you.

HOW TO START:
1. Hit the ATOMIZE button up top and describe any goal — big, small, chaotic, half-formed.
2. The engine shatters it into phases, atomic tasks, and micro-steps on the phase tree.
3. Double-click any node to mark it complete. Ask the AI coach whenever you're stuck.
4. Open the MATRIX to prioritize, the PLANNER to schedule, or HYPERFOCUS when it's time to execute.

Hit the GUIDE button up top if you want the full tour first.`,
  timeline: "",
  insight: "Every finished objective started as a single node.",
  encouragement: "Stop planning. Atomize.",
  resources: [],
  completed: false,
  progress: 0,
  phases: [],
};
