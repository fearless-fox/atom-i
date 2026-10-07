/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { Goal, Phase, Task } from "../types";
import { cyberAudio } from "../lib/cyberAudio";

interface TaskMapProps {
  goal: Goal;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string, type: "goal" | "phase" | "task") => void;
  onToggleComplete: (nodeId: string, type: "goal" | "phase" | "task") => void;
}

interface RenderNode {
  id: string;
  parentId: string | null;
  title: string;
  type: "goal" | "phase" | "task";
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  radius: number;
  color: string;
  completed: boolean;
  progress?: number;
  priority?: "Critical" | "High" | "Medium" | "Low";
  index?: number;
  item: Goal | Phase | Task;
}

interface RenderLink {
  fromId: string;
  toId: string;
  color: string;
  completed: boolean;
}

export default function TaskMap({
  goal,
  selectedNodeId,
  onSelectNode,
  onToggleComplete,
}: TaskMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pan and Zoom states
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<RenderNode | null>(null);

  // Keep a reference to renderNodes so event handlers can read the latest values
  const renderNodesRef = useRef<RenderNode[]>([]);
  const lastTimeRef = useRef<number>(0);
  // Slowed-down pulse counter for calm, rhythmic breathing
  const pulseRef = useRef<number>(0);
  const panInitializedRef = useRef<string | null>(null);
  // Latest pan/zoom for zoom-pivot math (refs stay fresh inside handlers)
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1.0);
  panRef.current = pan;
  zoomRef.current = zoom;

  // Pre-calculate/animate node coordinates
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Reset pan/zoom when a new goal is loaded
    setPan({ x: canvas.width / 2, y: canvas.height / 2 });
    setZoom(0.8);
  }, [goal.id]);

  // Handle canvas sizing and interactive rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const resizeCanvas = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initial positioning of pan - guarded to prevent infinite loops
    if (panInitializedRef.current !== goal.id && canvas.width > 0) {
      setPan({ x: canvas.width / 2, y: canvas.height / 2 });
      panInitializedRef.current = goal.id;
    }

    // Build hierarchical nodes structure
    const buildGraph = () => {
      const nodesList: RenderNode[] = [];
      const linksList: RenderLink[] = [];

      // High-tech vibrant palette
      const colors = ["#A78BFA", "#FF4D1C", "#00ff88", "#ffbe0b", "#9d4edd", "#4cc9f0"];

      // 1. Root Goal Node (Reactor Core / Master Atom)
      const centerNode: RenderNode = {
        id: "root",
        parentId: null,
        title: goal.title,
        type: "goal",
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        radius: 38,
        color: "#7C3AED",
        completed: goal.completed,
        progress: goal.progress,
        item: goal,
      };
      nodesList.push(centerNode);

      // 2. Phase Nodes (Orbital Quantum Modules)
      const phaseCount = goal.phases.length;
      const phaseDist = 210;

      goal.phases.forEach((phase, pIdx) => {
        const phaseAngle = (pIdx / phaseCount) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(phaseAngle) * phaseDist;
        const py = Math.sin(phaseAngle) * phaseDist;
        const pColor = colors[pIdx % colors.length];

        const pCompletedCount = phase.tasks.filter((t) => t.completed).length;
        const pProgress = phase.tasks.length ? Math.round((pCompletedCount / phase.tasks.length) * 100) : 0;

        const phaseNode: RenderNode = {
          id: phase.id,
          parentId: "root",
          title: phase.title,
          type: "phase",
          x: px,
          y: py,
          targetX: px,
          targetY: py,
          radius: 26,
          color: pColor,
          completed: phase.completed,
          progress: pProgress,
          priority: phase.priority,
          index: pIdx + 1,
          item: phase,
        };
        nodesList.push(phaseNode);
        linksList.push({
          fromId: "root",
          toId: phase.id,
          color: pColor,
          completed: phase.completed,
        });

        // 3. Task Nodes (Atomic Sub-Units)
        const taskCount = phase.tasks.length;
        const taskDist = 95;

        phase.tasks.forEach((task, tIdx) => {
          // Spread tasks around their parent phase
          const taskAngle = phaseAngle + ((tIdx - (taskCount - 1) / 2) * 0.48);
          const tx = px + Math.cos(taskAngle) * taskDist;
          const ty = py + Math.sin(taskAngle) * taskDist;

          const taskNode: RenderNode = {
            id: task.id,
            parentId: phase.id,
            title: task.title,
            type: "task",
            x: tx,
            y: ty,
            targetX: tx,
            targetY: ty,
            radius: 16,
            color: pColor,
            completed: task.completed,
            priority: task.priority,
            index: tIdx + 1,
            item: task,
          };
          nodesList.push(taskNode);
          linksList.push({
            fromId: phase.id,
            toId: task.id,
            color: pColor,
            completed: task.completed,
          });
        });
      });

      return { nodes: nodesList, links: linksList };
    };

    const { nodes: initNodes, links } = buildGraph();
    // Smoothly transition node coordinates
    renderNodesRef.current = initNodes.map(n => {
      // Find existing coordinates to prevent jump cuts
      const prev = renderNodesRef.current.find(p => p.id === n.id);
      return prev ? { ...n, x: prev.x, y: prev.y } : n;
    });

    const runRenderLoop = (time: number) => {
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;
      
      // Calmed down pulse progression: ~0.9 rad/s (slow, rhythmic cyberpunk breathing)
      pulseRef.current += dt * 0.9;
      const pulseTime = pulseRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Interpolate Node positions for smooth animation
      renderNodesRef.current.forEach((n) => {
        n.x += (n.targetX - n.x) * 0.1;
        n.y += (n.targetY - n.y) * 0.1;
      });

      ctx.save();
      // Apply pan and zoom
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // 1. Draw connections (high-tech laser conduits)
      links.forEach((link) => {
        const fromNode = renderNodesRef.current.find((n) => n.id === link.fromId);
        const toNode = renderNodesRef.current.find((n) => n.id === link.toId);

        if (fromNode && toNode) {
          const dx = toNode.x - fromNode.x;
          const dy = toNode.y - fromNode.y;
          const dist = Math.hypot(dx, dy);

          // Outer diffuse glow line
          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          ctx.strokeStyle = link.completed ? "rgba(0, 255, 136, 0.2)" : `${link.color}25`;
          ctx.lineWidth = link.completed ? 3.5 : 2.5;
          ctx.stroke();

          // Inner sharp laser core line
          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          ctx.strokeStyle = link.completed ? "rgba(0, 255, 136, 0.7)" : `${link.color}55`;
          ctx.lineWidth = link.completed ? 1.5 : 1.0;
          ctx.stroke();

          // Calmed down energy photon packets gliding down the link
          // 2 smooth flowing pulses with comet trails
          const pulseOffsets = [0, 0.5];
          pulseOffsets.forEach((offset) => {
            const progress = ((pulseTime * 0.35 + offset) % 1);
            const px = fromNode.x + dx * progress;
            const py = fromNode.y + dy * progress;

            // Packet Comet Trail
            const trailLen = Math.min(18, dist * 0.2);
            const normX = dist > 0 ? dx / dist : 0;
            const normY = dist > 0 ? dy / dist : 0;

            const grad = ctx.createLinearGradient(
              px - normX * trailLen,
              py - normY * trailLen,
              px,
              py
            );
            grad.addColorStop(0, "rgba(0,0,0,0)");
            grad.addColorStop(1, link.completed ? "#00ff88" : link.color);

            ctx.beginPath();
            ctx.moveTo(px - normX * trailLen, py - normY * trailLen);
            ctx.lineTo(px, py);
            ctx.strokeStyle = grad;
            ctx.lineWidth = link.completed ? 2.5 : 1.8;
            ctx.stroke();

            // Packet head
            ctx.beginPath();
            ctx.arc(px, py, link.completed ? 2.5 : 2.0, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.shadowBlur = 8;
            ctx.shadowColor = link.completed ? "#00ff88" : link.color;
            ctx.fill();
            ctx.shadowBlur = 0;
          });
        }
      });

      // 2. Draw nodes with modern atom-i styling
      renderNodesRef.current.forEach((node) => {
        const isSelected = selectedNodeId === node.id;
        const isHovered = hoveredNode?.id === node.id;

        ctx.save();
        ctx.translate(node.x, node.y);

        // Slow calm breathing oscillation: [0, 1]
        const breath = (Math.sin(pulseTime * 1.6) + 1) / 2;

        // Radiant Outward Pulse Wave ("nodePulse" effect)
        // Radiates outwards periodically from active, selected, or hovered nodes
        const pulseCycle = (pulseTime * 0.45) % 1;
        const waveRadius = node.radius + pulseCycle * 22;
        const waveAlpha = Math.max(0, (1 - pulseCycle) * (isSelected ? 0.6 : isHovered ? 0.4 : 0.2));
        
        ctx.beginPath();
        ctx.arc(0, 0, waveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = node.completed ? `rgba(0, 255, 136, ${waveAlpha})` : `${node.color}${Math.floor(waveAlpha * 255).toString(16).padStart(2, "0")}`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // High-Tech Targeting Reticle Brackets for Selected or Hovered
        if (isSelected || isHovered) {
          const reticleRadius = node.radius + 12 + breath * 2;
          const bracketLen = 8;
          const reticleColor = isSelected ? "#7C3AED" : "#FF4D1C";

          ctx.strokeStyle = reticleColor;
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 10;
          ctx.shadowColor = reticleColor;

          // Top Left Bracket
          ctx.beginPath();
          ctx.moveTo(-reticleRadius, -reticleRadius + bracketLen);
          ctx.lineTo(-reticleRadius, -reticleRadius);
          ctx.lineTo(-reticleRadius + bracketLen, -reticleRadius);
          ctx.stroke();

          // Top Right Bracket
          ctx.beginPath();
          ctx.moveTo(reticleRadius - bracketLen, -reticleRadius);
          ctx.lineTo(reticleRadius, -reticleRadius);
          ctx.lineTo(reticleRadius, -reticleRadius + bracketLen);
          ctx.stroke();

          // Bottom Left Bracket
          ctx.beginPath();
          ctx.moveTo(-reticleRadius, reticleRadius - bracketLen);
          ctx.lineTo(-reticleRadius, reticleRadius);
          ctx.lineTo(-reticleRadius + bracketLen, reticleRadius);
          ctx.stroke();

          // Bottom Right Bracket
          ctx.beginPath();
          ctx.moveTo(reticleRadius - bracketLen, reticleRadius);
          ctx.lineTo(reticleRadius, reticleRadius);
          ctx.lineTo(reticleRadius, reticleRadius - bracketLen);
          ctx.stroke();

          // Subtle status tag next to reticle
          ctx.font = "bold 8px monospace";
          ctx.fillStyle = reticleColor;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(isSelected ? "LOCK // ON" : "SCAN", reticleRadius + 4, 0);

          ctx.shadowBlur = 0;
        }

        // Concentric Orbital Ring (The Atom-i signature look)
        if (node.type === "goal") {
          // Double concentric orbital rings for central atomic reactor
          ctx.save();
          // Slowly rotating outer orbital track
          ctx.rotate(pulseTime * 0.35);
          ctx.beginPath();
          ctx.arc(0, 0, node.radius + 7, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(0, 240, 255, 0.25)";
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 6]);
          ctx.stroke();

          // Orbiting atomic satellite electron
          const electronAngle = pulseTime * 1.2;
          const ex = Math.cos(electronAngle) * (node.radius + 7);
          const ey = Math.sin(electronAngle) * (node.radius + 7);
          ctx.beginPath();
          ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = "#7C3AED";
          ctx.shadowBlur = 8;
          ctx.shadowColor = "#7C3AED";
          ctx.fill();
          ctx.restore();
        } else if (node.type === "phase") {
          // Segmented circular progress track around phase orbital
          const prog = node.progress || 0;
          ctx.beginPath();
          ctx.arc(0, 0, node.radius + 4, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
          ctx.lineWidth = 2.5;
          ctx.stroke();

          if (prog > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, node.radius + 4, -Math.PI / 2, (prog / 100) * Math.PI * 2 - Math.PI / 2);
            ctx.strokeStyle = node.completed ? "#00ff88" : node.color;
            ctx.lineWidth = 2.5;
            ctx.lineCap = "round";
            ctx.shadowBlur = 6;
            ctx.shadowColor = node.completed ? "#00ff88" : node.color;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }

        // Node Body Fill with Rich Multi-stop Radial Gradient
        const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, node.radius);
        if (node.completed) {
          grad.addColorStop(0, "rgba(0, 255, 136, 0.35)");
          grad.addColorStop(0.7, "rgba(6, 32, 20, 0.92)");
          grad.addColorStop(1, "rgba(2, 14, 8, 0.98)");
        } else if (isSelected) {
          grad.addColorStop(0, "rgba(0, 240, 255, 0.3)");
          grad.addColorStop(0.7, "rgba(8, 26, 45, 0.92)");
          grad.addColorStop(1, "rgba(3, 10, 20, 0.98)");
        } else {
          grad.addColorStop(0, "rgba(20, 32, 54, 0.45)");
          grad.addColorStop(0.7, "rgba(8, 14, 26, 0.92)");
          grad.addColorStop(1, "rgba(4, 7, 14, 0.98)");
        }

        ctx.beginPath();
        ctx.arc(0, 0, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Node Outer Border
        ctx.beginPath();
        ctx.arc(0, 0, node.radius, 0, Math.PI * 2);
        ctx.strokeStyle = node.completed
          ? "#00ff88"
          : isSelected
          ? "#7C3AED"
          : `${node.color}bb`;
        ctx.lineWidth = isSelected ? 2.5 : node.type === "goal" ? 2.0 : 1.4;
        ctx.shadowBlur = isSelected || isHovered ? 12 : 4;
        ctx.shadowColor = node.completed ? "#00ff88" : node.color;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Core Inner Glyphs & Indicators
        if (node.type === "goal") {
          const prog = node.progress || 0;
          
          // Goal reactor circular gauge
          ctx.beginPath();
          ctx.arc(0, 0, node.radius - 5, -Math.PI / 2, (prog / 100) * Math.PI * 2 - Math.PI / 2);
          ctx.strokeStyle = prog === 100 ? "#00ff88" : "#7C3AED";
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Percentage readout
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 11px Orbitron, monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`${prog}%`, 0, -1);

          // "CORE" micro badge
          ctx.fillStyle = "#7C3AED";
          ctx.font = "bold 7px monospace";
          ctx.fillText("REACTOR", 0, 11);
        } else if (node.type === "phase") {
          const prog = node.progress || 0;

          if (node.completed) {
            ctx.fillStyle = "#00ff88";
            ctx.font = "bold 13px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("✓", 0, 0);
          } else {
            // Phase indicator badge
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 10px Rajdhani, monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`P-${node.index || 1}`, 0, -2);

            ctx.fillStyle = `${node.color}cc`;
            ctx.font = "bold 7px monospace";
            ctx.fillText(`${prog}%`, 0, 8);
          }
        } else {
          // Task Node
          if (node.completed) {
            ctx.fillStyle = "#00ff88";
            ctx.font = "bold 12px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("✓", 0, 0);
          } else {
            // Glowing atomic pip
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fillStyle = node.color;
            ctx.shadowBlur = 6;
            ctx.shadowColor = node.color;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Micro priority indicator ring
            if (node.priority === "Critical") {
              ctx.beginPath();
              ctx.arc(0, 0, node.radius - 3, 0, Math.PI * 2);
              ctx.strokeStyle = "rgba(255, 0, 119, 0.7)";
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }

        // Modern Cyber Tag Pill below node
        const labelText = node.title.length > 20 ? node.title.substring(0, 18) + "…" : node.title;
        const fontStr = node.type === "goal"
          ? "bold 11px Orbitron, sans-serif"
          : node.type === "phase"
          ? "600 10px Rajdhani, sans-serif"
          : "9px Inter, sans-serif";

        ctx.font = fontStr;
        const textMetrics = ctx.measureText(labelText);
        const pillWidth = Math.max(textMetrics.width + 14, 46);
        const pillHeight = 16;
        const pillY = node.radius + 7;

        // Pill background
        ctx.beginPath();
        const rx = -pillWidth / 2;
        const ry = pillY;
        const radius = 3;
        ctx.moveTo(rx + radius, ry);
        ctx.lineTo(rx + pillWidth - radius, ry);
        ctx.arcTo(rx + pillWidth, ry, rx + pillWidth, ry + radius, radius);
        ctx.lineTo(rx + pillWidth, ry + pillHeight - radius);
        ctx.arcTo(rx + pillWidth, ry + pillHeight, rx + pillWidth - radius, ry + pillHeight, radius);
        ctx.lineTo(rx + radius, ry + pillHeight);
        ctx.arcTo(rx, ry + pillHeight, rx, ry + pillHeight - radius, radius);
        ctx.lineTo(rx, ry + radius);
        ctx.arcTo(rx, ry, rx + radius, ry, radius);
        ctx.closePath();

        ctx.fillStyle = isSelected
          ? "rgba(0, 240, 255, 0.18)"
          : isHovered
          ? "rgba(255, 0, 119, 0.15)"
          : "rgba(6, 11, 22, 0.85)";
        ctx.fill();

        ctx.strokeStyle = isSelected
          ? "rgba(0, 240, 255, 0.7)"
          : isHovered
          ? "rgba(255, 0, 119, 0.6)"
          : node.completed
          ? "rgba(0, 255, 136, 0.35)"
          : "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Pill text
        ctx.fillStyle = node.completed
          ? "#a8ffb2"
          : isSelected
          ? "#7C3AED"
          : isHovered
          ? "#ffffff"
          : "#cbd5e1";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(labelText, 0, pillY + pillHeight / 2);

        ctx.restore();
      });

      ctx.restore();
      animId = requestAnimationFrame(runRenderLoop);
    };

    animId = requestAnimationFrame(runRenderLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [goal, selectedNodeId, pan, zoom, hoveredNode]);

  // Screen-to-World coordinates mapper
  const getWorldCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x, y };
  };

  // Zoom toward a world-space point, keeping it pinned at the same screen
  // position (adjusts pan to compensate instead of swinging to the origin).
  const zoomAt = (worldX: number, worldY: number, factor: number) => {
    const z1 = zoomRef.current;
    const z2 = Math.max(0.3, Math.min(2.5, z1 * factor));
    if (z2 === z1) return;
    setPan((p) => ({ x: p.x + worldX * (z1 - z2), y: p.y + worldY * (z1 - z2) }));
    setZoom(z2);
  };

  // Zoom target: the locked-on (selected) node when there is one,
  // otherwise whatever is currently at the center of the view.
  const getZoomTarget = () => {
    if (selectedNodeId) {
      const node = renderNodesRef.current.find((n) => n.id === selectedNodeId);
      if (node) return { x: node.x, y: node.y };
    }
    const canvas = canvasRef.current;
    if (canvas) {
      return {
        x: (canvas.width / 2 - panRef.current.x) / zoomRef.current,
        y: (canvas.height / 2 - panRef.current.y) / zoomRef.current,
      };
    }
    return { x: 0, y: 0 };
  };

  // Check hover of nodes
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const world = getWorldCoords(e.clientX, e.clientY);

    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPan({ x: pan.x + dx, y: pan.y + dy });
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Identify if mouse is hovering over a node
    let found: RenderNode | null = null;
    for (const node of renderNodesRef.current) {
      const dist = Math.hypot(world.x - node.x, world.y - node.y);
      if (dist <= node.radius + 10) {
        found = node;
        break;
      }
    }

    setHoveredNode(found);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) { // Left click
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(false);

    // If we weren't panning significantly, check if we clicked a node
    const world = getWorldCoords(e.clientX, e.clientY);
    let clickedNode: RenderNode | null = null;

    for (const node of renderNodesRef.current) {
      const dist = Math.hypot(world.x - node.x, world.y - node.y);
      if (dist <= node.radius + 10) {
        clickedNode = node;
        break;
      }
    }

    if (clickedNode) {
      cyberAudio.playNodeSelect();
      onSelectNode(clickedNode.id, clickedNode.type);
    } else {
      cyberAudio.playCyberClick(0.9);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    // Zoom toward the cursor so the view never swings back to the center.
    const world = getWorldCoords(e.clientX, e.clientY);
    zoomAt(world.x, world.y, e.deltaY < 0 ? 1.1 : 1 / 1.1);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Double click toggles completion
    const world = getWorldCoords(e.clientX, e.clientY);
    for (const node of renderNodesRef.current) {
      const dist = Math.hypot(world.x - node.x, world.y - node.y);
      if (dist <= node.radius + 10) {
        cyberAudio.playCyberClick(1.2);
        onToggleComplete(node.id, node.type);
        break;
      }
    }
  };

  // Quick action buttons for fit and zoom
  const resetMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    cyberAudio.playCyberClick(1.1);
    setPan({ x: canvas.width / 2, y: canvas.height / 2 });
    setZoom(0.8);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full border border-rebel-500/20 rounded-2xl bg-black/60 overflow-hidden backdrop-blur-md tactical-corner-frame hover-focus-border"
    >
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          onClick={resetMap}
          className="px-3 py-1.5 rounded-lg border border-rebel-400/30 bg-black/80 hover:bg-rebel-500/20 text-rebel-400 hover:text-rebel-300 font-mono text-xs tracking-wider transition-all duration-300 shadow-lg shadow-black/50"
        >
          RE-CENTER
        </button>
        <button
          onClick={() => {
            cyberAudio.playCyberClick(1.05);
            const t = getZoomTarget();
            zoomAt(t.x, t.y, 1.18);
          }}
          className="px-2.5 py-1.5 rounded-lg border border-rebel-400/30 bg-black/80 hover:bg-rebel-500/20 text-rebel-400 font-mono text-xs font-bold transition-all"
          title="Zoom in on the selected node"
        >
          +
        </button>
        <button
          onClick={() => {
            cyberAudio.playCyberClick(0.95);
            const t = getZoomTarget();
            zoomAt(t.x, t.y, 1 / 1.18);
          }}
          className="px-2.5 py-1.5 rounded-lg border border-rebel-400/30 bg-black/80 hover:bg-rebel-500/20 text-rebel-400 font-mono text-xs font-bold transition-all"
          title="Zoom out from the selected node"
        >
          -
        </button>
      </div>

      <div className="absolute bottom-4 right-4 z-10 text-[10px] text-gray-500 font-mono text-right pointer-events-none select-none">
        <div>DRAG TO PAN • SCROLL TO ZOOM</div>
        <div>DBL-CLICK NODE TO TOGGLE COMPLETE</div>
      </div>

      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />
    </div>
  );
}
