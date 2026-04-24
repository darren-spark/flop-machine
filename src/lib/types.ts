export type Phase =
  | 'idle'
  | 'spinning'
  | 'pitching'
  | 'raising'
  | 'exiting'
  | 'final'
  | 'vault';

export interface Reels {
  who: string;
  problem: string;
  twist: string;
}

export interface PitchedIdea {
  reels: Reels;
  pitchText: string;
  score: number;
  critique: string;
}

export interface RaisedRound {
  idea: PitchedIdea;
  headline: string;
  investor: string;
  valuationM: number;
}

export interface ExitedStartup {
  round: RaisedRound;
  exitText: string;
  exitMultiplier: number;
  finalScore: number;
  termSheet: string[];
}

export interface ScoredCritique {
  text: string;
  score: number;
}
