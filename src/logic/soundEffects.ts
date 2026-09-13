class SoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  // Quick crisp tick sound when wheel slice passes pointer
  public playTick(pitchMultiplier: number = 1.0) {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600 * pitchMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(150 * pitchMultiplier, now + 0.03);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch (e) {
      // Ignore audio context errors
    }
  }

  // Triumphant victory fanfare when winner modal pops up
  public playWinFanfare() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [
        { freq: 523.25, duration: 0.12, timeOffset: 0.0 },  // C5
        { freq: 659.25, duration: 0.12, timeOffset: 0.12 }, // E5
        { freq: 783.99, duration: 0.12, timeOffset: 0.24 }, // G5
        { freq: 1046.50, duration: 0.45, timeOffset: 0.36 },// C6
      ];

      notes.forEach((note) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, now + note.timeOffset);

        gain.gain.setValueAtTime(0, now + note.timeOffset);
        gain.gain.linearRampToValueAtTime(0.3, now + note.timeOffset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.timeOffset + note.duration);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + note.timeOffset);
        osc.stop(now + note.timeOffset + note.duration + 0.01);
      });
    } catch (e) {
      // Ignore
    }
  }

  // Button click feedback
  public playClick() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.04);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch (e) {
      // Ignore
    }
  }
}

export const soundManager = new SoundManager();
