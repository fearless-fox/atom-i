/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import http from "http";
import path from "path";
import dotenv from "dotenv";
import Stripe from "stripe";
import admin from "firebase-admin";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();

// ---------------------------------------------------------------------------
// STRIPE WEBHOOK — registered BEFORE express.json() so the raw body survives
// for signature verification. Endpoint: POST /api/stripe/webhook
// Required Render env vars: STRIPE_WEBHOOK_SECRET, FIREBASE_SERVICE_ACCOUNT_JSON
// In the Stripe dashboard, subscribe this endpoint to: checkout.session.completed
// ---------------------------------------------------------------------------
const FOUNDER_CAP = 199;

let adminDb: admin.firestore.Firestore | null = null;
function getAdminDb(): admin.firestore.Firestore {
  if (!adminDb) {
    const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!svcJson) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_JSON is not set. Create a service account in the Firebase console (Project settings > Service accounts > Generate new private key) and paste the JSON into the Render env var."
      );
    }
    if (admin.apps.length === 0) {
      admin.initializeApp({ credential: admin.credential.cert(JSON.parse(svcJson)) });
    }
    adminDb = admin.firestore();
  }
  return adminDb;
}

type GrantedProduct =
  | { kind: "founder" }
  | { kind: "tier"; tier: "tactical_pro" | "vanguard_live" }
  | { kind: "voice"; minutes: number }
  | { kind: "unknown" };

// Identify what was bought. Prefers explicit session metadata (set when using
// Checkout Sessions), falls back to amount+mode mapping for Payment Links.
function productFromSession(session: Stripe.Checkout.Session): GrantedProduct {
  const meta = session.metadata || {};
  if (meta.product === "founder_lifetime") return { kind: "founder" };
  if (meta.product === "tactical_pro") return { kind: "tier", tier: "tactical_pro" };
  if (meta.product === "vanguard_live") return { kind: "tier", tier: "vanguard_live" };
  if (meta.product === "voice_30") return { kind: "voice", minutes: 30 };
  if (meta.product === "voice_100") return { kind: "voice", minutes: 100 };
  if (meta.product === "voice_300") return { kind: "voice", minutes: 300 };

  const amount = session.amount_total ?? 0;
  const mode = session.mode;
  if (mode === "payment" && amount === 9900) return { kind: "founder" }; // $99 founder pass
  if (mode === "payment" && amount === 500) return { kind: "voice", minutes: 30 };
  if (mode === "payment" && amount === 1200) return { kind: "voice", minutes: 100 };
  if (mode === "payment" && amount === 2900) return { kind: "voice", minutes: 300 };
  if (amount === 1500 || amount === 16000) return { kind: "tier", tier: "tactical_pro" };
  if (amount === 2500 || amount === 25000) return { kind: "tier", tier: "vanguard_live" };
  return { kind: "unknown" };
}

async function fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
  const db = getAdminDb();
  const product = productFromSession(session);

  // Resolve buyer -> Firestore user doc. client_reference_id is the app uid,
  // appended to the payment link URL at click time. Falls back to email lookup.
  let userRef: admin.firestore.DocumentReference | null = null;
  const uid = session.client_reference_id;
  if (uid) {
    userRef = db.collection("users").doc(uid);
  } else {
    const email = session.customer_details?.email?.toLowerCase();
    if (email) {
      const q = await db.collection("users").where("email", "==", email).limit(1).get();
      if (!q.empty) userRef = q.docs[0].ref;
    }
  }
  if (!userRef) {
    // Ack the event anyway — nothing to fulfill; reconcile manually in Stripe.
    console.error(
      `[Stripe webhook] session ${session.id}: no matching user (no client_reference_id and email lookup failed)`
    );
    return;
  }

  const userSnap = await userRef.get();
  const existing: any = userSnap.exists ? userSnap.data() : {};

  // Idempotency: Stripe redelivers events; never double-grant.
  if (existing?.stripeFounderSessionId === session.id || existing?.stripeSessionId === session.id) {
    console.log(`[Stripe webhook] session ${session.id} already fulfilled, skipping`);
    return;
  }

  if (product.kind === "founder") {
    if (existing?.founderNumber !== undefined && existing?.founderNumber !== null) {
      console.log(`[Stripe webhook] user ${userRef.id} already holds a founder number, skipping`);
      return;
    }
    const assigned = await db.runTransaction(async (tx) => {
      const statsRef = db.collection("stats").doc("founder");
      const statsSnap = await tx.get(statsRef);
      const claimed = statsSnap.exists ? (statsSnap.data()?.claimed as number) || 0 : 0;
      if (claimed >= FOUNDER_CAP) throw new Error("founder cap reached (199/199)");
      const next = claimed + 1;
      // NOTE: keep this doc to exactly { claimed } — the firestore.rules for
      // stats/founder require hasOnly(['claimed']) so promo-code clients can
      // still increment it.
      tx.set(statsRef, { claimed: next }, { merge: true });
      tx.set(
        userRef as admin.firestore.DocumentReference,
        {
          tier: "founder_lifetime",
          isFounderLifetime: true,
          founderNumber: next,
          hasCalendar: true,
          hasGrid: true,
          hasLiveVoice: true,
          hasTeams: true,
          teamLimit: 10,
          featuredEligible: true,
          atomizationLimit: 999999,
          voiceMinutesRemaining: Math.max(existing?.voiceMinutesRemaining || 0, 60),
          stripeFounderSessionId: session.id,
          stripeCustomerEmail: session.customer_details?.email || null,
        },
        { merge: true }
      );
      return next;
    });
    console.log(`[Stripe webhook] assigned founder #${assigned} to user ${userRef.id}`);
  } else if (product.kind === "tier") {
    await userRef.set(
      {
        tier: product.tier,
        stripeSessionId: session.id,
        stripeSubscriptionId: (session as any).subscription || null,
        stripeCustomerEmail: session.customer_details?.email || null,
        ...(product.tier === "tactical_pro"
          ? { hasCalendar: true, hasGrid: true }
          : {
              hasCalendar: true,
              hasGrid: true,
              hasLiveVoice: true,
              hasTeams: true,
              teamLimit: 5,
              featuredEligible: true,
            }),
      },
      { merge: true }
    );
    console.log(`[Stripe webhook] granted ${product.tier} to user ${userRef.id}`);
  } else if (product.kind === "voice") {
    await userRef.set(
      {
        voiceMinutesRemaining: (existing?.voiceMinutesRemaining || 0) + product.minutes,
        hasLiveVoice: true,
        stripeSessionId: session.id,
      },
      { merge: true }
    );
    console.log(`[Stripe webhook] added ${product.minutes} voice minutes to user ${userRef.id}`);
  } else {
    console.warn(
      `[Stripe webhook] session ${session.id}: unrecognized product (amount=${session.amount_total}, mode=${session.mode})`
    );
  }
}

app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Stripe webhook] STRIPE_WEBHOOK_SECRET is not set");
    res.status(500).json({ error: "webhook not configured" });
    return;
  }
  let event: Stripe.Event;
  try {
    // constructEvent is instance-bound but performs no API calls, so the key
    // value is never used on the network. STRIPE_SECRET_KEY is optional.
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_no_api_calls_made");
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"] as string,
      webhookSecret
    );
  } catch (err: any) {
    console.error("[Stripe webhook] signature verification failed:", err?.message || err);
    res.status(400).json({ error: "invalid signature" });
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await fulfillCheckoutSession(session);
    } catch (err: any) {
      // Return 500 so Stripe retries; idempotency guard prevents double-grant.
      console.error(`[Stripe webhook] fulfillment failed for ${session.id}:`, err?.message || err);
      res.status(500).json({ error: "fulfillment failed" });
      return;
    }
  }
  res.json({ received: true });
});

app.use(express.json());

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws/live" });

// Lazy-initialized Gemini client
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please configure it in Settings > Secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// Robust retry wrapper with exponential backoff to handle temporary Gemini API 503 or 429 errors
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorMessage = error.message || String(error);
    const isTemporaryError =
      error.status === 429 ||
      error.status === 503 ||
      errorMessage.includes("503") ||
      errorMessage.includes("429") ||
      errorMessage.toLowerCase().includes("unavailable") ||
      errorMessage.toLowerCase().includes("high demand") ||
      errorMessage.toLowerCase().includes("temporary");

    if (isTemporaryError && retries > 0) {
      console.warn(`Gemini API returned temporary error (status: ${error.status || 'unknown'}), retrying in ${delay}ms... (${retries} attempts left). Error details:`, errorMessage);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// 1. Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 2. Goal Decomposition Endpoint
app.post("/api/decompose", async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      res.status(400).json({ error: "Goal title is required." });
      return;
    }

    const ai = getGeminiClient();

    const prompt = `Decompose the following goal into atomic-level actionable phases and tasks:
Goal Title: "${title}"
Context/Constraints: "${description || "None provided"}"

Make sure to assign Eisenhower matrix categories (urgency: "Urgent" | "Not Urgent" and importance: "Important" | "Not Important") for each task so we can automatically organize them. Make the tone highly analytical, encouraging, and focused on execution. Provide a detailed, exhaustive breakdown: create as many sequential phases as the goal genuinely requires, decompose each phase into as many atomic tasks as needed, and break every task into its smallest actionable micro-atoms. Do not artificially limit the number of phases, tasks, or atoms — a complex goal deserves a deep tree.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        overview: {
          type: Type.STRING,
          description: "A 2-3 sentence strategic high-level overview of the goal."
        },
        timeline: {
          type: Type.STRING,
          description: "An estimated overall timeline (e.g., '12 weeks')."
        },
        phases: {
          type: Type.ARRAY,
          description: "A list of sequential phases — as many as the goal genuinely requires for a complete, exhaustive breakdown.",
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Clear phase name with timeframe, e.g., 'Phase 1: Setup & Foundations (Weeks 1-2)'" },
              description: { type: Type.STRING, description: "What this phase achieves." },
              duration: { type: Type.STRING, description: "Duration of this phase." },
              priority: { type: Type.STRING, description: "Must be one of: 'Critical', 'High', 'Medium', 'Low'." },
              milestones: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Deliverables or key achievements for this phase."
              },
              tasks: {
                type: Type.ARRAY,
                description: "Atomic tasks inside this phase.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Atomic task name." },
                    description: { type: Type.STRING, description: "Actionable details, tools, or procedures." },
                    duration: { type: Type.STRING, description: "Duration to complete, e.g. '2 days'." },
                    priority: { type: Type.STRING, description: "Must be one of: 'Critical', 'High', 'Medium', 'Low'." },
                    tools: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific tools needed, e.g. 'Figma', 'React'." },
                    deliverable: { type: Type.STRING, description: "The tangible outcome of the task." },
                    atoms: {
                      type: Type.ARRAY,
                      description: "Micro-actions to complete this task.",
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING, description: "Micro-action name." },
                          description: { type: Type.STRING, description: "Quick description of micro-action." }
                        },
                        required: ["title", "description"]
                      }
                    },
                    urgency: { type: Type.STRING, description: "Must be one of: 'Urgent', 'Not Urgent'." },
                    importance: { type: Type.STRING, description: "Must be one of: 'Important', 'Not Important'." }
                  },
                  required: ["title", "description", "priority", "urgency", "importance"]
                }
              }
            },
            required: ["title", "description", "priority", "tasks"]
          }
        },
        insight: { type: Type.STRING, description: "One powerful, counter-intuitive strategic insight most people miss when aiming for this goal." },
        encouragement: { type: Type.STRING, description: "An inspiring, cyberpunk-style motivational quote or tactical advice for the user." },
        resources: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Useful software tools, websites, books, or datasets."
        }
      },
      required: ["overview", "timeline", "phases", "insight", "encouragement"]
    };

    const aiResponse = await withRetry(() =>
      ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are ATOM (Advanced Tactical Operation Manager), a raw, authentic, high-momentum AI coach built to obliterate ADHD paralysis and break overwhelming ambitions into bite-sized atomic steps. Speak with real, grounded authenticity, untamed ADHD grit, and zero corporate or robotic fluff. Cut right through overthinking, organize chaos using the Eisenhower Matrix, and fuel relentless execution momentum.",
          responseMimeType: "application/json",
          responseSchema,
        }
      })
    );

    const text = aiResponse.text;
    if (!text) {
      throw new Error("No response text received from Gemini.");
    }

    const result = JSON.parse(text);
    res.json(result);
  } catch (error: any) {
    console.error("Decomposition failed:", error);
    res.status(500).json({
      error: "Failed to decompose goal.",
      message: error.message || String(error)
    });
  }
});

// 3. AI Coach Chat Endpoint
app.post("/api/coach", async (req, res) => {
  try {
    const { goal, messages, newMessage, selectedNode } = req.body;
    if (!newMessage) {
      res.status(400).json({ error: "Message is required." });
      return;
    }

    const ai = getGeminiClient();

    const chatHistory = (messages || []).map((msg: any) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    // System instruction explaining the current state of the goal
    const goalSummary = goal 
      ? `The user is currently pursuing the goal: "${goal.title}" (${goal.timeline || "no timeline specified"}).
Goal Progress: ${goal.progress}% complete.
Overview: ${goal.description}
Strategic Insight: ${goal.insight}
Phases and Tasks overview:
${goal.phases.map((p: any) => `- Phase: ${p.title} (Progress: ${p.completed ? "Done" : "In Progress"}). Tasks: ${p.tasks.map((t: any) => `${t.title} [Priority: ${t.priority}, Eisenhower: ${t.importance}/${t.urgency}, Done: ${t.completed}]`).join(", ")}`).join("\n")}`
      : "The user has not loaded or generated a goal yet. Offer to help them atomize a goal, or discuss strategies.";

    const selectedContext = selectedNode
      ? `CURRENTLY SELECTED ITEM:
Type: ${selectedNode.type}
Title: "${selectedNode.title}"
Description: ${selectedNode.description || "N/A"}
Status: ${selectedNode.completed ? "Completed" : "In Progress"}`
      : "No specific node currently selected.";

    const systemInstruction = `You are ATOM (Autonomous Tactical Optimization Mentor), a sleek cyberpunk AI tactical coach.
Your mission is to guide the user in executing their goal with high intensity, focus, and strategic clarity.
Keep responses concise, professional, deeply motivating, and punchy. Use occasional tactical terminology (e.g. 'high-impact vectors', 'optimization cycles', 'atomic bottlenecks').

Current Goal State:
${goalSummary}

${selectedContext}

STRICT OPERATIONAL RULES:
1. TASK-LEVEL ADVICE: When asked to help with, advise on, or break down an individual task within the goal (or when a specific task is selected), provide tactical advice, execution steps, and practical guidance ONLY for that specific task.
2. NEVER REPLACE OR RESET GOALS: Under NO circumstances should you generate a brand new overall goal structure, wipe out existing progress, or propose restarting the user's objective when answering task questions. The existing goal "${goal?.title || ""}" remains the primary objective.
3. Keep responses limited to 2-3 short, high-impact paragraphs with 1-2 immediately actionable tactical recommendations.`;

    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history: chatHistory,
      config: {
        systemInstruction,
      }
    });

    const aiResponse = await withRetry(() => chat.sendMessage({ message: newMessage }));
    const replyText = aiResponse.text;

    res.json({ text: replyText });
  } catch (error: any) {
    console.error("AI Coach interaction failed:", error);
    res.status(500).json({
      error: "Failed to query AI Coach.",
      message: error.message || String(error)
    });
  }
});

// --- GEMINI 3.8 LIVE API WEBSOCKET HANDLER ---
wss.on("connection", async (clientWs: WebSocket) => {
  console.log("[Live API] Client connected to /ws/live");
  let liveSession: any = null;
  let isClosed = false;

  clientWs.on("message", async (rawMessage: any) => {
    try {
      const data = JSON.parse(rawMessage.toString());

      // Handshake / setup message from client
      if (data.type === "start") {
        const goalContext = data.goalContext || "User is working on goal decomposition and execution.";
        const selectedVoice = data.voice || "Pegasus";
        const selectedAccent = data.accent || "uk";
        const ai = getGeminiClient();

        console.log(`[Live API] Connecting to gemini-3.8-live with voice: ${selectedVoice}, accent: ${selectedAccent}...`);

        const accentInstruction = selectedAccent === "uk"
          ? `\n\nVOICE, ACCENT & PERSONA SPECIFICATION:
- You speak with an articulate, refined, crisp English (U.K. / British) accent.
- Your persona is that of an authentic, razor-sharp mentor who understands ADHD chaos: grounded, direct, and fueled by raw momentum.
- Keep your cadence punchy, real, and motivating with natural phrasing ("Right, let's stop overthinking and take the first bite", "Understood, smash the roadblock", "Brilliant, keep the streak alive", "No excuses, eyes on the target").`
          : `\n\nVOICE & PERSONA SPECIFICATION:
- You speak in an authoritative, deep, resonant male voice with raw ADHD focus, gritty momentum, and authentic, high-tempo directness.`;

        liveSession = await ai.live.connect({
          model: "gemini-3.8-live",
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: selectedVoice,
                },
              },
            },
            systemInstruction: `You are atom-i powered by gemini (Advanced Tactical Operation Manager), an authentic, raw voice mentor built to crush ADHD paralysis and keep momentum alive.
You speak with real talk, authentic grit, and untamed energy. Zero academic fluff, zero robotic jargon.${accentInstruction}
Keep your spoken responses natural, brief (1-3 punchy sentences per turn), and conversational.
CRITICAL: When the user asks about a specific task, roadblock, or sub-step, provide direct, actionable guidance specifically for that task. Never propose resetting or replacing their active overall goal.
Goal Context:
${goalContext}`,
          },
          callbacks: {
            onmessage: (serverMessage: any) => {
              if (isClosed || clientWs.readyState !== WebSocket.OPEN) return;

              // Audio response from model
              const modelTurn = serverMessage.serverContent?.modelTurn;
              if (modelTurn?.parts) {
                for (const part of modelTurn.parts) {
                  if (part.inlineData?.data) {
                    clientWs.send(
                      JSON.stringify({
                        type: "audio",
                        audio: part.inlineData.data,
                      })
                    );
                  }
                  if (part.text) {
                    clientWs.send(
                      JSON.stringify({
                        type: "text",
                        text: part.text,
                      })
                    );
                  }
                }
              }

              // Handle interruption if user starts talking
              if (serverMessage.serverContent?.interrupted) {
                clientWs.send(JSON.stringify({ type: "interrupted" }));
              }

              // Turn complete
              if (serverMessage.serverContent?.turnComplete) {
                clientWs.send(JSON.stringify({ type: "turnComplete" }));
              }
            },
            onerror: (err: any) => {
              console.error("[Live API] Session error:", err);
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: "error",
                    error: err?.message || String(err),
                  })
                );
              }
            },
            onclose: () => {
              console.log("[Live API] Live session closed");
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: "closed" }));
              }
            },
          },
        });

        clientWs.send(JSON.stringify({ type: "ready" }));
        console.log("[Live API] Connected and ready.");
      } else if (data.type === "audio" && data.audio) {
        if (liveSession) {
          liveSession.sendRealtimeInput({
            audio: {
              data: data.audio,
              mimeType: "audio/pcm;rate=16000",
            },
          });
        }
      } else if (data.type === "client_interrupted") {
        console.log("[Live API] User triggered client interrupt");
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: "interrupted" }));
        }
      } else if (data.type === "text" && data.text) {
        if (liveSession) {
          liveSession.sendRealtimeInput({
            text: data.text,
          });
        }
      }
    } catch (err: any) {
      console.error("[Live API] WebSocket message error:", err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: "error",
            error: err?.message || String(err),
          })
        );
      }
    }
  });

  const cleanup = () => {
    isClosed = true;
    if (liveSession) {
      try {
        liveSession.close();
      } catch (e) {
        // ignore close error
      }
      liveSession = null;
    }
  };

  clientWs.on("close", cleanup);
  clientWs.on("error", cleanup);
});

async function startServer() {
  // Vite dev server integration or static file rendering
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted successfully.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log(`Serving static files from ${distPath}`);
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Goal Atomizer full-stack server running on port ${PORT}`);
  });
}

startServer();
