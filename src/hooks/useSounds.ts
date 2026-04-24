import { useEffect, useRef } from 'react';
import * as Tone from 'tone';

interface Synths {
  clack: Tone.MembraneSynth;
  ding: Tone.Synth;
  chaChing: Tone.PolySynth;
  buzz: Tone.Synth;
  stamp: Tone.MembraneSynth;
}

const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function useSounds(muted: boolean) {
  const synthsRef = useRef<Synths | null>(null);
  const audioReadyRef = useRef(false);
  const mutedRef = useRef(muted);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    const clack = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 2,
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
    }).toDestination();
    clack.volume.value = -14;

    const ding = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.6, sustain: 0, release: 0.4 },
    }).toDestination();
    ding.volume.value = -8;

    const chaChing = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.3 },
    }).toDestination();
    chaChing.volume.value = -10;

    const buzz = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.2 },
    }).toDestination();
    buzz.volume.value = -16;

    const stamp = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 3,
      envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
    }).toDestination();
    stamp.volume.value = -10;

    synthsRef.current = { clack, ding, chaChing, buzz, stamp };

    return () => {
      clack.dispose();
      ding.dispose();
      chaChing.dispose();
      buzz.dispose();
      stamp.dispose();
    };
  }, []);

  const ensureAudioSync = () => {
    if (audioReadyRef.current) return;
    try {
      void Tone.start();
      audioReadyRef.current = true;
    } catch {
      /* ignore */
    }
  };

  const playClack = () => {
    if (mutedRef.current || !synthsRef.current) return;
    const pitches = ['C2', 'D2', 'E2', 'C2', 'F2'];
    try {
      synthsRef.current.clack.triggerAttackRelease(pick(pitches), '64n');
    } catch {
      /* ignore */
    }
  };

  const playDing = (pitch = 'E5') => {
    if (mutedRef.current || !synthsRef.current) return;
    try {
      synthsRef.current.ding.triggerAttackRelease(pitch, '8n');
    } catch {
      /* ignore */
    }
  };

  const playChaChing = () => {
    if (mutedRef.current || !synthsRef.current) return;
    try {
      const now = Tone.now();
      synthsRef.current.chaChing.triggerAttackRelease('C5', '16n', now);
      synthsRef.current.chaChing.triggerAttackRelease('E5', '16n', now + 0.07);
      synthsRef.current.chaChing.triggerAttackRelease('G5', '16n', now + 0.14);
      synthsRef.current.chaChing.triggerAttackRelease('C6', '8n', now + 0.21);
    } catch {
      /* ignore */
    }
  };

  const playBuzz = () => {
    if (mutedRef.current || !synthsRef.current) return;
    try {
      const now = Tone.now();
      synthsRef.current.buzz.triggerAttackRelease('C3', '16n', now);
      synthsRef.current.buzz.triggerAttackRelease('A2', '8n', now + 0.09);
    } catch {
      /* ignore */
    }
  };

  const playStamp = () => {
    if (mutedRef.current || !synthsRef.current) return;
    try {
      synthsRef.current.stamp.triggerAttackRelease('C1', '16n');
    } catch {
      /* ignore */
    }
  };

  return {
    ensureAudioSync,
    playClack,
    playDing,
    playChaChing,
    playBuzz,
    playStamp,
  };
}
