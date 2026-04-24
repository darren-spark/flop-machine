import { AUDIENCES } from '../data/audiences';
import { PROBLEMS } from '../data/problems';
import { AI_TWISTS } from '../data/aiTwists';
import { VC_FIRMS } from '../data/vcFirms';
import { EXITS, type ExitFate } from '../data/exits';
import { FOUNDER_QUOTES } from '../data/founderQuotes';
import { STARTUP_SUFFIXES, NAME_STOPWORDS } from '../data/startupSuffixes';
import {
  TERM_SHEET_HEADERS,
  TERM_SHEET_CLAUSES,
  TERM_SHEET_FOOTERS,
} from '../data/termSheets';
import { VC_TITLES, BUSTED_TITLE, FIRED_TITLE } from '../data/vcTitles';
import type { Reels } from './types';

const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

export class PoolSampler {
  private used = new Map<string, Set<number>>();
  private pickIndex(n: number, key: string): number {
    let s = this.used.get(key);
    if (!s) { s = new Set(); this.used.set(key, s); }
    if (s.size >= n) s.clear();
    let idx: number;
    do { idx = Math.floor(Math.random() * n); } while (s.has(idx));
    s.add(idx);
    return idx;
  }
  pickUnique<T>(pool: readonly T[], key: string): T {
    return pool[this.pickIndex(pool.length, key)];
  }
  pickUniqueBy<T>(pool: readonly T[], key: string, predicate: (item: T) => boolean): T {
    const indexes: number[] = [];
    for (let i = 0; i < pool.length; i++) if (predicate(pool[i])) indexes.push(i);
    if (indexes.length === 0) return this.pickUnique(pool, key);
    let usedSet = this.used.get(key);
    if (!usedSet) { usedSet = new Set(); this.used.set(key, usedSet); }
    const available = indexes.filter((i) => !usedSet!.has(i));
    if (available.length === 0) {
      for (const i of indexes) usedSet.delete(i);
      return pool[indexes[Math.floor(Math.random() * indexes.length)]];
    }
    const idx = available[Math.floor(Math.random() * available.length)];
    usedSet.add(idx);
    return pool[idx];
  }
  reset() { this.used.clear(); }
}

const STARTING_FUND_M = 20;
const MAX_ROUNDS = 10;
const SHORT_COST_M = 1;
const SHORT_PAYOUT_M = 3;
const PASS_ON_WINNER_COST_M = 3;
const MAX_BAD_PASSES = 3;

export const GAME_CONFIG = {
  startingFundM: STARTING_FUND_M,
  maxRounds: MAX_ROUNDS,
  shortCostM: SHORT_COST_M,
  shortPayoutM: SHORT_PAYOUT_M,
  passOnWinnerCostM: PASS_ON_WINNER_COST_M,
  maxBadPasses: MAX_BAD_PASSES,
} as const;

export function rollReels(s: PoolSampler): Reels {
  return {
    who: s.pickUnique(AUDIENCES, 'who'),
    problem: s.pickUnique(PROBLEMS, 'problem'),
    twist: s.pickUnique(AI_TWISTS, 'twist'),
  };
}

export function rollAsk(): number {
  const r = Math.random();
  if (r < 0.20) return 2 + Math.floor(Math.random() * 2);
  if (r < 0.55) return 4 + Math.floor(Math.random() * 2);
  if (r < 0.85) return 6 + Math.floor(Math.random() * 2);
  return 8 + Math.floor(Math.random() * 3);
}

export function rollOutcome(s: PoolSampler): ExitFate {
  return s.pickUnique(EXITS, 'exit');
}

export function rollInvestor(s: PoolSampler): string {
  return s.pickUnique(VC_FIRMS, 'investor');
}

export function rollFounderQuote(s: PoolSampler): string {
  return s.pickUnique(FOUNDER_QUOTES, 'quote');
}

export function generateStartupName(who: string, sampler?: PoolSampler): string {
  const words = who
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/[\s-]+/)
    .filter(Boolean);

  const stopwords = new Set(NAME_STOPWORDS);
  let keyword = words.find((w) => !stopwords.has(w) && w.length > 2);
  if (!keyword) keyword = words[words.length - 1] ?? 'vibe';

  keyword = keyword.replace(/s$/, '');
  const capitalized = keyword.charAt(0).toUpperCase() + keyword.slice(1);

  const suffix = sampler
    ? sampler.pickUnique(STARTUP_SUFFIXES, 'suffix')
    : pick(STARTUP_SUFFIXES);
  return capitalized + suffix;
}

export type Action = 'fund' | 'short' | 'pass';
export type Ending = 'carried' | 'busted' | 'fired' | 'quit';

export interface RoundResult {
  roundNumber: number;
  startupName: string;
  reels: Reels;
  founderQuote: string;
  investor: string;
  askM: number;
  action: Action;
  outcome: ExitFate;
  fundDeltaM: number;
  goodCall?: boolean;
  badPass?: boolean;
}

export function computeRoundResult(opts: {
  roundNumber: number;
  startupName: string;
  reels: Reels;
  founderQuote: string;
  investor: string;
  askM: number;
  action: Action;
  outcome: ExitFate;
}): RoundResult {
  const { action, askM, outcome } = opts;
  const isWin = outcome.category === 'win';

  let fundDeltaM = 0;
  let goodCall: boolean | undefined;
  let badPass: boolean | undefined;

  if (action === 'fund') {
    if (isWin) {
      const winMultiplier = rollFundWinMultiplier();
      fundDeltaM = Math.round(askM * winMultiplier - askM);
    } else {
      fundDeltaM = -askM;
    }
  } else if (action === 'short') {
    if (isWin) {
      fundDeltaM = -SHORT_COST_M;
    } else {
      fundDeltaM = SHORT_PAYOUT_M;
    }
  } else {
    if (isWin) {
      fundDeltaM = -PASS_ON_WINNER_COST_M;
      badPass = true;
    } else {
      fundDeltaM = 0;
      goodCall = true;
    }
  }

  return {
    ...opts,
    fundDeltaM,
    goodCall,
    badPass,
  };
}

function rollFundWinMultiplier(): number {
  const r = Math.random();
  if (r < 0.05) return 5;
  if (r < 0.20) return 3;
  if (r < 0.55) return 2;
  return 1.5;
}

export function getVcTitle(finalFundM: number, ending: Ending): string {
  if (ending === 'fired') return FIRED_TITLE;
  if (ending === 'busted') return BUSTED_TITLE;
  const multiple = finalFundM / STARTING_FUND_M;
  for (const bracket of VC_TITLES) {
    if (multiple >= bracket.minMultiple) return bracket.title;
  }
  return BUSTED_TITLE;
}

export function formatNarrativeHeadline(opts: {
  startingM: number;
  finalFundM: number;
  ending: Ending;
  badPassCount: number;
  roundsPlayed: number;
  title: string;
}): string {
  const { startingM, finalFundM, ending, badPassCount, roundsPlayed, title } = opts;
  if (ending === 'fired') {
    return `You passed on ${badPassCount} winners in a row. ${title}`;
  }
  if (ending === 'busted') {
    return `You lit $${startingM}M on fire in ${roundsPlayed} rounds. ${title}`;
  }
  if (ending === 'quit') {
    const diff = finalFundM - startingM;
    if (diff > 0) return `You walked away with $${finalFundM}M (+$${diff}M) after ${roundsPlayed} rounds. ${title}`;
    if (diff === 0) return `You took the money and ran with exactly $${startingM}M. ${title}`;
    return `You bailed with $${finalFundM}M (−$${Math.abs(diff)}M). ${title}`;
  }
  const diff = finalFundM - startingM;
  if (diff > 0) return `You turned $${startingM}M into $${finalFundM}M in ${roundsPlayed} rounds. ${title}`;
  if (diff === 0) return `You broke exactly even across ${roundsPlayed} rounds. ${title}`;
  return `You torched $${Math.abs(diff)}M of your partners' money. ${title}`;
}

export function generateTermSheet(opts: {
  ideaName: string;
  investor: string;
  valuationM: number;
}): string[] {
  const post = Math.round(opts.valuationM * (6 + Math.random() * 6));

  const header = pick(TERM_SHEET_HEADERS)
    .replace(/\{idea\}/g, opts.ideaName)
    .replace(/\{val\}/g, String(opts.valuationM))
    .replace(/\{post\}/g, String(post))
    .replace(/\{investor\}/g, opts.investor);

  const clauseCount = 5 + Math.floor(Math.random() * 3);
  const pool = [...TERM_SHEET_CLAUSES];
  const clauses: string[] = [];
  for (let i = 0; i < clauseCount && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    clauses.push(pool.splice(idx, 1)[0].replace(/\{investor\}/g, opts.investor));
  }

  const footer = pick(TERM_SHEET_FOOTERS);

  return [header, ...clauses, footer];
}
