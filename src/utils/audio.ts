/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a cute ascending synthesizer chord (Sparkly Success Ding!)
 */
export function playSuccessSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Major chord)
  
  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Use triangle wave for a cute, soft, flute-like or bell-like sound
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + index * 0.08);
    
    // Sparkly envelope
    gain.gain.setValueAtTime(0, now + index * 0.08);
    gain.gain.linearRampToValueAtTime(0.15, now + index * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.35);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now + index * 0.08);
    osc.stop(now + index * 0.08 + 0.4);
  });
}

/**
 * Play a descending slide (Undo sound)
 */
export function playUndoSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(587.33, now); // D5
  osc.frequency.exponentialRampToValueAtTime(293.66, now + 0.25); // D4
  
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.28);
}

/**
 * Play a clean popping tap sound
 */
export function playClickSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, now); // A5
  osc.frequency.exponentialRampToValueAtTime(440, now + 0.08); // A4
  
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.09);
}

/**
 * Play a rich celebration fanfare
 */
export function playCelebrateSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Fanfare notes: C5, G5, C6, E6, G6
  const notes = [523.25, 783.99, 1046.50, 1318.51, 1567.98];
  
  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + index * 0.06);
    
    gain.gain.setValueAtTime(0, now + index * 0.06);
    gain.gain.linearRampToValueAtTime(0.12, now + index * 0.06 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.06 + 0.45);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now + index * 0.06);
    osc.stop(now + index * 0.06 + 0.5);
  });
}
