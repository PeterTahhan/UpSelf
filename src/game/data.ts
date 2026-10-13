import type { FieldTemplate } from './types';

export const TEMPLATES: FieldTemplate[] = [
  { id: 'fit', n: 'Fitness', ic: '💪',
    ti: ['Iron Novice', 'Apprentice Lifter', 'Sculpted Athlete', 'Titan of Iron'],
    tk: ['10-min mobility and walk', 'Full workout session', 'Workout, log every set, hit protein goal'],
    w: 'Train on 4 separate days', b: 'Set a new personal record on a main lift' },
  { id: 'cod', n: 'Coding', ic: '💻',
    ti: ['Script Squire', 'Code Apprentice', 'Veteran Architect', 'Grandmaster Engineer'],
    tk: ['Solve one easy problem', 'Build or fix one feature (45 min)', 'Deep-work module with tests'],
    w: 'Commit code on 5 days', b: 'Ship a project to GitHub or production' },
  { id: 'sec', n: 'Cybersecurity', ic: '🛡️',
    ti: ['Script Kiddie', 'Blue Team Apprentice', 'Veteran Hunter', 'Cyber Sage'],
    tk: ['Read one writeup or CVE', 'Finish a lab room or CTF challenge', 'Fully exploit and document a machine'],
    w: 'Complete 3 labs', b: 'Finish a full machine unaided or place in a CTF' },
  { id: 'wri', n: 'Writing', ic: '✍️',
    ti: ['Ink Novice', 'Scribe Apprentice', 'Veteran Wordsmith', 'Master Chronicler'],
    tk: ['Write 100 words', 'Write 500 words', 'Draft 1,000 words and edit'],
    w: 'Write on 5 days', b: 'Finish and publish one complete piece' },
  { id: 'lan', n: 'Language', ic: '🗣️',
    ti: ['Tourist', 'Apprentice Linguist', 'Veteran Speaker', 'Polyglot Sage'],
    tk: ['10 min vocab review', 'Lesson plus 15 min listening', '30 min speaking or writing with feedback'],
    w: 'Study on 6 days', b: 'Hold a 10-minute conversation in the language' },
  { id: 'fin', n: 'Finance', ic: '💰',
    ti: ['Penny Pincher', 'Budget Apprentice', 'Veteran Investor', 'Sovereign of Coin'],
    tk: ["Log today's spending", 'Read a finance chapter or article', 'Review budget and rebalance goals'],
    w: 'Track spending 7 days', b: 'Hit a savings milestone' },
  { id: 'min', n: 'Mindfulness', ic: '🧘',
    ti: ['Restless Initiate', 'Calm Apprentice', 'Veteran of Stillness', 'Zen Archmage'],
    tk: ['3-min breathing', '10-min meditation', '20-min meditation and journal'],
    w: 'Meditate on 5 days', b: 'Complete a full day of digital detox' },
  { id: 'rea', n: 'Reading', ic: '📚',
    ti: ['Page Turner', 'Bookish Apprentice', 'Veteran Scholar', 'Archivist Supreme'],
    tk: ['Read 5 pages', 'Read 20 pages', 'Read 50 pages and take notes'],
    w: 'Read on 6 days', b: 'Finish a whole book' },
];

export const REST_QUESTS: ReadonlyArray<readonly [string, number]> = [
  ['Drink water and stretch for 5 minutes', 25],
  ['Take a 10-minute walk outside', 35],
  ["Write tomorrow's single priority", 30],
];

export function customTemplate(name: string, index: number): FieldTemplate {
  return {
    id: `c${index}`,
    n: name,
    ic: '✨',
    ti: [`${name} Novice`, `${name} Apprentice`, `Veteran of ${name}`, `Master of ${name}`],
    tk: [`10 minutes of ${name}`, `30 minutes of focused ${name}`, `A deep 60+ minute ${name} session`],
    w: `Practice ${name} on 5 days`,
    b: `Complete a major ${name} milestone`,
  };
}
