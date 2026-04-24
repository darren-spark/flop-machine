export interface VcTitleBracket {
  minMultiple: number;
  title: string;
}

export const VC_TITLES: readonly VcTitleBracket[] = [
  { minMultiple: 5.0,  title: 'You just got poached by Sequoia.' },
  { minMultiple: 3.5,  title: 'The partners just offered you accelerated carry.' },
  { minMultiple: 2.5,  title: 'Your returns are a case study at Stanford GSB.' },
  { minMultiple: 1.8,  title: 'You get to pick next quarter\'s offsite location.' },
  { minMultiple: 1.3,  title: 'You get to write "it\'s a long game" in next month\'s LP letter yourself.' },
  { minMultiple: 1.0,  title: 'You broke even. The partners remain unconvinced.' },
  { minMultiple: 0.7,  title: 'The family office beta now reviews your investment memos.' },
  { minMultiple: 0.4,  title: 'You\'ve been demoted to unpaid scout at a pre-seed studio.' },
  { minMultiple: 0.0,  title: 'You\'ll never work in this town again. Move to LA.' },
] as const;

export const BUSTED_TITLE = 'The LPs pulled the fund. You\'re sleeping in the WeWork.';

export const FIRED_TITLE = 'Your new job: chief of staff to a 21-year-old AI founder with a propensity for In-N-Out at 1am.';
