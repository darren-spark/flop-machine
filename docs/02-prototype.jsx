import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';

const AUDIENCES = [
  "Competitive birdwatchers",
  "Retired circus performers",
  "Goth accountants",
  "Amateur taxidermists",
  "Homeschooling dads",
  "Senior-citizen esports players",
  "Vegan bodybuilders",
  "Rural crypto miners",
  "Small-town funeral directors",
  "Middle-school librarians",
  "Anxious beekeepers",
  "Pickleball hustlers",
  "Introvert magicians",
  "Pro wrestling referees",
  "Off-grid homesteaders",
  "TikTok grandmas",
  "Amateur ghost hunters",
  "Burned-out lawyers turned potters",
  "Competitive hot sauce makers",
  "Monks with smartphones",
  "Dog butlers",
  "Midlife-crisis mechanics",
  "Recovering influencers",
  "Train-conductor YouTubers",
  "Homebrew rocket enthusiasts",
  "Competitive knitters",
  "Suburban falconers",
  "Nomadic RV dentists",
  "Goat yoga instructors",
  "Retired spies",
  "Vintage Tamagotchi collectors",
  "Stand-up comedy therapists",
  "Undercover food critics",
  "Divorced dads who discovered sourdough",
  "Corporate refugees who bought a farm",
  "Competitive spreadsheet nerds",
  "Small-batch perfumers",
  "Haunted bed-and-breakfast owners",
];

const PROBLEMS = [
  "nobody takes them seriously at Thanksgiving",
  "their entire community lives on one creaky forum from 2004",
  "nobody under 50 knows the craft",
  "they're being scammed by a single vendor with a monopoly",
  "imposter syndrome is eating them alive",
  "they're drowning in paperwork they didn't sign up for",
  "their insurance company has no idea how to categorize them",
  "they can't find each other in the wild",
  "they keep losing their most expensive gear",
  "the supply chain is five guys and one unhinged Etsy shop",
  "their side hustle is out-earning their day job and they're panicking",
  "the Gen Z version of them is doing it better on TikTok",
  "their biggest rival is also their best friend",
  "their hobby is legally gray in three states",
  "they can't tell their spouse how much they've spent",
  "they're accidentally famous on the wrong platform",
  "they need validation but refuse to ask",
  "booking and billing is a full-time job they didn't sign up for",
  "they keep getting outbid on the one resource that matters",
  "the certifying body is corrupt and everyone knows it",
  "they can't prove their results to anyone who matters",
  "they have zero retirement plan",
  "every tutorial online is from 2011 and wrong",
  "the one conference they care about sold out in 90 seconds",
];

const TWISTS = [
  "but it's a subscription box",
  "as a dating app",
  "with a reality-TV angle",
  "powered by an AI that is slightly mean to them",
  "as a worker-owned co-op",
  "with a physical clubhouse in a strip mall",
  "but communication is SMS-only",
  "gamified with real cash prizes",
  "as B2B SaaS with a very aggressive sales team",
  "marketplace with escrow and beef resolution",
  "with a mandatory annual in-person retreat",
  "as a podcast plus Patreon two-step",
  "with a Shopify storefront bolted on as an afterthought",
  "but the whole product is voice-only",
  "as a wholesome competitive league with standings",
  "with a data-and-insights product they pay extra for",
  "but it's a nonprofit for tax reasons",
  "as a LinkedIn for this specific weirdo niche",
  "with a private members-only club",
  "built on top of Substack somehow",
  "as a live event series that tours",
  "powered by a single custom GPT with personality",
  "as a daily accountability group on WhatsApp",
  "with a certification nobody asked for but everyone needs",
  "as a job board nobody realized was missing",
  "with a branded credit card",
  "as a weekly matchup bracket",
  "as a group-buying cartel",
];

const STREAK_TAUNTS = [
  "",
  "ONE DOWN. THE FIRST IS ALWAYS FREE.",
  "TWO IN A ROW. CONCERNING.",
  "HAT TRICK. WE ARE IN THE WOODS.",
  "FOUR. NOBODY ASKED FOR THIS.",
  "FIVE. QUALITY CONTROL HAS LEFT THE BUILDING.",
  "SIX. A UNIVERSE OF BAD IDEAS.",
  "SEVEN. THE MACHINE IS STARTING TO SWEAT.",
  "EIGHT. YOUR IMAGINARY VC IS CRYING.",
  "NINE. WE PASSED CONCERNING TWO STOPS AGO.",
  "TEN. A LEGEND AMONG CHARLATANS.",
];
const streakTaunt = (n) => n <= 10 ? STREAK_TAUNTS[n] : `${n}. YOU ARE NOW THE PROBLEM.`;

const BREAK_LINES = [
  "STREAK BROKEN. FINALLY, SOME TASTE.",
  "STREAK ENDED. MERCY.",
  "COLD STREAK. YOUR STANDARDS RETURN.",
  "THE COMBO DIES. GOOD.",
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const INITIAL_TIME = 45;

export default function WildIdeaMachine() {
  const [phase, setPhase] = useState('idle'); // idle | spinning | landed | timeout
  const [reels, setReels] = useState({ a: 'READY', p: 'TO', t: 'SPIN' });
  const [locks, setLocks] = useState({ a: false, p: false, t: false });
  const [timer, setTimer] = useState(INITIAL_TIME);
  const [reaction, setReaction] = useState('');
  const [ideas, setIdeas] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [streak, setStreak] = useState(0);
  const [breakMsg, setBreakMsg] = useState('');
  const [muted, setMuted] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const synthsRef = useRef(null);
  const audioReadyRef = useRef(false);
  const mutedRef = useRef(false);

  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // Initialize Tone synths once
  useEffect(() => {
    const clack = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 2,
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 }
    }).toDestination();
    clack.volume.value = -14;

    const ding = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.6, sustain: 0, release: 0.4 }
    }).toDestination();
    ding.volume.value = -8;

    const chaChing = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.3 }
    }).toDestination();
    chaChing.volume.value = -10;

    const buzz = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.2 }
    }).toDestination();
    buzz.volume.value = -16;

    synthsRef.current = { clack, ding, chaChing, buzz };

    return () => {
      Object.values(synthsRef.current || {}).forEach(s => s.dispose && s.dispose());
    };
  }, []);

  const ensureAudio = async () => {
    if (!audioReadyRef.current) {
      try { await Tone.start(); audioReadyRef.current = true; } catch (e) {}
    }
  };

  const playClack = () => {
    if (mutedRef.current || !synthsRef.current) return;
    const pitches = ['C2', 'D2', 'E2', 'C2', 'F2'];
    try { synthsRef.current.clack.triggerAttackRelease(pick(pitches), '64n'); } catch (e) {}
  };
  const playDing = (pitch = 'E5') => {
    if (mutedRef.current || !synthsRef.current) return;
    try { synthsRef.current.ding.triggerAttackRelease(pitch, '8n'); } catch (e) {}
  };
  const playChaChing = () => {
    if (mutedRef.current || !synthsRef.current) return;
    try {
      const now = Tone.now();
      synthsRef.current.chaChing.triggerAttackRelease('C5', '16n', now);
      synthsRef.current.chaChing.triggerAttackRelease('E5', '16n', now + 0.07);
      synthsRef.current.chaChing.triggerAttackRelease('G5', '16n', now + 0.14);
      synthsRef.current.chaChing.triggerAttackRelease('C6', '8n',  now + 0.21);
    } catch (e) {}
  };
  const playBuzz = () => {
    if (mutedRef.current || !synthsRef.current) return;
    try {
      const now = Tone.now();
      synthsRef.current.buzz.triggerAttackRelease('C3', '16n', now);
      synthsRef.current.buzz.triggerAttackRelease('A2', '8n', now + 0.09);
    } catch (e) {}
  };

  // Load saved ideas
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get('wim:ideas');
        if (r && r.value) setIdeas(JSON.parse(r.value));
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  // Persist ideas
  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try { await window.storage.set('wim:ideas', JSON.stringify(ideas)); }
      catch (e) { console.error('persist failed', e); }
    })();
  }, [ideas, loaded]);

  const breakStreak = () => {
    if (streak >= 2) {
      setBreakMsg(pick(BREAK_LINES));
      setTimeout(() => setBreakMsg(''), 3200);
    }
    setStreak(0);
  };

  // Countdown
  useEffect(() => {
    if (phase !== 'landed') return;
    if (timer <= 0) {
      setPhase('timeout');
      breakStreak();
      playBuzz();
      return;
    }
    const t = setTimeout(() => setTimer(v => v - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timer]);

  const lockCount = (locks.a ? 1 : 0) + (locks.p ? 1 : 0) + (locks.t ? 1 : 0);
  const allLocked = lockCount === 3;

  const toggleLock = (key) => {
    if (phase === 'spinning') return;
    setLocks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const spinReel = (key, pool, durationMs, landingPitch) => {
    const finalValue = pick(pool);
    const interval = setInterval(() => {
      setReels(prev => ({ ...prev, [key]: pick(pool) }));
    }, 70);
    setTimeout(() => {
      clearInterval(interval);
      setReels(prev => ({ ...prev, [key]: finalValue }));
      playDing(landingPitch);
    }, durationMs);
  };

  const spin = async () => {
    if (phase === 'spinning' || allLocked) return;
    await ensureAudio();
    setPhase('spinning');
    setReaction('');
    setTimer(INITIAL_TIME);
    setBreakMsg('');

    let clackTicks = 0;
    const clackInt = setInterval(() => {
      playClack();
      clackTicks++;
      if (clackTicks > 22) clearInterval(clackInt);
    }, 90);
    setTimeout(() => clearInterval(clackInt), 1850);

    if (!locks.a) spinReel('a', AUDIENCES, 1200, 'C5');
    if (!locks.p) spinReel('p', PROBLEMS, 1550, 'E5');
    if (!locks.t) spinReel('t', TWISTS,   1900, 'G5');

    setTimeout(() => setPhase('landed'), 1950);
  };

  const saveIdea = () => {
    if (!reaction.trim()) return;
    setIdeas(prev => [{
      id: Date.now(),
      ...reels,
      reaction: reaction.trim(),
      at: new Date().toLocaleString(),
    }, ...prev]);
    setReaction('');
    setStreak(s => s + 1);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 900);
    playChaChing();
    setPhase('idle');
  };

  const skipIdea = () => {
    setReaction('');
    breakStreak();
    playBuzz();
    setPhase('idle');
  };

  const deleteIdea = (id) => setIdeas(prev => prev.filter(i => i.id !== id));
  const clearAll = () => {
    if (window.confirm('Clear all captured ideas? Cannot be undone.')) setIdeas([]);
  };

  return (
    <div className="min-h-screen text-white p-4 md:p-8 relative overflow-hidden"
         style={{
           background: 'radial-gradient(ellipse at top, #1a0620 0%, #0a0510 60%, #050208 100%)',
           fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
         }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bungee&family=IBM+Plex+Mono:wght@300;400;500;700&display=swap');
        @keyframes flashGreen {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgba(168, 255, 96, 0.15); }
        }
        .flash-save { animation: flashGreen 0.9s ease-out; }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        .shake { animation: shake 0.15s infinite; }
        @keyframes streakPulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.04); filter: brightness(1.3); }
        }
        .streak-pulse { animation: streakPulse 1.4s ease-in-out infinite; }
        @keyframes breakFade {
          0% { opacity: 0; transform: translateY(-4px); }
          15%, 85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-4px); }
        }
        .break-fade { animation: breakFade 3.2s ease-in-out forwards; }
      `}</style>

      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.035]"
           style={{
             backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.4) 0px, rgba(255,255,255,0.4) 1px, transparent 1px, transparent 3px)",
           }}/>

      <div className={`relative max-w-3xl mx-auto z-10 ${justSaved ? 'flash-save' : ''}`}>

        {/* Mute toggle */}
        <button onClick={() => setMuted(m => !m)}
                className="absolute top-0 right-0 text-neutral-500 hover:text-[#ffc107] transition-colors text-xl p-2 z-20"
                aria-label="mute">
          {muted ? '🔇' : '🔊'}
        </button>

        {/* Header */}
        <header className="mb-6 md:mb-10 text-center">
          <h1 className="text-4xl md:text-6xl leading-none tracking-tight"
              style={{
                fontFamily: "'Bungee', cursive",
                color: '#ff2d6f',
                textShadow: '0 0 24px rgba(255,45,111,0.55), 3px 3px 0 #ffc107, 6px 6px 0 rgba(168,255,96,0.35)',
              }}>
            WILD<br/>IDEA MACHINE
          </h1>
          <p className="mt-4 text-[10px] md:text-xs text-neutral-500 tracking-[0.35em]">
            SPIN · REACT · SHIP
          </p>
          <div className="mt-4 inline-block px-3 py-1 border border-[#a8ff60]/40 text-[#a8ff60] text-[10px] tracking-[0.3em]">
            {ideas.length} IDEA{ideas.length !== 1 ? 'S' : ''} IN THE VAULT
          </div>
        </header>

        {/* Streak banner */}
        <div className="mb-5 min-h-[52px] flex items-center justify-center">
          {streak > 0 && !breakMsg && (
            <div className={`text-center ${streak >= 2 ? 'streak-pulse' : ''}`}>
              <div className="text-2xl md:text-3xl tracking-[0.15em]"
                   style={{ fontFamily: "'Bungee', cursive", color: '#ffc107' }}>
                {'🔥'.repeat(Math.min(streak, 5))} {streak}x STREAK
              </div>
              <div className="text-[10px] md:text-xs text-[#ffc107]/70 tracking-[0.25em] mt-1">
                {streakTaunt(streak)}
              </div>
            </div>
          )}
          {breakMsg && (
            <div className="break-fade text-[11px] md:text-sm text-[#ff2d6f] tracking-[0.25em]"
                 style={{ fontFamily: "'Bungee', cursive" }}>
              💀 {breakMsg}
            </div>
          )}
        </div>

        {/* Reels */}
        <section className="space-y-4 mb-6">
          <Reel label="WHO" value={reels.a} accent="#ff2d6f"
                spinning={phase === 'spinning' && !locks.a}
                locked={locks.a} onToggleLock={() => toggleLock('a')}
                disabled={phase === 'spinning'} />
          <Reel label="IS STUCK BECAUSE" value={reels.p} accent="#ffc107"
                spinning={phase === 'spinning' && !locks.p}
                locked={locks.p} onToggleLock={() => toggleLock('p')}
                disabled={phase === 'spinning'} small />
          <Reel label="BUILD IT" value={reels.t} accent="#a8ff60"
                spinning={phase === 'spinning' && !locks.t}
                locked={locks.t} onToggleLock={() => toggleLock('t')}
                disabled={phase === 'spinning'} />
        </section>

        {/* Lock hint */}
        {lockCount > 0 && phase !== 'spinning' && (
          <div className="text-center text-[10px] text-neutral-500 tracking-[0.25em] mb-4">
            {lockCount} REEL{lockCount !== 1 ? 'S' : ''} LOCKED{allLocked ? ' · UNLOCK ONE TO SPIN' : ''}
          </div>
        )}

        {/* Action zone */}
        <section className="mb-10">
          {phase === 'idle' && (
            <button onClick={spin} disabled={allLocked}
                    className="w-full py-6 md:py-8 text-xl md:text-3xl tracking-[0.2em] border-4 border-[#ff2d6f] text-[#ff2d6f] hover:bg-[#ff2d6f] hover:text-black transition-all duration-200 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#ff2d6f]"
                    style={{ fontFamily: "'Bungee', cursive", boxShadow: allLocked ? 'none' : '0 0 30px rgba(255,45,111,0.25)' }}>
              ▶ PULL THE LEVER
            </button>
          )}

          {phase === 'spinning' && (
            <div className="w-full py-6 md:py-8 text-center text-xl md:text-2xl text-[#ffc107] tracking-[0.3em]"
                 style={{ fontFamily: "'Bungee', cursive" }}>
              <span className="shake inline-block">⚡ CHAOS INCOMING ⚡</span>
            </div>
          )}

          {phase === 'landed' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[#a8ff60] text-[10px] tracking-[0.3em]">GUT REACTION →</div>
                <div className={`text-3xl md:text-4xl ${timer <= 10 ? 'text-[#ff2d6f]' : 'text-[#ffc107]'}`}
                     style={{ fontFamily: "'Bungee', cursive" }}>
                  {timer}s
                </div>
              </div>
              <textarea autoFocus value={reaction}
                onChange={(e) => setReaction(e.target.value)}
                placeholder="Dumb idea? Good idea? Just type. Don't think."
                className="w-full h-28 md:h-32 bg-black/50 border-2 border-[#a8ff60]/40 focus:border-[#a8ff60] outline-none p-3 md:p-4 text-base md:text-lg text-white placeholder-neutral-600 resize-none transition-colors"
              />
              <div className="flex gap-3">
                <button onClick={saveIdea} disabled={!reaction.trim()}
                        className="flex-1 py-3 md:py-4 border-2 border-[#a8ff60] text-[#a8ff60] hover:bg-[#a8ff60] hover:text-black disabled:opacity-25 disabled:cursor-not-allowed transition-all tracking-[0.2em] text-sm md:text-base active:scale-[0.98]"
                        style={{ fontFamily: "'Bungee', cursive" }}>
                  ✓ CAPTURE
                </button>
                <button onClick={skipIdea}
                        className="flex-1 py-3 md:py-4 border-2 border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-all tracking-[0.2em] text-sm md:text-base active:scale-[0.98]"
                        style={{ fontFamily: "'Bungee', cursive" }}>
                  ✗ TRASH
                </button>
              </div>
            </div>
          )}

          {phase === 'timeout' && (
            <div className="space-y-3">
              <div className="text-center py-3 text-[#ff2d6f] text-base md:text-lg tracking-[0.25em]"
                   style={{ fontFamily: "'Bungee', cursive" }}>
                TIME'S UP. PROBABLY FOR THE BEST.
              </div>
              <button onClick={spin}
                      className="w-full py-5 md:py-6 text-xl md:text-2xl tracking-[0.2em] border-4 border-[#ffc107] text-[#ffc107] hover:bg-[#ffc107] hover:text-black transition-all active:scale-[0.98]"
                      style={{ fontFamily: "'Bungee', cursive" }}>
                ↻ SPIN AGAIN
              </button>
            </div>
          )}
        </section>

        {/* The Vault */}
        {ideas.length > 0 && (
          <section className="border-t border-neutral-800 pt-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl md:text-2xl tracking-[0.2em]"
                  style={{ fontFamily: "'Bungee', cursive", color: '#a8ff60' }}>
                THE VAULT
              </h2>
              <button onClick={clearAll}
                      className="text-[10px] text-neutral-600 hover:text-[#ff2d6f] tracking-[0.3em] transition-colors">
                CLEAR ALL
              </button>
            </div>
            <div className="space-y-3">
              {ideas.map(idea => (
                <div key={idea.id}
                     className="border border-neutral-800 p-3 md:p-4 hover:border-neutral-600 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 text-xs md:text-sm leading-relaxed">
                      <span className="text-[#ff2d6f]">{idea.a}</span>
                      <span className="text-neutral-600"> · </span>
                      <span className="text-[#ffc107]">{idea.p}</span>
                      <span className="text-neutral-600"> · </span>
                      <span className="text-[#a8ff60]">{idea.t}</span>
                    </div>
                    <button onClick={() => deleteIdea(idea.id)}
                            className="text-neutral-700 hover:text-[#ff2d6f] text-sm flex-shrink-0 transition-colors"
                            aria-label="delete">
                      ✕
                    </button>
                  </div>
                  <div className="text-white text-sm md:text-base pl-3 border-l-2 border-[#a8ff60]/40 py-0.5">
                    {idea.reaction}
                  </div>
                  <div className="text-[10px] text-neutral-700 mt-2 tracking-wider">{idea.at}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="text-center text-[10px] text-neutral-800 mt-12 tracking-[0.3em]">
          PROFESSIONALLY TERRIBLE IDEAS SINCE 2026
        </footer>
      </div>
    </div>
  );
}

function Reel({ label, value, accent, spinning, locked, onToggleLock, disabled, small }) {
  return (
    <div className="relative">
      <div className="absolute -top-2 left-4 px-2 text-[10px] tracking-[0.25em] z-10"
           style={{ color: accent, backgroundColor: '#0a0510' }}>
        {label}
      </div>
      <button onClick={onToggleLock} disabled={disabled}
              className="absolute -top-2 right-3 px-2 text-sm z-10 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
              style={{ backgroundColor: '#0a0510', color: locked ? accent : 'rgb(120,120,120)' }}
              aria-label={locked ? 'unlock reel' : 'lock reel'}>
        {locked ? '🔒' : '🔓'}
      </button>
      <div className="p-4 md:p-5 min-h-[72px] md:min-h-[88px] flex items-center transition-all duration-200"
           style={{
             border: locked ? `2px dashed ${accent}` : `2px solid ${accent}`,
             boxShadow: spinning
               ? `0 0 24px ${accent}55, inset 0 0 24px ${accent}15`
               : locked
                 ? `0 0 16px ${accent}45, inset 0 0 12px ${accent}25`
                 : `0 0 8px ${accent}20`,
             backgroundColor: spinning ? `${accent}08` : locked ? `${accent}10` : 'rgba(0,0,0,0.3)',
           }}>
        <div className={`leading-tight transition-all duration-100 ${spinning ? 'blur-[1.5px] opacity-80' : ''} ${small ? 'text-sm md:text-base' : 'text-base md:text-xl'}`}
             style={{ fontFamily: "'Bungee', cursive", color: accent }}>
          {value}
        </div>
      </div>
    </div>
  );
}
