/**
 * VFX Particle Visualizer — ported from the original atom-i JS module.
 * 2000-node violet particle field with camera focus lerping and phase-blast
 * explosions. Re-tinted to the FUAX Signal Violet brand palette.
 *
 * Ambient usage: new VFXParticlesVisualizer(containerId) -> init() ->
 * destroy() on unmount. Node labels are optional and unused in ambient mode.
 */
import * as THREE from "three";

// Brand tints (FUAX Palette A — Signal Violet)
const PARTICLE_VIOLET: [number, number, number] = [124 / 255, 58 / 255, 237 / 255];
const BLAST_VIOLET = 0x8b5cf6;
const VOID_BLACK = 0x0b0b0f;
const NODE_DOT = "#a78bfa";
const NODE_DOT_ACTIVE = "#c4b5fd";

export interface ParticleTask {
  id: string;
  title: string;
  quadrant?: string;
  tag?: string;
}

interface NodeLabel {
  id: string;
  element: HTMLDivElement;
  index: number;
  taskData: ParticleTask;
  sequenceIdx: number;
  phaseIdx: number;
  status: "active" | "upcoming" | "locked" | "completed";
  expanded: boolean;
}

interface BlastParticle {
  mesh: THREE.Points;
  velocities: THREE.Vector3[];
  life: number;
}

export class VFXParticlesVisualizer {
  onTaskCompleted: ((taskId: string) => void) | null = null;

  private container: HTMLElement | null;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private particleMesh: THREE.Points | null = null;
  private count = 2000;
  private nodeLabels: NodeLabel[] = [];
  private positions: Float32Array | null = null;

  private targetCameraPos = new THREE.Vector3(0, 0, 18);
  private defaultCameraZ = 18;
  private blastParticles: BlastParticle[] = [];

  private rafId: number | null = null;
  private disposed = false;
  private boundResize = () => this.handleResize();

  constructor(containerId: string) {
    this.container = document.getElementById(containerId);
  }

  async init(): Promise<void> {
    if (!this.container || this.disposed) return;

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 0, this.defaultCameraZ);

    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setClearColor(VOID_BLACK, 1);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.setupParticleSystem();

    window.addEventListener("resize", this.boundResize);
    this.animate();
  }

  /** Full teardown: stops the RAF loop, listeners, and frees GPU resources. */
  destroy(): void {
    this.disposed = true;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    window.removeEventListener("resize", this.boundResize);
    this.clearLabels();

    if (this.particleMesh) {
      this.particleMesh.geometry.dispose();
      (this.particleMesh.material as THREE.Material).dispose();
      this.scene?.remove(this.particleMesh);
      this.particleMesh = null;
    }
    for (const blast of this.blastParticles) {
      blast.mesh.geometry.dispose();
      (blast.mesh.material as THREE.Material).dispose();
      this.scene?.remove(blast.mesh);
    }
    this.blastParticles = [];

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
      this.renderer = null;
    }
    this.scene = null;
    this.camera = null;
    this.positions = null;
  }

  private setupParticleSystem(): void {
    if (!this.scene) return;
    const geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.count * 3);
    const colors = new Float32Array(this.count * 3);

    for (let i = 0; i < this.count * 3; i += 3) {
      this.positions[i] = (Math.random() - 0.5) * 45;
      this.positions[i + 1] = (Math.random() - 0.5) * 45;
      this.positions[i + 2] = (Math.random() - 0.5) * 25;

      // Violet with per-particle variance
      colors[i] = PARTICLE_VIOLET[0] * (0.7 + Math.random() * 0.5);
      colors[i + 1] = PARTICLE_VIOLET[1] * (0.7 + Math.random() * 0.5);
      colors[i + 2] = Math.min(1, PARTICLE_VIOLET[2] * (0.85 + Math.random() * 0.3));
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    this.particleMesh = new THREE.Points(geometry, material);
    this.scene.add(this.particleMesh);
  }

  addNodeLabel(task: ParticleTask, index: number, phaseIdx = 0): void {
    if (!this.positions) return;
    const particleIndex = (index * 12 + 15) % this.count;

    this.positions[particleIndex * 3] = (Math.random() - 0.5) * 10;
    this.positions[particleIndex * 3 + 1] = (Math.random() - 0.5) * 8;
    this.positions[particleIndex * 3 + 2] = (Math.random() - 0.5) * 6;

    const isCurrentTaskAtHand = index === 0;
    const isCurrentPhase = phaseIdx === 0;

    const labelEl = document.createElement("div");
    labelEl.className = `particle-node-label ${isCurrentTaskAtHand ? "node-active-burn" : ""}`;
    labelEl.dataset.taskId = task.id;

    if (!isCurrentPhase) {
      labelEl.style.display = "none";
    }

    this.applyNodeStyles(labelEl, isCurrentTaskAtHand);

    labelEl.addEventListener("click", (e) => {
      e.stopPropagation();
      const nodeObj = this.nodeLabels.find((n) => n.id === task.id);
      if (!nodeObj || nodeObj.status === "locked" || nodeObj.status === "completed") return;

      if ((e.target as HTMLElement).classList.contains("btn-complete-node")) {
        this.completeTaskNode(task.id);
      } else {
        this.toggleExpandNode(task.id);
      }
    });

    document.body.appendChild(labelEl);
    this.nodeLabels.push({
      id: task.id,
      element: labelEl,
      index: particleIndex,
      taskData: task,
      sequenceIdx: index,
      phaseIdx,
      status: isCurrentTaskAtHand ? "active" : isCurrentPhase ? "upcoming" : "locked",
      expanded: false,
    });
  }

  private applyNodeStyles(el: HTMLDivElement, isTaskAtHand: boolean): void {
    const dotColor = isTaskAtHand ? NODE_DOT_ACTIVE : NODE_DOT;
    const size = isTaskAtHand ? "14px" : "10px";

    el.style.cssText = `
            position: absolute;
            z-index: 20;
            width: ${size};
            height: ${size};
            background: ${dotColor};
            border-radius: 50%;
            cursor: pointer;
            pointer-events: auto;
            box-shadow: 0 0 ${isTaskAtHand ? "18px" : "10px"} ${dotColor};
            transform: translate(-50%, -50%);
            transition: transform 0.2s ease, opacity 0.3s ease;
        `;
    el.innerHTML = "";
  }

  toggleExpandNode(taskId: string): void {
    this.nodeLabels.forEach((node) => {
      if (node.id === taskId && (node.status === "active" || node.status === "upcoming")) {
        node.expanded = !node.expanded;
        if (node.expanded) {
          node.element.className = "particle-node-label";
          node.element.style.zIndex = "100";
          node.element.innerHTML = `
                        <div style="display:flex; flex-direction:column; gap:6px; min-width:190px; padding:4px;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-size:0.65rem; color:#a78bfa; font-weight:800;">${node.taskData.tag || "TASK"}</span>
                                <span style="font-size:0.65rem; color:#c4b5fd; font-weight:800;">${(node.taskData.quadrant || "DO").toUpperCase()}</span>
                            </div>
                            <div style="font-size:0.85rem; color:#fff; white-space:normal;">${node.taskData.title}</div>
                            <button class="btn-complete-node" style="
                                margin-top:6px;
                                background:#7C3AED;
                                color:#fff;
                                border:none;
                                padding:6px 10px;
                                border-radius:6px;
                                font-weight:800;
                                font-size:0.7rem;
                                cursor:pointer;
                            ">COMPLETE TASK</button>
                        </div>
                    `;
          node.element.style.width = "auto";
          node.element.style.height = "auto";
          node.element.style.borderRadius = "10px";
          node.element.style.background = "rgba(11, 11, 15, 0.95)";
          node.element.style.border = "1px solid #7C3AED";
        } else {
          this.applyNodeStyles(node.element, node.status === "active");
          if (node.status === "active") node.element.className = "particle-node-label node-active-burn";
        }
      } else if (node.expanded) {
        node.expanded = false;
        this.applyNodeStyles(node.element, node.status === "active");
        if (node.status === "active") node.element.className = "particle-node-label node-active-burn";
      }
    });
  }

  focusCameraOnNode(node: NodeLabel): void {
    if (!node || !this.positions) return;
    const idx = node.index * 3;
    const localPos = new THREE.Vector3(
      this.positions[idx],
      this.positions[idx + 1],
      this.positions[idx + 2]
    );

    if (this.particleMesh) {
      localPos.applyEuler(this.particleMesh.rotation);
    }

    this.targetCameraPos.set(localPos.x, localPos.y, localPos.z + 12);
  }

  highlightNode(taskId: string): void {
    this.nodeLabels.forEach((node) => {
      if (node.id === taskId) {
        if (node.status === "locked") return;
        node.element.style.transform = "translate(-50%, -50%) scale(1.5)";
        this.toggleExpandNode(taskId);
        this.focusCameraOnNode(node);
      }
    });
  }

  completeTaskNode(taskId: string): void {
    const currentIdx = this.nodeLabels.findIndex((n) => n.id === taskId);
    if (currentIdx === -1) return;

    const currNode = this.nodeLabels[currentIdx];
    currNode.status = "completed";
    currNode.expanded = false;
    currNode.element.style.display = "none";

    if (typeof this.onTaskCompleted === "function") {
      this.onTaskCompleted(taskId);
    }

    const nextNode = this.nodeLabels[currentIdx + 1];

    if (nextNode && nextNode.phaseIdx === currNode.phaseIdx) {
      nextNode.status = "active";
      nextNode.element.className = "particle-node-label node-active-burn";
      this.applyNodeStyles(nextNode.element, true);
      this.focusCameraOnNode(nextNode);
    } else {
      this.targetCameraPos.set(0, 0, 18);
      this.triggerPhaseBlast(currNode.phaseIdx);

      if (nextNode) {
        const nextPhaseIdx = nextNode.phaseIdx;
        this.nodeLabels.forEach((n, idx) => {
          if (n.phaseIdx === nextPhaseIdx) {
            const isFirstInPhase = idx === currentIdx + 1;
            n.status = isFirstInPhase ? "active" : "upcoming";
            n.element.style.display = "block";
            n.element.className = `particle-node-label ${isFirstInPhase ? "node-active-burn" : ""}`;
            this.applyNodeStyles(n.element, isFirstInPhase);

            if (isFirstInPhase) {
              setTimeout(() => this.focusCameraOnNode(n), 1200);
            }
          }
        });
      }
    }
  }

  triggerPhaseBlast(_phaseIdx: number): void {
    if (!this.scene) return;
    const explosionCount = 350;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(explosionCount * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < explosionCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = 0.35 + Math.random() * 0.75;

      velocities.push(
        new THREE.Vector3(
          speed * Math.sin(phi) * Math.cos(theta),
          speed * Math.sin(phi) * Math.sin(theta),
          speed * Math.cos(phi)
        )
      );
    }

    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.35,
      color: BLAST_VIOLET,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
    });

    const blastMesh = new THREE.Points(geom, mat);
    this.scene.add(blastMesh);

    this.blastParticles.push({ mesh: blastMesh, velocities, life: 1.0 });
  }

  clearLabels(): void {
    this.nodeLabels.forEach((label) => label.element.remove());
    this.nodeLabels = [];
    this.targetCameraPos.set(0, 0, this.defaultCameraZ);
  }

  private animate(): void {
    if (this.disposed) return;
    this.rafId = requestAnimationFrame(() => this.animate());

    if (this.particleMesh) {
      this.particleMesh.rotation.y += 0.0006;
      this.particleMesh.rotation.x += 0.0003;
    }

    this.camera?.position.lerp(this.targetCameraPos, 0.05);

    for (let i = this.blastParticles.length - 1; i >= 0; i--) {
      const blast = this.blastParticles[i];
      const posAttr = blast.mesh.geometry.attributes.position as THREE.BufferAttribute;

      for (let j = 0; j < blast.velocities.length; j++) {
        posAttr.setXYZ(
          j,
          posAttr.getX(j) + blast.velocities[j].x,
          posAttr.getY(j) + blast.velocities[j].y,
          posAttr.getZ(j) + blast.velocities[j].z
        );
      }

      posAttr.needsUpdate = true;
      blast.life -= 0.015;
      (blast.mesh.material as THREE.PointsMaterial).opacity = blast.life;

      if (blast.life <= 0) {
        this.scene?.remove(blast.mesh);
        blast.mesh.geometry.dispose();
        (blast.mesh.material as THREE.Material).dispose();
        this.blastParticles.splice(i, 1);
      }
    }

    this.updateNodeLabelPositions();
    if (this.renderer && this.camera && this.scene) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private updateNodeLabelPositions(): void {
    if (!this.nodeLabels.length || !this.positions || !this.camera || !this.particleMesh) return;

    const tempVec = new THREE.Vector3();

    this.nodeLabels.forEach((node) => {
      if (node.element.style.display === "none") return;

      const idx = node.index * 3;
      tempVec.set(this.positions![idx], this.positions![idx + 1], this.positions![idx + 2]);

      tempVec.applyEuler(this.particleMesh!.rotation);
      tempVec.project(this.camera!);

      const x = (tempVec.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-tempVec.y * 0.5 + 0.5) * window.innerHeight;

      if (tempVec.z > 1) {
        node.element.style.opacity = "0";
      } else {
        node.element.style.opacity = "1";
        node.element.style.left = `${x}px`;
        node.element.style.top = `${y}px`;
      }
    });
  }

  private handleResize(): void {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
