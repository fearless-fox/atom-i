/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Goal } from "./types";

export const DEFAULT_GOAL: Goal = {
  id: "saas-launch",
  title: "Compile High-Traffic SaaS Platform",
  description: "An advanced, cloud-native full-stack software application optimized for low cold-starts and high request throughput, integrated with OAuth and secure databases.",
  timeline: "10 weeks",
  insight: "Don't build custom auth or billing pipelines on day one. Proxy external robust adapters to maintain strict velocity.",
  encouragement: "The matrix of execution requires perfect alignment. Move fast, ship atomic endpoints, and monitor optimization bottlenecks.",
  resources: [
    "Vite & React (V4 compilation engine)",
    "Express & Node container services",
    "Tailwind HUD utility layouts"
  ],
  completed: false,
  progress: 15,
  phases: [
    {
      id: "phase-1-setup",
      title: "Phase 1: Architecture & Workspace Setup",
      description: "Initialize full-stack environments, docker configurations, and security authorization boundaries.",
      duration: "2 weeks",
      priority: "Critical",
      milestones: ["Local server compiling", "OAuth boundary configured"],
      completed: true,
      tasks: [
        {
          id: "task-1-setup-monorepo",
          title: "Initialize Workspace & Compilers",
          description: "Establish tsconfig mappings, configure tailwind utilities, and verify hot-reload server configurations.",
          duration: "3 days",
          priority: "High",
          completed: true,
          urgency: "Urgent",
          importance: "Important",
          tools: ["Node.js", "TypeScript", "Vite"],
          deliverable: "Standard compiled package running on port 3000.",
          atoms: [
            { id: "atom-1-npm", title: "Run npm initialization", completed: true },
            { id: "atom-1-tsconfig", title: "Map compiler directives", completed: true }
          ]
        },
        {
          id: "task-2-oauth-gateway",
          title: "Configure Express Gateway Proxy",
          description: "Establish backend Express proxy to protect sensitive API keys and route request traffic safely.",
          duration: "4 days",
          priority: "Critical",
          completed: true,
          urgency: "Urgent",
          importance: "Important",
          tools: ["Express", "Dotenv"],
          deliverable: "Secure server listening on 0.0.0.0 with lazy key loading.",
          atoms: [
            { id: "atom-2-routes", title: "Construct proxy endpoints", completed: true },
            { id: "atom-2-cors", title: "Mount security headers", completed: true }
          ]
        },
        {
          id: "task-3-mockup-wireframes",
          title: "Draft HUD Layout Mockups",
          description: "Compile visual mockup vectors representing the core telemetry cockpit and operations dashboard.",
          duration: "4 days",
          priority: "Medium",
          completed: false,
          urgency: "Not Urgent",
          importance: "Not Important",
          tools: ["Figma", "Excalidraw"],
          deliverable: "Interactive design schemas with a sleek high-contrast visual grid.",
          atoms: [
            { id: "atom-3-layout", title: "Wireframe layout bounds", completed: false },
            { id: "atom-3-palette", title: "Confirm visual palette vectors", completed: false }
          ]
        }
      ]
    },
    {
      id: "phase-2-core",
      title: "Phase 2: Core Service Implementation",
      description: "Assemble primary functional models, analytical handlers, and real-time visualization widgets.",
      duration: "3 weeks",
      priority: "High",
      milestones: ["Database persistence live", "Interactive canvas rendering"],
      completed: false,
      tasks: [
        {
          id: "task-4-database-schema",
          title: "Establish Relational Schema Models",
          description: "Create table definitions representing users, tasks, logs, and state events using declarative descriptors.",
          duration: "4 days",
          priority: "Critical",
          completed: false,
          urgency: "Not Urgent",
          importance: "Important",
          tools: ["PostgreSQL", "Drizzle ORM"],
          deliverable: "Compiled migration files ready for container syncing.",
          atoms: [
            { id: "atom-4-define", title: "Draft schema mapping definitions", completed: false },
            { id: "atom-4-mig", title: "Test local sync iterations", completed: false }
          ]
        },
        {
          id: "task-5-canvas-mindmap",
          title: "Program Particle Mindmap Vector",
          description: "Develop high-performance 2D canvas mindmap with drag-to-pan, scroll-to-zoom, and scrolling laser pulse coordinates.",
          duration: "6 days",
          priority: "High",
          completed: false,
          urgency: "Urgent",
          importance: "Important",
          tools: ["HTML5 Canvas", "React Hooks"],
          deliverable: "Responsive mindmap rendering 120 FPS fluid movements.",
          atoms: [
            { id: "atom-5-render", title: "Code responsive canvas grid layout", completed: false },
            { id: "atom-5-pulse", title: "Animate vector laser pulses", completed: false }
          ]
        },
        {
          id: "task-6-feedback-loops",
          title: "Mount AI Feedback Pipeline",
          description: "Integrate chat endpoints with the Gemini API. Populate systematic instructions for the Coach agent.",
          duration: "5 days",
          priority: "High",
          completed: false,
          urgency: "Urgent",
          importance: "Important",
          tools: ["@google/genai SDK", "Express endpoints"],
          deliverable: "Secure AI chatbot generating targeted tactical strategy plans.",
          atoms: [
            { id: "atom-6-endpoint", title: "Establish /api/coach route", completed: false },
            { id: "atom-6-prompt", title: "Fine-tune system instructions", completed: false }
          ]
        }
      ]
    },
    {
      id: "phase-3-optimize",
      title: "Phase 3: Telemetry & Shipping",
      description: "Optimize runtime compression, bundle code splits, and execute container deployment runs.",
      duration: "2 weeks",
      priority: "Medium",
      milestones: ["Zero-error build compiled", "Deployed onto secure ingress container"],
      completed: false,
      tasks: [
        {
          id: "task-7-minify-performance",
          title: "Audit Performance & Code splits",
          description: "Minimize visual latency by bundling dynamic imports, cache headers, and asset asset pipelines.",
          duration: "4 days",
          priority: "Medium",
          completed: false,
          urgency: "Not Urgent",
          importance: "Important",
          tools: ["Lighthouse", "Vite Analyzer"],
          deliverable: "Performance scorecard exceeding 95 on core metrics.",
          atoms: [
            { id: "atom-7-chunk", title: "Verify compiler chunks", completed: false },
            { id: "atom-7-cache", title: "Configure response headers", completed: false }
          ]
        },
        {
          id: "task-8-cloudrun-deploy",
          title: "Execute Cloud Run Deployment",
          description: "Package full-stack server inside docker container, push to container registries, and verify ingress port routing.",
          duration: "3 days",
          priority: "High",
          completed: false,
          urgency: "Urgent",
          importance: "Important",
          tools: ["GCP Cloud Run", "Docker"],
          deliverable: "Live web application accessible under public URL.",
          atoms: [
            { id: "atom-8-dockerfile", title: "Write multi-stage Dockerfile", completed: false },
            { id: "atom-8-ingress", title: "Bind server port to 3000", completed: false }
          ]
        },
        {
          id: "task-9-polish-telemetry",
          title: "Verify Security Boundaries",
          description: "Perform simulated penetration logs, audit route validation schemas, and rotate environment credentials.",
          duration: "4 days",
          priority: "Low",
          completed: false,
          urgency: "Not Urgent",
          importance: "Not Important",
          tools: ["OWASP scan", "SonarQube"],
          deliverable: "Pruned workspace with zero unencrypted secrets.",
          atoms: [
            { id: "atom-9-scan", title: "Review third-party imports", completed: false },
            { id: "atom-9-clean", title: "Verify .env.example listings", completed: false }
          ]
        }
      ]
    }
  ]
};
