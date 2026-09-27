/**
 * Puter.ai Zero-Cost AI Integration
 * Provides completely free, client-side AI chat and goal decomposition
 * without requiring server API keys, credit cards, or billing.
 */

declare global {
  interface Window {
    puter?: {
      ai?: {
        chat: (prompt: any, options?: any) => Promise<any>;
      };
      auth?: {
        isSignedIn: () => boolean;
        signIn: () => Promise<any>;
        getUser: () => Promise<any>;
      };
    };
  }
}

export function isPuterAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.puter !== "undefined" && !!window.puter.ai;
}

/**
 * Perform free AI chat using Puter.ai
 */
export async function queryPuterChat(
  message: string,
  systemContext?: string
): Promise<string> {
  if (!isPuterAvailable()) {
    throw new Error("Puter.js library is not yet loaded in window.");
  }

  const fullPrompt = systemContext
    ? `${systemContext}\n\nUser Query: ${message}`
    : message;

  const response = await window.puter!.ai!.chat(fullPrompt);

  if (typeof response === "string") return response;
  if (response?.message?.content) return response.message.content;
  if (response?.text) return response.text;
  return JSON.stringify(response);
}

/**
 * Perform free Goal Decomposition using Puter.ai
 */
export async function decomposeGoalWithPuter(
  title: string,
  description: string
): Promise<any> {
  if (!isPuterAvailable()) {
    throw new Error("Puter.ai is not available in the current browser session.");
  }

  const prompt = `You are A.T.O.M. (Autonomous Tactical Optimization Mentor), an elite cyberpunk task decomposition engine.
Deconstruct the objective: "${title}"
Context & details: "${description}"

You must output a single valid JSON object strictly matching this schema with no extra surrounding prose:
{
  "title": "${title}",
  "description": "${description || "Deconstructed tactical objective"}",
  "timeline": "e.g. 6 weeks",
  "insight": "high-impact strategic insight",
  "encouragement": "tactical directive",
  "resources": ["Resource 1", "Resource 2"],
  "phases": [
    {
      "id": "p1",
      "title": "Phase 1: Setup & Environment Initialization",
      "description": "Establish workspace and calibrate baseline instruments",
      "duration": "2 weeks",
      "priority": "Critical",
      "milestones": ["Milestone 1 reached"],
      "tasks": [
        {
          "id": "t1-1",
          "title": "Configure Primary Workstation",
          "description": "Setup core directory and compiler toolset",
          "duration": "3 days",
          "priority": "High",
          "urgency": "Urgent",
          "importance": "Important",
          "tools": ["Terminal", "Config"],
          "deliverable": "Operational workspace",
          "atoms": [
            { "id": "a1-1", "title": "Check dependencies" },
            { "id": "a1-2", "title": "Create configuration file" }
          ]
        }
      ]
    },
    {
      "id": "p2",
      "title": "Phase 2: Core Execution & Build",
      "description": "Construct primary deliverables and test core logic",
      "duration": "3 weeks",
      "priority": "High",
      "milestones": ["Core deliverable verified"],
      "tasks": [
        {
          "id": "t2-1",
          "title": "Implement Critical Modules",
          "description": "Code and verify primary functional pathways",
          "duration": "5 days",
          "priority": "Critical",
          "urgency": "Urgent",
          "importance": "Important",
          "tools": ["Editor", "Debugger"],
          "deliverable": "Passing build",
          "atoms": [
            { "id": "a2-1", "title": "Build prototype" },
            { "id": "a2-2", "title": "Run test benchmarks" }
          ]
        }
      ]
    }
  ]
}
Return ONLY valid JSON.`;

  const response = await window.puter!.ai!.chat(prompt);
  const text =
    typeof response === "string"
      ? response
      : response?.message?.content || response?.text || JSON.stringify(response);

  // Extract JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Puter.ai response did not contain structured JSON.");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed;
}
