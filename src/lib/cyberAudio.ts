/**
 * Web Audio API Procedural Sound Synthesizer for ATOM-I
 * Zero external audio files, ultra-low latency, pure synthetic mechanical & cyber soundscapes.
 */

export type AmbienceProfile = "deep_brown" | "binaural_theta" | "heavy_rain" | "pink_cosmic";

class CyberAudioManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private masterGain: GainNode | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("atom_audio_enabled");
      this.enabled = stored !== null ? stored === "true" : true;
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean): void {
    this.enabled = val;
    if (typeof window !== "undefined") {
      localStorage.setItem("atom_audio_enabled", val ? "true" : "false");
    }
    if (val) {
      this.playCyberClick(1.2);
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  /**
   * Mechanical & Cyber Click:
   * Short, snappy tactile micro-click for UI buttons, node drags, and general interactions.
   */
  public playCyberClick(pitchModifier = 1.0): void {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Mechanical transient burst (pitch drop from 1200Hz to 240Hz in 15ms)
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400 * pitchModifier, now);
      osc.frequency.exponentialRampToValueAtTime(260 * pitchModifier, now + 0.018);

      // Snappy micro-envelope
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

      osc.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);
      else gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.025);

      // Noise click transient for mechanical tactile switch feel
      this.playNoiseTransient(now, 0.008, 0.12);
    } catch {
      // Ignore audio failure
    }
  }

  /**
   * Node Select / Targeting Beep
   */
  public playNodeSelect(): void {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(740, now);
      osc.frequency.exponentialRampToValueAtTime(1080, now + 0.035);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);
      else gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {
      // Ignore audio failure
    }
  }

  /**
   * Task Toggle Sound:
   * Checked: crisp ascending high-tech latch (520Hz -> 840Hz)
   * Unchecked: soft mechanical unlatch (580Hz -> 340Hz)
   */
  public playTaskToggle(completed: boolean): void {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      if (completed) {
        // High-tech latch
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(520, now);
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.05);

        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(1040, now);
        osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.05);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc1.connect(gain);
        osc2.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);
        else gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.095);
        osc2.stop(now + 0.095);

        this.playNoiseTransient(now, 0.012, 0.08);
      } else {
        // Mechanical unlatch
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(640, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);
        else gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.065);
      }
    } catch {
      // Ignore audio failure
    }
  }

  /**
   * Drawer Slide / Panel Transition:
   * Smooth pneumatic servo slide whoosh
   */
  public playDrawerSlide(isOpen: boolean): void {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      filter.type = "bandpass";
      filter.Q.value = 3.0;

      if (isOpen) {
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.1);
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(900, now + 0.1);
      } else {
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.09);
        filter.frequency.setValueAtTime(900, now);
        filter.frequency.exponentialRampToValueAtTime(350, now + 0.09);
      }

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      osc.connect(filter);
      filter.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);
      else gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Ignore audio failure
    }
  }

  /**
   * Success / Completion Tone:
   * Resonant harmonic hum and high-frequency chime when marking a whole goal branch or phase completed.
   */
  public playBranchSuccess(): void {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Cyber chord: E4 (329.63), G#4 (415.30), B4 (493.88), E5 (659.25)
      const freqs = [329.63, 415.3, 493.88, 659.25];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const delay = idx * 0.045; // Staggered arpeggio effect

        osc.type = idx === 0 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(freq, now + delay);

        // Resonant harmonic swell & decay
        gain.gain.setValueAtTime(0.0001, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.18, now + delay + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.55);

        osc.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);
        else gain.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.6);
      });

      // Shimmering resonant chime at the top
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chimeOsc.type = "sine";
      chimeOsc.frequency.setValueAtTime(1318.51, now + 0.15); // E6
      chimeGain.gain.setValueAtTime(0.001, now + 0.15);
      chimeGain.gain.exponentialRampToValueAtTime(0.12, now + 0.18);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

      chimeOsc.connect(chimeGain);
      if (this.masterGain) chimeGain.connect(this.masterGain);
      else chimeGain.connect(ctx.destination);

      chimeOsc.start(now + 0.15);
      chimeOsc.stop(now + 0.75);
    } catch {
      // Ignore audio failure
    }
  }

  /**
   * Grand 100% Goal Completion Fanfare:
   * Deep harmonic sub hum + radiant cyber synth chord
   */
  public playGoalComplete(): void {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Sub hum
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = "sine";
      sub.frequency.setValueAtTime(110, now);
      sub.frequency.linearRampToValueAtTime(220, now + 0.8);
      subGain.gain.setValueAtTime(0.25, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      sub.connect(subGain);
      if (this.masterGain) subGain.connect(this.masterGain);
      sub.start(now);
      sub.stop(now + 0.95);

      // Pentatonic ascension (A4, C#5, E5, A5, C#6)
      const chord = [440, 554.37, 659.25, 880, 1108.73];
      chord.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const time = now + i * 0.07;

        osc.type = "sine";
        osc.frequency.setValueAtTime(f, time);

        gain.gain.setValueAtTime(0.001, time);
        gain.gain.exponentialRampToValueAtTime(0.2, time + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.7);

        osc.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);
        osc.start(time);
        osc.stop(time + 0.75);
      });
    } catch {
      // Ignore audio failure
    }
  }

  public playSuccess(): void {
    this.playBranchSuccess();
  }

  public playBranchError(): void {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.12);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);
      else gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Ignore audio failure
    }
  }

  private isAmbiencePlaying: boolean = false;
  private ambienceVolume: number = 0.35;
  private ambienceProfile: AmbienceProfile = "deep_brown";
  private brownNoiseSource: AudioBufferSourceNode | null = null;
  private brownNoiseGain: GainNode | null = null;
  private brownNoiseFilter: BiquadFilterNode | null = null;
  private thetaOscLeft: OscillatorNode | null = null;
  private thetaOscRight: OscillatorNode | null = null;
  private thetaGain: GainNode | null = null;
  private cosmicOsc: OscillatorNode | null = null;
  private cosmicGain: GainNode | null = null;
  private cachedBuffers: Map<AmbienceProfile, AudioBuffer> = new Map();

  /**
   * Generates a 100% seamless, gapless stereo ambient noise buffer with
   * an equal-power circular trigonometric crossfade.
   *
   * Crucially:
   * 1. Total loop duration is 45 seconds (luxuriously long, zero repetitive fatigue).
   * 2. Overlap circular crossfade is 6 seconds.
   * 3. At the loop boundary, sample out[loopSamples - 1] is followed by sample out[0]
   *    with zero discontinuity, zero derivative jump, and NO volume dip.
   * 4. Equal-power curve: sin(t * pi/2)^2 + cos(t * pi/2)^2 = 1.0 at every single sample,
   *    guaranteeing invariant acoustic energy with ZERO cutouts or dips.
   */
  private createSeamlessAmbienceBuffer(ctx: AudioContext, profile: AmbienceProfile): AudioBuffer {
    const duration = 45; // 45 seconds loop
    const crossfadeDuration = 6; // 6 seconds equal-power crossfade
    const sampleRate = ctx.sampleRate;
    const loopSamples = Math.floor(sampleRate * duration);
    const crossfadeSamples = Math.floor(sampleRate * crossfadeDuration);
    const totalSamples = loopSamples + crossfadeSamples;

    const buffer = ctx.createBuffer(2, loopSamples, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const raw = new Float32Array(totalSamples);
      const out = buffer.getChannelData(channel);

      let brown = 0.0;
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      let dcIn = 0.0;
      let dcOut = 0.0;
      let thunder = 0.0;

      for (let i = 0; i < totalSamples; i++) {
        const white = Math.random() * 2 - 1;
        let s = 0.0;

        if (profile === "deep_brown" || profile === "binaural_theta") {
          // True 1/f^2 Brownian noise: leaky integration
          brown = (brown + 0.022 * white) / 1.022;
          s = brown * 3.6;
        } else if (profile === "heavy_rain") {
          // Pink noise filter (Paul Kellet's accurate algorithm)
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.14;
          b6 = white * 0.115926;

          // Organic rain variation (gentle natural swells)
          const slowTime = i / sampleRate;
          const rainMod = 0.75 + 0.15 * Math.sin(slowTime * 0.4 + channel) + 0.1 * Math.sin(slowTime * 1.1);

          // Sub-bass rolling thunder rumble (deep low frequency < 75Hz)
          thunder = (thunder + 0.009 * (Math.random() * 2 - 1)) / 1.009;

          s = (pink * rainMod) + (thunder * 1.6);
        } else if (profile === "pink_cosmic") {
          // Soft pink cosmic noise with gentle warm low-frequency undertone
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.20;
          b6 = white * 0.115926;

          brown = (brown + 0.015 * white) / 1.015;
          s = pink * 0.75 + brown * 1.2;
        }

        // DC-blocking filter (10Hz highpass) to remove any DC offset drift
        dcOut = 0.9993 * (dcOut + s - dcIn);
        dcIn = s;
        raw[i] = dcOut;
      }

      // Circular equal-power crossfade (NO fade to silence!)
      for (let i = 0; i < loopSamples; i++) {
        if (i < crossfadeSamples) {
          const t = i / crossfadeSamples; // 0 to 1
          const gainHead = Math.sin(t * 0.5 * Math.PI); // rises from 0 to 1
          const gainTail = Math.cos(t * 0.5 * Math.PI); // falls from 1 to 0
          // At i = 0: gainHead = 0, gainTail = 1 => out[0] = raw[loopSamples]
          // Since out[loopSamples - 1] = raw[loopSamples - 1], the transition from
          // out[loopSamples - 1] to out[0] is continuous with raw[loopSamples]!
          out[i] = raw[i] * gainHead + raw[loopSamples + i] * gainTail;
        } else {
          out[i] = raw[i];
        }
      }
    }

    return buffer;
  }

  private getOrGenerateAmbienceBuffer(ctx: AudioContext, profile: AmbienceProfile): AudioBuffer {
    const cached = this.cachedBuffers.get(profile);
    if (cached) return cached;
    const generated = this.createSeamlessAmbienceBuffer(ctx, profile);
    this.cachedBuffers.set(profile, generated);
    return generated;
  }

  public getAmbienceState(): {
    isPlaying: boolean;
    volume: number;
    profile: AmbienceProfile;
  } {
    return {
      isPlaying: this.isAmbiencePlaying,
      volume: this.ambienceVolume,
      profile: this.ambienceProfile,
    };
  }

  public setAmbienceVolume(vol: number): void {
    this.ambienceVolume = Math.max(0, Math.min(1, vol));
    if (this.brownNoiseGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.brownNoiseGain.gain.linearRampToValueAtTime(this.ambienceVolume * 0.5, now + 0.1);
    }
    if (this.thetaGain && this.ctx) {
      const now = this.ctx.currentTime;
      const thetaVol = this.ambienceProfile === "binaural_theta" ? this.ambienceVolume * 0.08 : 0.0001;
      this.thetaGain.gain.linearRampToValueAtTime(thetaVol, now + 0.1);
    }
    if (this.cosmicGain && this.ctx) {
      const now = this.ctx.currentTime;
      const cosmicVol = this.ambienceProfile === "pink_cosmic" ? this.ambienceVolume * 0.05 : 0.0001;
      this.cosmicGain.gain.linearRampToValueAtTime(cosmicVol, now + 0.1);
    }
  }

  public setAmbienceProfile(profile: AmbienceProfile): void {
    if (this.ambienceProfile === profile) return;
    this.ambienceProfile = profile;
    if (!this.ctx || !this.isAmbiencePlaying) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    try {
      const newBuffer = this.getOrGenerateAmbienceBuffer(ctx, profile);
      const newSource = ctx.createBufferSource();
      newSource.buffer = newBuffer;
      newSource.loop = true;
      newSource.loopStart = 0;
      newSource.loopEnd = newBuffer.duration;

      // Adjust frequency sculpting filter
      if (this.brownNoiseFilter) {
        const cutoff =
          profile === "deep_brown"
            ? 380
            : profile === "binaural_theta"
            ? 320
            : profile === "heavy_rain"
            ? 1400
            : 680;
        this.brownNoiseFilter.frequency.exponentialRampToValueAtTime(cutoff, now + 0.4);
      }

      // Connect new source
      if (this.brownNoiseFilter) {
        newSource.connect(this.brownNoiseFilter);
        newSource.start(now);
      }

      const oldSource = this.brownNoiseSource;
      this.brownNoiseSource = newSource;

      // Stop previous source smoothly after 0.5s
      setTimeout(() => {
        try {
          if (oldSource) {
            oldSource.stop();
            oldSource.disconnect();
          }
        } catch {
          // ignore cleanup
        }
      }, 500);

      // Adjust binaural theta gain
      if (this.thetaGain) {
        const thetaVol = profile === "binaural_theta" ? this.ambienceVolume * 0.08 : 0.0001;
        this.thetaGain.gain.linearRampToValueAtTime(thetaVol, now + 0.4);
      }

      // Adjust cosmic warm drone gain
      if (this.cosmicGain) {
        const cosmicVol = profile === "pink_cosmic" ? this.ambienceVolume * 0.05 : 0.0001;
        this.cosmicGain.gain.linearRampToValueAtTime(cosmicVol, now + 0.4);
      }
    } catch (e) {
      console.warn("Could not transition ambience profile:", e);
    }
  }

  public startAmbience(
    profile: AmbienceProfile = this.ambienceProfile,
    volume: number = this.ambienceVolume
  ): void {
    const ctx = this.initContext();
    if (!ctx) return;

    if (this.isAmbiencePlaying) {
      this.setAmbienceProfile(profile);
      this.setAmbienceVolume(volume);
      return;
    }

    try {
      this.ambienceProfile = profile;
      this.ambienceVolume = volume;
      const now = ctx.currentTime;

      // 1. Create Seamless Gapless Loop Buffer
      const buffer = this.getOrGenerateAmbienceBuffer(ctx, profile);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.loopStart = 0;
      source.loopEnd = buffer.duration;

      // 2. Frequency Sculpting Biquad Filter
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      const cutoff =
        profile === "deep_brown"
          ? 380
          : profile === "binaural_theta"
          ? 320
          : profile === "heavy_rain"
          ? 1400
          : 680;
      filter.frequency.setValueAtTime(cutoff, now);
      filter.Q.setValueAtTime(0.7, now);

      // 3. Ambience Main Gain with Gentle Fade-In
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, this.ambienceVolume * 0.5), now + 0.8);

      source.connect(filter);
      filter.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);
      else gain.connect(ctx.destination);

      source.start(now);
      this.brownNoiseSource = source;
      this.brownNoiseGain = gain;
      this.brownNoiseFilter = filter;

      // 4. Subtle Binaural Theta Pulse (4.5Hz Theta Flow state: Left 108Hz, Right 112.5Hz)
      const merger = ctx.createChannelMerger(2);
      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      oscL.type = "sine";
      oscR.type = "sine";
      oscL.frequency.setValueAtTime(108, now);
      oscR.frequency.setValueAtTime(112.5, now); // 4.5Hz difference

      const thetaGain = ctx.createGain();
      const targetThetaVol = profile === "binaural_theta" ? this.ambienceVolume * 0.08 : 0.0001;
      thetaGain.gain.setValueAtTime(0.0001, now);
      thetaGain.gain.linearRampToValueAtTime(targetThetaVol, now + 1.0);

      oscL.connect(merger, 0, 0);
      oscR.connect(merger, 0, 1);
      merger.connect(thetaGain);
      if (this.masterGain) thetaGain.connect(this.masterGain);
      else thetaGain.connect(ctx.destination);

      oscL.start(now);
      oscR.start(now);
      this.thetaOscLeft = oscL;
      this.thetaOscRight = oscR;
      this.thetaGain = thetaGain;

      // 5. Cosmic Warm Analog Drone (55Hz sub-sine)
      const cosmicOsc = ctx.createOscillator();
      cosmicOsc.type = "sine";
      cosmicOsc.frequency.setValueAtTime(55, now); // A1 note
      const cosmicGain = ctx.createGain();
      const targetCosmicVol = profile === "pink_cosmic" ? this.ambienceVolume * 0.05 : 0.0001;
      cosmicGain.gain.setValueAtTime(0.0001, now);
      cosmicGain.gain.linearRampToValueAtTime(targetCosmicVol, now + 1.0);
      cosmicOsc.connect(cosmicGain);
      if (this.masterGain) cosmicGain.connect(this.masterGain);
      else cosmicGain.connect(ctx.destination);

      cosmicOsc.start(now);
      this.cosmicOsc = cosmicOsc;
      this.cosmicGain = cosmicGain;

      this.isAmbiencePlaying = true;
    } catch (e) {
      console.warn("Could not start brown noise ambience:", e);
    }
  }

  public stopAmbience(): void {
    if (!this.isAmbiencePlaying || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      if (this.brownNoiseGain) {
        this.brownNoiseGain.gain.linearRampToValueAtTime(0.0001, now + 0.4);
      }
      if (this.thetaGain) {
        this.thetaGain.gain.linearRampToValueAtTime(0.0001, now + 0.4);
      }
      if (this.cosmicGain) {
        this.cosmicGain.gain.linearRampToValueAtTime(0.0001, now + 0.4);
      }

      setTimeout(() => {
        try {
          if (this.brownNoiseSource) {
            this.brownNoiseSource.stop();
            this.brownNoiseSource.disconnect();
            this.brownNoiseSource = null;
          }
          if (this.thetaOscLeft) {
            this.thetaOscLeft.stop();
            this.thetaOscLeft.disconnect();
            this.thetaOscLeft = null;
          }
          if (this.thetaOscRight) {
            this.thetaOscRight.stop();
            this.thetaOscRight.disconnect();
            this.thetaOscRight = null;
          }
          if (this.cosmicOsc) {
            this.cosmicOsc.stop();
            this.cosmicOsc.disconnect();
            this.cosmicOsc = null;
          }
          this.brownNoiseGain = null;
          this.brownNoiseFilter = null;
          this.thetaGain = null;
          this.cosmicGain = null;
        } catch {
          // ignore cleanup errors
        }
      }, 450);

      this.isAmbiencePlaying = false;
    } catch (e) {
      console.warn("Could not stop ambience:", e);
      this.isAmbiencePlaying = false;
    }
  }

  public toggleAmbience(): boolean {
    if (this.isAmbiencePlaying) {
      this.stopAmbience();
      return false;
    } else {
      this.startAmbience();
      return true;
    }
  }

  private playNoiseTransient(startTime: number, duration: number, volume: number): void {
    if (!this.ctx) return;
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(2000, startTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);
      else gain.connect(this.ctx.destination);

      noise.start(startTime);
    } catch {
      // Ignore noise failure
    }
  }
}

export const cyberAudio = new CyberAudioManager();
