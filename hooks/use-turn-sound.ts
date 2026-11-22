'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Cue = 'place' | 'buy' | 'dispose';
const PREFERENCE = 'acquire:sound';
const VOLUME_PREFERENCE = 'acquire:sound-volume';

/** A sustained double bell, with a master volume and a limiter for headroom. */
export function useTurnSound() {
  const [sound, setSound] = useState(true);
  const [volume, setVolumeState] = useState(100);
  const [audioError, setAudioError] = useState('');
  const enabled = useRef(true);
  const level = useRef(100);
  const audio = useRef<AudioContext | null>(null);
  const output = useRef<GainNode | null>(null);
  const pending = useRef<Cue | null>(null);
  const lastDing = useRef(-Infinity);

  const ring = useCallback((cue: Cue) => {
    const ctx = audio.current;
    const master = output.current;
    if (!enabled.current || !ctx || !master || ctx.state !== 'running') return;
    if (performance.now() - lastDing.current < 180) return;
    lastDing.current = performance.now();
    const pitch = cue === 'buy' ? 784 : cue === 'dispose' ? 698 : 659;
    const now = ctx.currentTime;
    master.gain.setTargetAtTime(level.current / 100, now, 0.01);
    for (const delay of [0, 0.24]) {
      const start = now + delay;
      for (const [harmonic, amplitude] of [[1, 0.48], [2.03, 0.075], [3.87, 0.025]]) {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(pitch * harmonic, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(amplitude, start + 0.01);
        // The previous almost-immediate fade made the ding easy to miss.
        gain.gain.exponentialRampToValueAtTime(amplitude * 0.72, start + 0.11);
        gain.gain.exponentialRampToValueAtTime(amplitude * 0.2, start + 0.34);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.62);
        oscillator.connect(gain);
        gain.connect(master);
        oscillator.start(start);
        oscillator.stop(start + 0.64);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      }
    }
  }, []);

  const unlock = useCallback(() => {
    if (!enabled.current) return;
    try {
      if (!audio.current || audio.current.state === 'closed') {
        const ctx = new AudioContext();
        const master = ctx.createGain();
        const limiter = ctx.createDynamicsCompressor();
        master.gain.value = level.current / 100;
        limiter.threshold.value = -4;
        limiter.knee.value = 3;
        limiter.ratio.value = 12;
        limiter.attack.value = 0.002;
        limiter.release.value = 0.12;
        master.connect(limiter);
        limiter.connect(ctx.destination);
        audio.current = ctx;
        output.current = master;
      }
      const ctx = audio.current;
      const flush = () => {
        if (!enabled.current || audio.current !== ctx) return;
        setAudioError('');
        const cue = pending.current;
        pending.current = null;
        if (cue) ring(cue);
      };
      if (ctx.state === 'running') flush();
      else void ctx.resume().then(flush).catch(() => setAudioError('瀏覽器未允許播放音效。請確認分頁及系統沒有靜音。 · Audio blocked; check browser and system mute settings.'));
    } catch {
      setAudioError('暫時未能播放音效。 · Audio is unavailable in this browser.');
    }
  }, [ring]);

  useEffect(() => {
    try {
      enabled.current = localStorage.getItem(PREFERENCE) !== 'off';
      setSound(enabled.current);
      const stored = localStorage.getItem(VOLUME_PREFERENCE);
      const preferred = stored === null ? 100 : Number(stored);
      level.current = Number.isFinite(preferred) ? Math.max(10, Math.min(100, preferred)) : 100;
      setVolumeState(level.current);
    } catch {}
    document.addEventListener('pointerdown', unlock, { passive: true });
    document.addEventListener('keydown', unlock);
    return () => {
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
      pending.current = null;
      const ctx = audio.current;
      audio.current = null;
      output.current = null;
      if (ctx && ctx.state !== 'closed') void ctx.close().catch(() => {});
    };
  }, [unlock]);

  const playDing = useCallback((cue: Cue) => {
    pending.current = null;
    if (!enabled.current) return;
    if (audio.current?.state === 'running') ring(cue);
    else pending.current = cue;
  }, [ring]);
  const cancelPendingDing = useCallback(() => { pending.current = null; }, []);
  const toggleSound = useCallback(() => {
    enabled.current = !enabled.current;
    setSound(enabled.current);
    if (!enabled.current) pending.current = null;
    try { localStorage.setItem(PREFERENCE, enabled.current ? 'on' : 'off'); } catch {}
    if (enabled.current) unlock();
  }, [unlock]);
  const setVolume = useCallback((percent: number) => {
    level.current = Math.max(10, Math.min(100, percent));
    setVolumeState(level.current);
    if (audio.current && output.current) output.current.gain.setTargetAtTime(level.current / 100, audio.current.currentTime, 0.01);
    try { localStorage.setItem(VOLUME_PREFERENCE, String(level.current)); } catch {}
  }, []);
  const previewSound = useCallback(() => {
    enabled.current = true;
    setSound(true);
    try { localStorage.setItem(PREFERENCE, 'on'); } catch {}
    pending.current = 'place';
    unlock();
  }, [unlock]);
  return { sound, volume, audioError, setVolume, previewSound, toggleSound, playDing, cancelPendingDing };
}
