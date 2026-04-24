import { useState, useEffect, useCallback, useRef } from 'react';
import { Reel } from './components/Reel';
import { useSounds } from './hooks/useSounds';
import {
  GAME_CONFIG,
  PoolSampler,
  rollReels,
  rollAsk,
  rollOutcome,
  rollInvestor,
  rollFounderQuote,
  generateStartupName,
  computeRoundResult,
  getVcTitle,
  generateTermSheet,
  formatNarrativeHeadline,
  type Action,
  type Ending,
  type RoundResult,
} from './lib/gameLogic';
import { formatShareGrid, pickHighlights } from './lib/shareGrid';
import type { Reels } from './lib/types';

type Phase =
  | 'intro'
  | 'briefing'
  | 'spinning'
  | 'decision'
  | 'outcome'
  | 'gameover'
  | 'termsheet';

const VAULT_KEY = 'flop-machine:vault:v2';
const LINKEDIN_URL = 'https://www.linkedin.com/in/darrenmsmith/';
const TIP_URL = 'https://buymeacoffee.com/dar.ren';

interface VaultEntry {
  id: number;
  at: string;
  finalFundM: number;
  multiple: number;
  title: string;
  ending: Ending;
}

interface ActivePitch {
  startupName: string;
  reels: Reels;
  founderQuote: string;
  investor: string;
  askM: number;
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [fundM, setFundM] = useState<number>(GAME_CONFIG.startingFundM);
  const [roundNumber, setRoundNumber] = useState<number>(0);
  const [history, setHistory] = useState<RoundResult[]>([]);
  const [reels, setReels] = useState<Reels>({ who: 'READY', problem: 'TO', twist: 'SPIN' });
  const [activePitch, setActivePitch] = useState<ActivePitch | null>(null);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const [muted, setMuted] = useState(false);
  const [vault, setVault] = useState<VaultEntry[]>([]);
  const [showVault, setShowVault] = useState(false);
  const [shareToast, setShareToast] = useState('');
  const [termSheet, setTermSheet] = useState<string[]>([]);
  const [badPassCount, setBadPassCount] = useState<number>(0);
  const [bonusRounds, setBonusRounds] = useState<number>(0);
  const [ending, setEnding] = useState<Ending>('carried');
  const [leverPulled, setLeverPulled] = useState(false);
  const [warning, setWarning] = useState<string>('');
  const samplerRef = useRef<PoolSampler>(new PoolSampler());

  const {
    ensureAudioSync,
    playClack,
    playDing,
    playChaChing,
    playBuzz,
    playStamp,
  } = useSounds(muted);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(VAULT_KEY);
      if (raw) setVault(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(VAULT_KEY, JSON.stringify(vault)); }
    catch { /* ignore */ }
  }, [vault]);

  const startNewFund = () => {
    ensureAudioSync();
    samplerRef.current.reset();
    setFundM(GAME_CONFIG.startingFundM);
    setRoundNumber(0);
    setHistory([]);
    setLastResult(null);
    setActivePitch(null);
    setReels({ who: 'READY', problem: 'TO', twist: 'SPIN' });
    setTermSheet([]);
    setShowVault(false);
    setBadPassCount(0);
    setBonusRounds(0);
    setEnding('carried');
    setLeverPulled(false);
    setWarning('');
    setPhase('intro');
  };

  const goToBriefing = () => {
    ensureAudioSync();
    samplerRef.current.reset();
    setFundM(GAME_CONFIG.startingFundM);
    setRoundNumber(0);
    setHistory([]);
    setLastResult(null);
    setActivePitch(null);
    setReels({
      who: 'A HYPER-SPECIFIC AUDIENCE',
      problem: 'THE WEIRD PAIN POINT THEY HAVE',
      twist: 'AN AI "SOLUTION" TO SELL THEM',
    });
    setBadPassCount(0);
    setBonusRounds(0);
    setEnding('carried');
    setLeverPulled(false);
    setWarning('');
    setPhase('briefing');
  };

  const spinNext = () => {
    ensureAudioSync();
    if (phase === 'spinning' || phase === 'decision') return;

    setLeverPulled(true);
    setTimeout(() => setLeverPulled(false), 450);

    const nextRoundNumber = roundNumber + 1;
    setRoundNumber(nextRoundNumber);
    setPhase('spinning');
    setLastResult(null);
    setWarning('');

    const s = samplerRef.current;
    const finalReels = rollReels(s);
    const startupName = generateStartupName(finalReels.who, s);
    const founderQuote = rollFounderQuote(s);
    const investor = rollInvestor(s);
    const askM = rollAsk();

    let clackTicks = 0;
    const clackInt = setInterval(() => {
      playClack();
      clackTicks++;
      if (clackTicks > 22) clearInterval(clackInt);
    }, 90);

    const spinReel = (key: keyof Reels, durationMs: number, landingPitch: string) => {
      const interval = setInterval(() => {
        setReels((prev) => ({ ...prev, [key]: rollReels(s)[key] }));
      }, 70);
      setTimeout(() => {
        clearInterval(interval);
        setReels((prev) => ({ ...prev, [key]: finalReels[key] }));
        playDing(landingPitch);
      }, durationMs);
    };

    spinReel('who', 1100, 'C5');
    spinReel('problem', 1400, 'E5');
    spinReel('twist', 1700, 'G5');

    setTimeout(() => {
      clearInterval(clackInt);
      setActivePitch({ startupName, reels: finalReels, founderQuote, investor, askM });
      setPhase('decision');
    }, 1750);
  };

  const takeAction = useCallback((action: Action) => {
    if (!activePitch || phase !== 'decision') return;

    const outcome = rollOutcome(samplerRef.current);
    const result = computeRoundResult({
      roundNumber,
      startupName: activePitch.startupName,
      reels: activePitch.reels,
      founderQuote: activePitch.founderQuote,
      investor: activePitch.investor,
      askM: activePitch.askM,
      action,
      outcome,
    });

    const newFund = fundM + result.fundDeltaM;
    const newHistory = [...history, result];
    let newBadPassCount = badPassCount;
    if (result.badPass) newBadPassCount = badPassCount + 1;
    let newBonusRounds = bonusRounds;
    if (result.goodCall) newBonusRounds = bonusRounds + 1;

    setHistory(newHistory);
    setFundM(newFund);
    setLastResult(result);
    setBadPassCount(newBadPassCount);
    setBonusRounds(newBonusRounds);
    setPhase('outcome');

    if (result.fundDeltaM > 3) playChaChing();
    else if (result.goodCall) playChaChing();
    else if (result.fundDeltaM >= 0) playDing('E5');
    else playBuzz();

    if (result.goodCall) {
      setWarning('🎁 FREE SPIN EARNED. PARTNERS RESPECT GOOD TASTE.');
    } else if (result.badPass && newBadPassCount < GAME_CONFIG.maxBadPasses) {
      const remaining = GAME_CONFIG.maxBadPasses - newBadPassCount;
      setWarning(`⚠ THE PARTNERS ARE CONCERNED. ${remaining} MORE BAD PASS${remaining === 1 ? '' : 'ES'} AND YOU\'RE OUT.`);
    }

    const busted = newFund <= 0;
    const fired = newBadPassCount >= GAME_CONFIG.maxBadPasses;
    const completedAllRounds = roundNumber >= GAME_CONFIG.maxRounds + newBonusRounds;

    if (busted || fired || completedAllRounds) {
      const endState: Ending = fired ? 'fired' : busted ? 'busted' : 'carried';
      setEnding(endState);
      const title = getVcTitle(Math.max(0, newFund), endState);
      setTimeout(() => {
        playStamp();
        const entry: VaultEntry = {
          id: Date.now(),
          at: new Date().toLocaleString(),
          finalFundM: Math.max(0, newFund),
          multiple: newFund / GAME_CONFIG.startingFundM,
          title,
          ending: endState,
        };
        setVault((prev) => [entry, ...prev].slice(0, 25));
        const ts = generateTermSheet({
          ideaName: 'The Fund',
          investor: result.investor,
          valuationM: Math.max(1, Math.abs(newFund)),
        });
        setTermSheet(ts);
        setPhase('gameover');
      }, 1600);
    }
  }, [activePitch, phase, roundNumber, fundM, history, badPassCount, bonusRounds, playChaChing, playDing, playBuzz, playStamp]);

  const quitFund = () => {
    if (!window.confirm('Walk away from the fund now? Your current balance will be locked in.')) return;
    setEnding('quit');
    const title = getVcTitle(Math.max(0, fundM), 'quit');
    playStamp();
    const entry: VaultEntry = {
      id: Date.now(),
      at: new Date().toLocaleString(),
      finalFundM: Math.max(0, fundM),
      multiple: fundM / GAME_CONFIG.startingFundM,
      title,
      ending: 'quit',
    };
    setVault((prev) => [entry, ...prev].slice(0, 25));
    const ts = generateTermSheet({
      ideaName: 'The Fund',
      investor: rollInvestor(samplerRef.current),
      valuationM: Math.max(1, Math.abs(fundM)),
    });
    setTermSheet(ts);
    setPhase('gameover');
  };

  const narrativeHeadline = formatNarrativeHeadline({
    startingM: GAME_CONFIG.startingFundM,
    finalFundM: Math.max(0, fundM),
    ending,
    badPassCount,
    roundsPlayed: history.length,
    title: getVcTitle(Math.max(0, fundM), ending),
  });

  const handleShareClipboard = () => {
    const url = typeof window !== 'undefined' ? window.location.origin : 'https://flop-machine.netlify.app';
    const grid = formatShareGrid({ rounds: history, narrativeHeadline, url });
    try {
      void navigator.clipboard?.writeText(grid);
      setShareToast('Results copied to clipboard. Paste it anywhere.');
    } catch {
      setShareToast('Copy failed — select and copy manually.');
    }
    setTimeout(() => setShareToast(''), 2800);
  };

  const handleShareLinkedIn = () => {
    const url = typeof window !== 'undefined' ? window.location.origin : 'https://flop-machine.netlify.app';
    const grid = formatShareGrid({ rounds: history, narrativeHeadline, url });
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    try {
      void navigator.clipboard?.writeText(grid);
      setShareToast('Results copied. Paste them into the LinkedIn post window.');
    } catch {
      setShareToast('LinkedIn opening…');
    }
    setTimeout(() => setShareToast(''), 3200);
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const clearVault = () => {
    if (window.confirm('Clear all prior fund reports? Cannot be undone.')) setVault([]);
  };

  const finalTitle = getVcTitle(Math.max(0, fundM), ending);

  return (
    <div
      className="min-h-screen text-white p-4 md:p-8 relative overflow-hidden scanlines"
      style={{
        background: 'radial-gradient(ellipse at top, #1a0620 0%, #0a0510 60%, #050208 100%)',
        fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
      }}
    >
      <div className="relative max-w-3xl mx-auto z-10">
        <button
          onClick={() => setMuted((m) => !m)}
          className="absolute top-0 right-0 text-neutral-400 hover:text-amber transition-colors text-xl p-2 z-20"
          aria-label={muted ? 'unmute' : 'mute'}
        >
          {muted ? '🔇' : '🔊'}
        </button>

        <Header />

        {(phase === 'spinning' || phase === 'decision' || phase === 'outcome' || phase === 'briefing') && (
          <FundBar
            fundM={fundM}
            roundNumber={phase === 'briefing' ? 0 : roundNumber}
            maxRounds={GAME_CONFIG.maxRounds}
            bonusRounds={bonusRounds}
            badPassCount={badPassCount}
            maxBadPasses={GAME_CONFIG.maxBadPasses}
          />
        )}

        {warning && (phase === 'decision' || phase === 'outcome') && (
          <div
            className="mb-4 border-2 border-magenta bg-magenta/10 text-magenta text-center text-xs md:text-sm py-2 px-3 tracking-[0.15em]"
            style={{ fontFamily: "'Bungee', cursive" }}
          >
            {warning}
          </div>
        )}

        {phase === 'intro' && (
          <Intro
            onStart={goToBriefing}
            vaultCount={vault.length}
            onShowVault={() => setShowVault(true)}
          />
        )}

        {phase === 'briefing' && (
          <Briefing reels={reels} onPullLever={spinNext} leverPulled={leverPulled} />
        )}

        {(phase === 'spinning' || phase === 'decision' || phase === 'outcome') && (
          <section className="space-y-4 mb-6">
            <Reel label="WHO" value={reels.who} accent="#ff2d6f" spinning={phase === 'spinning'} />
            <Reel label="IS STUCK BECAUSE" value={reels.problem} accent="#ffc107" spinning={phase === 'spinning'} small />
            <Reel label="BUILD IT" value={reels.twist} accent="#a8ff60" spinning={phase === 'spinning'} />
          </section>
        )}

        {phase === 'spinning' && (
          <div className="w-full py-4 md:py-6 text-center text-lg md:text-xl text-amber tracking-[0.3em]"
               style={{ fontFamily: "'Bungee', cursive" }}>
            <span className="shake inline-block">⚡ CHAOS INCOMING ⚡</span>
          </div>
        )}

        {phase === 'decision' && activePitch && (
          <PitchDecision pitch={activePitch} fundM={fundM} onAction={takeAction} onQuit={quitFund} />
        )}

        {phase === 'outcome' && lastResult && (
          <OutcomeReveal
            result={lastResult}
            onNext={spinNext}
            isFinalRound={roundNumber >= GAME_CONFIG.maxRounds + bonusRounds || fundM <= 0 || badPassCount >= GAME_CONFIG.maxBadPasses}
          />
        )}

        {phase === 'gameover' && (
          <GameOver
            ending={ending}
            fundM={Math.max(0, fundM)}
            narrativeHeadline={narrativeHeadline}
            title={finalTitle}
            history={history}
            onCopy={handleShareClipboard}
            onShare={handleShareLinkedIn}
            onTermSheet={() => setPhase('termsheet')}
            onNewFund={startNewFund}
            shareToast={shareToast}
          />
        )}

        {phase === 'termsheet' && (
          <TermSheetView termSheet={termSheet} onBack={() => setPhase('gameover')} />
        )}

        {showVault && phase === 'intro' && (
          <VaultPanel vault={vault} onClose={() => setShowVault(false)} onClear={clearVault} />
        )}

        <Footer />
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="mb-4 md:mb-6 text-center">
      <div className="text-[10px] md:text-xs text-neutral-400 tracking-[0.3em] mb-2">
        PROFESSOR SMITH&apos;S
      </div>
      <h1
        className="text-3xl md:text-5xl leading-none tracking-tight"
        style={{
          fontFamily: "'Bungee', cursive",
          color: '#ff2d6f',
          textShadow: '0 0 24px rgba(255,45,111,0.55), 3px 3px 0 #ffc107, 6px 6px 0 rgba(168,255,96,0.35)',
        }}
      >
        BILLION-DOLLAR
        <br />
        AI BUSINESS
        <br />
        GENERATOR
      </h1>
      <div className="mt-5 inline-block px-3 py-1 border border-lime/50 text-lime text-[10px] tracking-[0.3em]">
        THE FLOP MACHINE™ · MODEL 2026
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-12 flex flex-col items-center gap-3">
      <a
        href={TIP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] md:text-xs text-neutral-500 hover:text-amber tracking-[0.3em] transition-colors"
      >
        ☕ TIP THE MANAGING PARTNER
      </a>
      <div className="text-[10px] text-neutral-500 tracking-[0.3em] text-center">
        PROFESSIONALLY TERRIBLE IDEAS SINCE 2026
      </div>
    </footer>
  );
}

function FundBar({
  fundM, roundNumber, maxRounds, bonusRounds, badPassCount, maxBadPasses,
}: {
  fundM: number;
  roundNumber: number;
  maxRounds: number;
  bonusRounds: number;
  badPassCount: number;
  maxBadPasses: number;
}) {
  const low = fundM <= 5;
  const remaining = Math.max(0, maxBadPasses - badPassCount);
  const displayRound = Math.min(roundNumber, maxRounds + bonusRounds);
  return (
    <div className="flex items-center justify-between mb-5 px-1 gap-2">
      <div>
        <div className="text-[9px] text-neutral-400 tracking-[0.3em]">FUND</div>
        <div
          className={`text-2xl md:text-3xl ${low ? 'text-magenta' : 'text-lime'}`}
          style={{ fontFamily: "'Bungee', cursive" }}
        >
          ${Math.max(0, fundM)}M
        </div>
      </div>
      <div className="text-center">
        <div className="text-[9px] text-neutral-400 tracking-[0.3em]">PARTNER FAITH</div>
        <div className="text-lg md:text-xl tracking-[0.15em]">
          {Array.from({ length: maxBadPasses }).map((_, i) => (
            <span key={i} className={i < remaining ? 'text-lime' : 'text-neutral-700'}>●</span>
          ))}
        </div>
      </div>
      <div className="text-right">
        <div className="text-[9px] text-neutral-400 tracking-[0.3em]">
          ROUND{bonusRounds > 0 ? ` · +${bonusRounds} FREE` : ''}
        </div>
        <div className="text-2xl md:text-3xl text-amber" style={{ fontFamily: "'Bungee', cursive" }}>
          {displayRound}/{maxRounds + bonusRounds}
        </div>
      </div>
    </div>
  );
}

function Intro({
  onStart, vaultCount, onShowVault,
}: { onStart: () => void; vaultCount: number; onShowVault: () => void; }) {
  return (
    <div className="text-center mb-8 slide-in">
      <p className="text-neutral-300 text-sm md:text-base mb-6 leading-relaxed max-w-lg mx-auto">
        You&apos;re Professor Smith&apos;s newest partner. You&apos;ve got a <span className="text-lime">$20M seed fund</span> and
        ten AI startups walking through the door. Fund the winners. Short the obvious flops.
        Pass if you must — but the partners are always watching.
      </p>
      <div className="max-w-md mx-auto">
        <button
          onClick={onStart}
          className="w-full py-6 md:py-8 text-lg md:text-2xl tracking-[0.2em] border-4 border-magenta text-magenta hover:bg-magenta hover:text-black transition-all duration-200 active:scale-[0.98]"
          style={{ fontFamily: "'Bungee', cursive", boxShadow: '0 0 30px rgba(255,45,111,0.25)' }}
        >
          ▶ START INVESTING
        </button>
        {vaultCount > 0 && (
          <button
            onClick={onShowVault}
            className="block w-full mt-5 text-[10px] text-neutral-400 hover:text-amber tracking-[0.3em]"
          >
            PRIOR FUND REPORTS ({vaultCount})
          </button>
        )}
      </div>
    </div>
  );
}

function Briefing({
  reels, onPullLever, leverPulled,
}: { reels: Reels; onPullLever: () => void; leverPulled: boolean; }) {
  return (
    <div className="slide-in mb-6">
      <section className="space-y-4 mb-5 opacity-60">
        <Reel label="WHO" value={reels.who} accent="#ff2d6f" spinning={false} />
        <Reel label="IS STUCK BECAUSE" value={reels.problem} accent="#ffc107" spinning={false} small />
        <Reel label="BUILD IT" value={reels.twist} accent="#a8ff60" spinning={false} />
      </section>
      <div className="border-2 border-amber/60 p-3 md:p-4 text-[11px] md:text-xs text-neutral-200 leading-relaxed mb-5 bg-black/40">
        <div className="text-amber mb-2 tracking-[0.25em]" style={{ fontFamily: "'Bungee', cursive" }}>
          HOW IT WORKS
        </div>
        <div className="mb-1"><span className="text-lime">💰 FUND</span> — you back the startup. Wins pay 1.5×–5×. Flops wipe out your stake.</div>
        <div className="mb-1"><span className="text-amber">🎯 SHORT</span> — costs $1M. Flops pay $3M. Wins burn you $1M.</div>
        <div className="mb-1"><span className="text-magenta">⏭️ PASS</span> — free, but passing on a winner costs $3M and a point of partner faith.</div>
        <div className="mt-3 text-neutral-400">Three bad passes and you&apos;re fired. Fund hits $0 and you&apos;re busted. Survive 10 rounds and they&apos;ll let you keep your badge.</div>
      </div>
      <LeverControl label="PULL THE LEVER" pulled={leverPulled} onClick={onPullLever} />
    </div>
  );
}

function LeverControl({
  label, pulled, onClick,
}: { label: string; pulled: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center justify-center gap-5 py-2">
      <button
        onClick={onClick}
        className="flex-1 max-w-sm py-5 md:py-6 text-base md:text-xl tracking-[0.2em] border-4 border-magenta text-magenta hover:bg-magenta hover:text-black transition-all duration-200 active:scale-[0.98]"
        style={{ fontFamily: "'Bungee', cursive", boxShadow: '0 0 30px rgba(255,45,111,0.25)' }}
      >
        ▶ {label}
      </button>
      <SlotLever pulled={pulled} onClick={onClick} />
    </div>
  );
}

function SlotLever({ pulled, onClick }: { pulled: boolean; onClick: () => void }) {
  const width = 64;
  const height = 150;
  const stickRest = 80;
  const stickPulled = 110;
  const ballRest = 0;
  const ballPulled = 78;
  return (
    <button
      onClick={onClick}
      aria-label="pull the lever"
      className="relative flex flex-col items-center active:scale-95 transition-transform"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <div
        className="bg-neutral-500 rounded-sm"
        style={{
          width: '18px',
          height: pulled ? `${stickPulled}px` : `${stickRest}px`,
          transition: 'height 0.4s cubic-bezier(0.25, 1.4, 0.5, 1)',
          boxShadow: 'inset -3px 0 0 rgba(0,0,0,0.4), inset 3px 0 0 rgba(255,255,255,0.12)',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: '46px',
          height: '46px',
          top: pulled ? `${ballPulled}px` : `${ballRest}px`,
          background: 'radial-gradient(circle at 30% 30%, #ff9fba, #ff2d6f 55%, #8d0930)',
          boxShadow: '0 6px 16px rgba(255,45,111,0.55), inset -4px -4px 0 rgba(0,0,0,0.4), inset 4px 4px 0 rgba(255,255,255,0.28)',
          transition: 'top 0.4s cubic-bezier(0.25, 1.4, 0.5, 1)',
        }}
      />
      <div
        className="w-14 bg-neutral-900 rounded-sm mt-auto"
        style={{
          height: '10px',
          boxShadow: 'inset 0 3px 0 rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.5)',
          borderTop: '1px solid #333',
        }}
      />
    </button>
  );
}

function PitchDecision({
  pitch, fundM, onAction, onQuit,
}: {
  pitch: ActivePitch;
  fundM: number;
  onAction: (a: Action) => void;
  onQuit: () => void;
}) {
  const cantFund = fundM < pitch.askM;
  const cantShort = fundM < 1;
  return (
    <div className="slide-in space-y-4 mb-4">
      <div className="border-2 border-neutral-700 p-4 md:p-5 bg-black/40">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="text-xl md:text-2xl text-amber" style={{ fontFamily: "'Bungee', cursive" }}>
            {pitch.startupName}
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-[9px] text-neutral-400 tracking-[0.3em]">ASK</div>
            <div className="text-lg md:text-xl text-lime" style={{ fontFamily: "'Bungee', cursive" }}>
              ${pitch.askM}M
            </div>
          </div>
        </div>
        <div className="text-sm md:text-base text-white italic mb-3 leading-relaxed">
          &ldquo;{pitch.founderQuote}&rdquo;
        </div>
        <div className="text-[10px] text-neutral-400 tracking-[0.2em]">
          LEAD: {pitch.investor.toUpperCase()}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
        <button
          onClick={() => onAction('fund')}
          disabled={cantFund}
          className="py-4 md:py-5 border-2 border-lime text-lime hover:bg-lime hover:text-black transition-all tracking-[0.15em] text-sm md:text-base active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ fontFamily: "'Bungee', cursive" }}
        >
          💰 FUND −${pitch.askM}M
        </button>
        <button
          onClick={() => onAction('short')}
          disabled={cantShort}
          className="py-4 md:py-5 border-2 border-amber text-amber hover:bg-amber hover:text-black transition-all tracking-[0.15em] text-sm md:text-base active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ fontFamily: "'Bungee', cursive" }}
        >
          🎯 SHORT −$1M
        </button>
        <button
          onClick={() => onAction('pass')}
          className="py-4 md:py-5 border-2 border-magenta text-magenta hover:bg-magenta hover:text-black transition-all tracking-[0.15em] text-sm md:text-base active:scale-[0.98]"
          style={{ fontFamily: "'Bungee', cursive" }}
        >
          ⏭️ PASS
        </button>
      </div>
      <button
        onClick={onQuit}
        className="w-full text-[10px] text-neutral-500 hover:text-magenta tracking-[0.3em] py-2"
      >
        WALK AWAY FROM THE FUND →
      </button>
    </div>
  );
}

function OutcomeReveal({
  result, onNext, isFinalRound,
}: { result: RoundResult; onNext: () => void; isFinalRound: boolean; }) {
  const [pulled, setPulled] = useState(false);
  const isWin = result.outcome.category === 'win';
  const good = result.fundDeltaM > 0 || result.goodCall;
  const color = good ? '#a8ff60' : result.fundDeltaM === 0 ? '#ffc107' : '#ff2d6f';
  const headline = result.goodCall
    ? 'GOOD CALL. THE PARTNERS APPLAUD.'
    : result.badPass ? 'THEY HIT. YOU MISSED.'
    : result.action === 'fund' && isWin ? 'IT HIT.'
    : result.action === 'fund' && !isWin ? 'WIPED OUT.'
    : result.action === 'short' && !isWin ? 'SHORT PAID.'
    : 'SHORT BURNED.';

  const handlePull = () => {
    setPulled(true);
    setTimeout(() => { setPulled(false); onNext(); }, 380);
  };

  return (
    <div className="slide-in space-y-4 mb-4">
      <div className="p-4 md:p-5 border-2" style={{ borderColor: color, backgroundColor: `${color}08` }}>
        <div
          className="text-sm md:text-base text-center tracking-[0.2em] mb-3"
          style={{ fontFamily: "'Bungee', cursive", color }}
        >
          {headline}
        </div>
        <div className="text-sm md:text-base text-white leading-relaxed mb-4 text-center">
          {result.outcome.text}
        </div>
        <div className="flex items-center justify-center gap-4 pt-3 border-t border-neutral-800">
          <div className="text-[10px] text-neutral-400 tracking-[0.3em]">FUND DELTA</div>
          <div
            className="text-3xl md:text-4xl"
            style={{ fontFamily: "'Bungee', cursive", color, textShadow: `0 0 18px ${color}66` }}
          >
            {result.goodCall ? '✓' : result.fundDeltaM >= 0 ? `+$${result.fundDeltaM}M` : `−$${Math.abs(result.fundDeltaM)}M`}
          </div>
        </div>
      </div>
      {!isFinalRound && (
        <LeverControl label="NEXT PITCH" pulled={pulled} onClick={handlePull} />
      )}
    </div>
  );
}

function GameOver({
  ending, fundM, narrativeHeadline, title, history, onCopy, onShare, onTermSheet, onNewFund, shareToast,
}: {
  ending: Ending;
  fundM: number;
  narrativeHeadline: string;
  title: string;
  history: RoundResult[];
  onCopy: () => void;
  onShare: () => void;
  onTermSheet: () => void;
  onNewFund: () => void;
  shareToast: string;
}) {
  const stampLabel =
    ending === 'fired' ? 'FIRED' :
    ending === 'busted' ? 'BUSTED' :
    ending === 'quit' ? 'WALKED' : 'CARRIED';
  const stampBorder = ending === 'carried' ? 'border-lime text-lime' : 'border-magenta text-magenta';
  const headerTag =
    ending === 'fired' ? 'THE PARTNERS WERE DONE WITH YOU' :
    ending === 'busted' ? 'THE FUND IS DEAD' :
    ending === 'quit' ? 'YOU WALKED' : 'YOU CARRIED · ROUND 10';

  return (
    <div className="slide-in space-y-5">
      <div className="text-center">
        <div className="text-[10px] text-neutral-400 tracking-[0.3em] mb-3">{headerTag}</div>
        <div className="border-4 border-amber p-5 md:p-7 relative bg-black/40">
          <div
            className={`absolute -top-3 -right-3 border-2 text-xs px-2 py-1 stamp origin-center ${stampBorder}`}
            style={{ fontFamily: "'Bungee', cursive" }}
          >
            {stampLabel}
          </div>
          <div
            className="text-base md:text-lg text-white leading-relaxed text-center mb-4"
            style={{ fontFamily: "'Bungee', cursive" }}
          >
            {narrativeHeadline}
          </div>
          <div className="flex items-center justify-center gap-6 pt-4 border-t border-neutral-800">
            <div className="text-center">
              <div className="text-[10px] tracking-[0.3em] text-neutral-400">WALKED WITH</div>
              <div
                className={`text-3xl md:text-4xl ${ending === 'carried' ? 'text-lime' : 'text-magenta'}`}
                style={{ fontFamily: "'Bungee', cursive" }}
              >
                ${fundM}M
              </div>
            </div>
            <div className="w-px h-10 bg-neutral-700" />
            <div className="text-center">
              <div className="text-[10px] tracking-[0.3em] text-neutral-400">MULTIPLE</div>
              <div
                className={`text-3xl md:text-4xl ${ending === 'carried' ? 'text-lime' : 'text-magenta'}`}
                style={{ fontFamily: "'Bungee', cursive" }}
              >
                {(fundM / 20).toFixed(2)}x
              </div>
            </div>
          </div>
        </div>
      </div>

      <PortfolioGrid history={history} />

      <div className="space-y-3">
        <button
          onClick={onCopy}
          className="w-full py-3 md:py-4 border-2 border-lime text-lime hover:bg-lime hover:text-black transition-all tracking-[0.2em] text-sm md:text-base active:scale-[0.98]"
          style={{ fontFamily: "'Bungee', cursive" }}
        >
          📋 SHARE RESULTS
        </button>
        <button
          onClick={onShare}
          className="w-full py-3 md:py-4 border-2 border-lime text-lime hover:bg-lime hover:text-black transition-all tracking-[0.2em] text-sm md:text-base active:scale-[0.98]"
          style={{ fontFamily: "'Bungee', cursive" }}
        >
          🔗 POST TO LINKEDIN
        </button>
        {(ending === 'carried' || ending === 'quit') && (
          <button
            onClick={onTermSheet}
            className="w-full py-3 md:py-4 border-2 border-magenta text-magenta hover:bg-magenta hover:text-black transition-all tracking-[0.2em] text-sm md:text-base active:scale-[0.98]"
            style={{ fontFamily: "'Bungee', cursive" }}
          >
            📄 REQUEST TERM SHEET
          </button>
        )}
        {shareToast && (
          <div className="text-center text-[10px] text-lime tracking-[0.3em]">{shareToast}</div>
        )}
        <button
          onClick={onNewFund}
          className="w-full py-3 border-2 border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-neutral-100 transition-all tracking-[0.2em] text-sm active:scale-[0.98]"
          style={{ fontFamily: "'Bungee', cursive" }}
        >
          ↻ RAISE A NEW FUND
        </button>
        <a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-[11px] md:text-xs text-amber hover:text-lime tracking-[0.3em] mt-4 transition-colors underline underline-offset-4"
        >
          FOLLOW THE MANAGING PARTNER ↗
        </a>
        {title && (
          <div className="text-center text-[10px] text-neutral-500 tracking-[0.2em] italic mt-2 leading-relaxed">
            {title}
          </div>
        )}
      </div>
    </div>
  );
}

function PortfolioGrid({ history }: { history: RoundResult[] }) {
  const actionEmoji = { fund: '💰', short: '🎯', pass: '⏭️' } as const;
  const actionLabel = { fund: 'FUNDED', short: 'SHORTED', pass: 'PASSED' } as const;
  const { bestBet, worstCall } = pickHighlights(history);

  return (
    <div className="space-y-4">
      {(bestBet || worstCall) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {bestBet && (
            <div className="border-2 border-lime/60 p-3 md:p-4 bg-lime/5">
              <div className="text-[10px] text-lime tracking-[0.3em] mb-1">🏆 BEST BET</div>
              <div
                className="text-base md:text-lg text-lime leading-tight"
                style={{ fontFamily: "'Bungee', cursive" }}
              >
                {bestBet.startupName}
              </div>
              <div className="text-xs text-neutral-300 mt-1">
                {actionLabel[bestBet.action]} · +${bestBet.fundDeltaM}M
              </div>
            </div>
          )}
          {worstCall && (
            <div className="border-2 border-magenta/60 p-3 md:p-4 bg-magenta/5">
              <div className="text-[10px] text-magenta tracking-[0.3em] mb-1">💀 WORST L</div>
              <div
                className="text-base md:text-lg text-magenta leading-tight"
                style={{ fontFamily: "'Bungee', cursive" }}
              >
                {worstCall.startupName}
              </div>
              <div className="text-xs text-neutral-300 mt-1">
                {actionLabel[worstCall.action]} · −${Math.abs(worstCall.fundDeltaM)}M
              </div>
            </div>
          )}
        </div>
      )}

      <div className="border border-neutral-800 p-3 md:p-4">
        <div className="text-[10px] text-lime tracking-[0.2em] mb-3">THE PORTFOLIO</div>
        <div className="space-y-2.5">
          {history.map((r) => {
            const outcomeE = r.outcome.category === 'win' ? '💎' : '💀';
            const deltaColor = r.goodCall
              ? 'text-lime'
              : r.fundDeltaM > 0
                ? 'text-lime'
                : r.fundDeltaM < 0
                  ? 'text-magenta'
                  : 'text-neutral-400';
            const deltaDisplay = r.goodCall
              ? '✓'
              : r.fundDeltaM === 0
                ? '—'
                : r.fundDeltaM > 0
                  ? `+$${r.fundDeltaM}M`
                  : `−$${Math.abs(r.fundDeltaM)}M`;
            return (
              <div key={r.roundNumber} className="flex items-center gap-3">
                <div className="w-6 text-neutral-500 text-right text-xs">{r.roundNumber}</div>
                <div className="text-lg md:text-xl w-12 text-center leading-none">
                  {actionEmoji[r.action]}{outcomeE}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm md:text-base text-amber truncate leading-tight"
                    style={{ fontFamily: "'Bungee', cursive" }}
                  >
                    {r.startupName}
                  </div>
                  <div className="text-[10px] text-neutral-400 tracking-wide">
                    {actionLabel[r.action]} · {r.outcome.category.toUpperCase()}
                  </div>
                </div>
                <div
                  className={`w-16 text-right text-sm md:text-base ${deltaColor}`}
                  style={{ fontFamily: "'Bungee', cursive" }}
                >
                  {deltaDisplay}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TermSheetView({ termSheet, onBack }: { termSheet: string[]; onBack: () => void; }) {
  const [header, ...rest] = termSheet;
  const footer = rest[rest.length - 1];
  const clauses = rest.slice(0, -1);

  return (
    <div className="slide-in space-y-4">
      <div className="border-4 border-magenta p-5 md:p-7 bg-black/40">
        <div
          className="text-center text-sm md:text-base text-magenta mb-5"
          style={{ fontFamily: "'Bungee', cursive" }}
        >
          {header}
        </div>
        <ol className="space-y-2 text-sm md:text-base text-neutral-200 list-decimal pl-5 mb-5">
          {clauses.map((c, i) => (
            <li key={i} className="leading-relaxed">{c}</li>
          ))}
        </ol>
        <div className="pt-4 border-t border-neutral-800 text-xs text-neutral-400 italic text-center">
          {footer}
        </div>
      </div>
      <button
        onClick={onBack}
        className="w-full py-3 border-2 border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-neutral-100 transition-all tracking-[0.2em] text-sm active:scale-[0.98]"
        style={{ fontFamily: "'Bungee', cursive" }}
      >
        ← BACK
      </button>
    </div>
  );
}

function VaultPanel({
  vault, onClose, onClear,
}: { vault: VaultEntry[]; onClose: () => void; onClear: () => void; }) {
  return (
    <div className="slide-in border-t border-neutral-800 pt-6 mt-6">
      <div className="flex items-center justify-between mb-5">
        <h2
          className="text-xl md:text-2xl tracking-[0.2em] text-lime"
          style={{ fontFamily: "'Bungee', cursive" }}
        >
          PRIOR FUNDS
        </h2>
        <div className="flex items-center gap-3">
          <button onClick={onClear} className="text-[10px] text-neutral-500 hover:text-magenta tracking-[0.3em]">
            CLEAR
          </button>
          <button onClick={onClose} className="text-[10px] text-neutral-500 hover:text-amber tracking-[0.3em]">
            CLOSE
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {vault.length === 0 && (
          <div className="text-center text-neutral-500 text-sm py-8">
            No prior funds. The ledger starts clean.
          </div>
        )}
        {vault.map((v) => (
          <div key={v.id} className="border border-neutral-800 p-3 md:p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="text-xs md:text-sm leading-relaxed text-amber flex-1" style={{ fontFamily: "'Bungee', cursive" }}>
                {v.title}
              </div>
              <div
                className={`flex-shrink-0 text-lg ${v.ending === 'carried' ? 'text-lime' : 'text-magenta'}`}
                style={{ fontFamily: "'Bungee', cursive" }}
              >
                {v.multiple.toFixed(2)}x
              </div>
            </div>
            <div className="text-xs text-neutral-300 leading-relaxed">
              ${v.finalFundM}M · {v.ending.toUpperCase()}
            </div>
            <div className="text-[10px] text-neutral-500 mt-2 tracking-wider">{v.at}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
