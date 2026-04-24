import type { RoundResult } from './gameLogic';

const ACTION_EMOJI = {
  fund: '💰',
  short: '🎯',
  pass: '⏭️',
} as const;

export function formatDelta(deltaM: number, goodCall?: boolean): string {
  if (goodCall) return '✓';
  if (deltaM === 0) return '0';
  if (deltaM > 0) return `+${deltaM}`;
  return `${deltaM}`;
}

export interface HighlightedPicks {
  bestBet: RoundResult | null;
  worstCall: RoundResult | null;
}

export function pickHighlights(rounds: RoundResult[]): HighlightedPicks {
  if (rounds.length === 0) return { bestBet: null, worstCall: null };
  const sorted = [...rounds].sort((a, b) => b.fundDeltaM - a.fundDeltaM);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];
  return {
    bestBet: top && top.fundDeltaM > 0 ? top : null,
    worstCall: bottom && bottom.fundDeltaM < 0 ? bottom : null,
  };
}

export function formatShareGrid(opts: {
  rounds: RoundResult[];
  narrativeHeadline: string;
  url: string;
}): string {
  const { rounds, narrativeHeadline, url } = opts;

  const lines = rounds.map((r) => {
    const actionE = ACTION_EMOJI[r.action];
    const outcomeE = r.outcome.category === 'win' ? '💎' : '💀';
    const delta = formatDelta(r.fundDeltaM, r.goodCall);
    return `${actionE}${outcomeE} ${r.startupName} ${delta}`;
  });

  const { bestBet, worstCall } = pickHighlights(rounds);
  const spotlightParts: string[] = [];
  if (bestBet) spotlightParts.push(`🏆 ${bestBet.startupName} (+${bestBet.fundDeltaM})`);
  if (worstCall) spotlightParts.push(`💀 ${worstCall.startupName} (${worstCall.fundDeltaM})`);
  const spotlight = spotlightParts.length ? spotlightParts.join('  ') : '';

  const sections = [
    narrativeHeadline,
    '',
    "— Professor Smith's Billion-Dollar AI Business Generator",
    '',
    ...lines,
  ];
  if (spotlight) sections.push('', spotlight);
  sections.push('', url);

  return sections.join('\n');
}
