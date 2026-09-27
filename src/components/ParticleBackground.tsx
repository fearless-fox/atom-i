/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from "react";

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Continuous slow-panning offsets
    let panX = 0;
    let panY = 0;

    // Smooth mouse / touch tracking with lerp
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;
    let smoothMouseX = width / 2;
    let smoothMouseY = height / 2;

    // Subtle radar sweep angle
    let sweepAngle = 0;

    // Tactical Floating Particles
    class TacticalNode {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      pulsePhase: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = (Math.random() - 0.5) * 0.35;
        this.radius = Math.random() * 1.8 + 0.8;
        this.color = Math.random() > 0.4 ? "rgba(0, 240, 255, 0.45)" : "rgba(255, 0, 115, 0.4)";
        this.pulsePhase = Math.random() * Math.PI * 2;
      }

      update(mX: number, mY: number) {
        this.x += this.vx;
        this.y += this.vy;
        this.pulsePhase += 0.03;

        // Wrap boundaries
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;

        // Interactive gentle repel from cursor
        const dx = mX - this.x;
        const dy = mY - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 150 && dist > 0) {
          const force = (150 - dist) / 150;
          this.x -= (dx / dist) * force * 1.1;
          this.y -= (dy / dist) * force * 1.1;
        }
      }

      draw(c: CanvasRenderingContext2D) {
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.3;
        c.beginPath();
        c.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.fill();
      }
    }

    const nodeCount = Math.min(65, Math.floor((width * height) / 18000));
    const nodes: TacticalNode[] = Array.from({ length: nodeCount }, () => new TacticalNode());

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if ("touches" in e && e.touches.length > 0) {
        targetMouseX = e.touches[0].clientX;
        targetMouseY = e.touches[0].clientY;
      } else if ("clientX" in e) {
        targetMouseX = e.clientX;
        targetMouseY = e.clientY;
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("touchmove", handlePointerMove, { passive: true });
    window.addEventListener("resize", handleResize);

    const animate = () => {
      // Smooth lerp mouse coordinates
      smoothMouseX += (targetMouseX - smoothMouseX) * 0.05;
      smoothMouseY += (targetMouseY - smoothMouseY) * 0.05;

      // Slow continuous panning (drift)
      panX = (panX + 0.22) % 120;
      panY = (panY + 0.16) % 120;

      // Radar rotation
      sweepAngle = (sweepAngle + 0.008) % (Math.PI * 2);

      // Deep dark canvas background
      ctx.fillStyle = "rgba(4, 7, 13, 0.22)";
      ctx.fillRect(0, 0, width, height);

      // Parallax shifts based on mouse position
      const parallaxX = (smoothMouseX - width / 2) * 0.035;
      const parallaxY = (smoothMouseY - height / 2) * 0.035;

      // Dynamic density calculation based on cursor vertical position
      const densityNormalized = smoothMouseY / Math.max(1, height);
      const baseGridSize = 58 + densityNormalized * 12;

      // Dynamic subtle grid angle tilt
      const tiltAngle = ((smoothMouseX - width / 2) / Math.max(1, width)) * 0.06;

      ctx.save();
      // Apply subtle dynamic rotation around screen center
      ctx.translate(width / 2, height / 2);
      ctx.rotate(tiltAngle);
      ctx.translate(-width / 2, -height / 2);

      // Draw Dynamic Procedural Panning Grid
      const startX = -baseGridSize * 2;
      const endX = width + baseGridSize * 2;
      const startY = -baseGridSize * 2;
      const endY = height + baseGridSize * 2;

      const effectiveOffsetX = (panX + parallaxX) % baseGridSize;
      const effectiveOffsetY = (panY + parallaxY) % baseGridSize;

      ctx.lineWidth = 0.55;

      // Vertical Grid Lines
      for (let x = startX + effectiveOffsetX; x < endX; x += baseGridSize) {
        const distFromCenter = Math.abs(x - smoothMouseX);
        const mouseGlow = Math.max(0, 1 - distFromCenter / 450);
        const lineAlpha = 0.025 + mouseGlow * 0.035;

        ctx.strokeStyle = `rgba(0, 240, 255, ${lineAlpha})`;
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      }

      // Horizontal Grid Lines
      for (let y = startY + effectiveOffsetY; y < endY; y += baseGridSize) {
        const distFromCenter = Math.abs(y - smoothMouseY);
        const mouseGlow = Math.max(0, 1 - distFromCenter / 450);
        const lineAlpha = 0.025 + mouseGlow * 0.035;

        ctx.strokeStyle = `rgba(0, 240, 255, ${lineAlpha})`;
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }

      // Tactical Crosshair Intersections near cursor
      const crossSize = 3;
      for (let x = startX + effectiveOffsetX; x < endX; x += baseGridSize) {
        for (let y = startY + effectiveOffsetY; y < endY; y += baseGridSize) {
          const dx = x - smoothMouseX;
          const dy = y - smoothMouseY;
          const dist = Math.hypot(dx, dy);

          if (dist < 260) {
            const alpha = (1 - dist / 260) * 0.45;
            ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(x - crossSize, y);
            ctx.lineTo(x + crossSize, y);
            ctx.moveTo(x, y - crossSize);
            ctx.lineTo(x, y + crossSize);
            ctx.stroke();
          }
        }
      }

      ctx.restore();

      // Draw vector laser lines between proximate nodes
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        n1.update(smoothMouseX, smoothMouseY);
        n1.draw(ctx);

        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
          if (dist < 110) {
            const alpha = ((110 - dist) / 110) * 0.18;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
            ctx.lineWidth = 0.45;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      id="particle-bg-canvas"
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-10 bg-[#04070c]"
    />
  );
}
