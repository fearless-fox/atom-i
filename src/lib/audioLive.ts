/**
 * Audio helpers for Gemini Live API:
 * - PCM 16-bit 16kHz input conversion from Float32
 * - Gapless playback using 24kHz AudioContext and base64 PCM 16-bit
 */

// Convert Float32Array from browser mic into Base64 PCM 16-bit mono 16kHz
export function float32ToPCM16Base64(float32Array: Float32Array): string {
  const pcm16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const uint8 = new Uint8Array(pcm16.buffer);
  let binary = "";
  const len = uint8.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}

// Downsample audio buffer to 16kHz if needed
export function downsampleTo16k(
  inputBuffer: Float32Array,
  sampleRate: number
): Float32Array {
  if (sampleRate === 16000) return inputBuffer;
  const compression = sampleRate / 16000;
  const length = Math.floor(inputBuffer.length / compression);
  const result = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    result[i] = inputBuffer[Math.floor(i * compression)];
  }
  return result;
}

// Audio queue manager for gapless 24kHz playback with active speech detection & echo suppression
export class LiveAudioPlayer {
  private audioCtx: AudioContext | null = null;
  private nextStartTime: number = 0;
  private isPlaying: boolean = false;
  private scheduledNodes: AudioBufferSourceNode[] = [];
  private releaseTimeout: any = null;

  public onPlaybackStateChange?: (isPlaying: boolean) => void;

  constructor() {
    // Lazy initialized on first user interaction
  }

  private initCtx() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass({ sampleRate: 24000 });
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  playChunk(base64PCM: string) {
    this.initCtx();
    if (!this.audioCtx) return;

    // Clear any pending release timeout so state stays strictly playing
    if (this.releaseTimeout) {
      clearTimeout(this.releaseTimeout);
      this.releaseTimeout = null;
    }

    if (!this.isPlaying) {
      this.isPlaying = true;
      this.onPlaybackStateChange?.(true);
    }

    // Decode base64 to binary
    const binary = atob(base64PCM);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Convert to 16-bit PCM Int16
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7fff);
    }

    // Create 24kHz audio buffer
    const audioBuffer = this.audioCtx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const sourceNode = this.audioCtx.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(this.audioCtx.destination);

    const currentTime = this.audioCtx.currentTime;
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime + 0.05; // 50ms buffer
    }

    sourceNode.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
    this.scheduledNodes.push(sourceNode);

    sourceNode.onended = () => {
      const idx = this.scheduledNodes.indexOf(sourceNode);
      if (idx !== -1) this.scheduledNodes.splice(idx, 1);

      // If all scheduled buffers have finished playing out
      if (this.scheduledNodes.length === 0) {
        // Apply an acoustic damping buffer (280ms) so speaker room echo dissipates
        // before turning the user's microphone back on
        if (this.releaseTimeout) {
          clearTimeout(this.releaseTimeout);
        }
        this.releaseTimeout = setTimeout(() => {
          if (this.scheduledNodes.length === 0 && this.isPlaying) {
            this.isPlaying = false;
            this.onPlaybackStateChange?.(false);
          }
          this.releaseTimeout = null;
        }, 280);
      }
    };
  }

  stopAll() {
    if (this.releaseTimeout) {
      clearTimeout(this.releaseTimeout);
      this.releaseTimeout = null;
    }

    for (const node of this.scheduledNodes) {
      try {
        node.stop();
      } catch (e) {
        // already stopped
      }
    }
    this.scheduledNodes = [];
    if (this.audioCtx) {
      this.nextStartTime = this.audioCtx.currentTime;
    }

    if (this.isPlaying) {
      this.isPlaying = false;
      this.onPlaybackStateChange?.(false);
    }
  }

  close() {
    this.stopAll();
    if (this.audioCtx && this.audioCtx.state !== "closed") {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}
