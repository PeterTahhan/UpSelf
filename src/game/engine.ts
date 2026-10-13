import { REST_QUESTS, TEMPLATES, customTemplate } from './data';
import type {
  Bounty, Difficulty, Field, GameState, Quest, SetupInput,
} from './types';

/* ---------- constants ---------- */
export const XP_PER_LEVEL = 1000;
export const TIER_XP = [40, 120, 200] as const; // easy, medium, hard
export const EVIDENCE_THRESHOLD = 200; // bounties at or above this XP need proof
export const DIFFICULTIES: Difficulty[] = ['Casual', 'Balanced', 'Hardcore'];
export const AVAIL_LABELS = ['30 min', '1–2 hours', '2+ hours'] as const;

const DAY_MS = 86_400_000;

/* ---------- date helpers (YYYY-MM-DD strings) ---------- */
export const dayString = (d = new Date()): string => d.toLocaleDateString('en-CA');

export function shiftDay(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const daysBetween = (a: string, b: string): number =>
  Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS);

/* ---------- levels, titles, XP ---------- */
export const level = (xp: number): number => Math.floor(xp / XP_PER_LEVEL) + 1;

/** Title bracket: 0 = Lvl 1-5, 1 = 6-10, 2 = 11-20, 3 = 21+ */
export const bracket = (lvl: number): 0 | 1 | 2 | 3 =>
  lvl > 20 ? 3 : lvl > 10 ? 2 : lvl > 5 ? 1 : 0;

export const fieldTitle = (f: Field): string => f.ti[bracket(level(f.xp))];
export const totalXp = (s: GameState): number =>
  s.fields.reduce((sum, f) => sum + f.xp, 0) + s.bonus;

/** Streak as the player should see it (a lapsed streak shows as 0 before the next rollover). */
export const activeStreak = (s: GameState, today: string): number =>
  s.lastPerfect === today || s.lastPerfect === shiftDay(today, -1) ? s.streak : 0;

/* ---------- quest generation ---------- */
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Which task tier (0 easy, 1 medium, 2 hard) the player gets today. Scales with streak. */
export function currentTier(s: Pick<GameState, 'diff' | 'avail' | 'streak'>): number {
  let t = DIFFICULTIES.indexOf(s.diff);
  if (s.avail === 0) t = Math.min(t, 1); // 30 min a day never gets hard tasks
  if (s.streak >= 7) t++;
  if (s.streak >= 14) t++;
  return clamp(t, 0, 2);
}

export function generateQuests(s: Pick<GameState, 'fields' | 'diff' | 'avail' | 'streak'>): Quest[] {
  const count = clamp(s.fields.length, 3, 5);
  const tier = currentTier(s);
  const mult = s.diff === 'Hardcore' ? 1.25 : 1;
  const used: Record<string, number[]> = {};
  const quests: Quest[] = [];
  for (let i = 0; i < count; i++) {
    const f = s.fields[i % s.fields.length];
    const taken = (used[f.id] ??= []);
    const order = [tier, tier > 0 ? tier - 1 : 1, 0, 1, 2];
    const idx = order.find((k) => !taken.includes(k)) ?? tier;
    taken.push(idx);
    quests.push({
      id: `${f.id}:${idx}`,
      t: f.tk[idx],
      xp: Math.round((TIER_XP[idx] * mult) / 5) * 5,
      f: f.id,
    });
  }
  return quests;
}

export const restQuests = (): Quest[] =>
  REST_QUESTS.map(([t, xp], i) => ({ id: `rest:${i}`, t, xp, f: null, rest: true }));

/** The quest list the player sees right now. */
export const dailyQuests = (s: GameState): Quest[] => (s.rest ? restQuests() : s.quests);

/* ---------- state creation ---------- */
export function createGame(setup: SetupInput, today: string, now: number): GameState {
  const fields: Field[] = [
    ...setup.fieldIds.flatMap((id) => {
      const t = TEMPLATES.find((x) => x.id === id);
      return t ? [{ ...t, xp: 0 }] : [];
    }),
    ...setup.custom.map((name, i) => ({ ...customTemplate(name, i), xp: 0 })),
  ];
  const s: GameState = {
    name: setup.name.trim(),
    fields,
    avail: setup.avail,
    diff: setup.diff,
    bonus: 0,
    streak: 0,
    log: ['Hero created. Your journey begins.'],
    bounties: [],
    bc: 0,
    quests: [],
    done: {},
    day: '',
    rest: false,
    restOffer: false,
    lastActive: null,
    lastPerfect: null,
    perfectDay: null,
    events: [],
  };
  startDay(s, today, now);
  return s;
}

/* ---------- mutating helpers (only ever called on a cloned draft) ---------- */
function log(s: GameState, msg: string) {
  s.log.unshift(msg);
  s.log = s.log.slice(0, 25);
}
function toast(s: GameState, msg: string) {
  s.events.push({ type: 'toast', msg });
}

function startDay(s: GameState, today: string, now: number) {
  s.day = today;
  s.done = {};
  s.rest = false;
  s.quests = generateQuests(s);
  fillBounties(s, now);
}

function addBounty(s: GameState, now: number) {
  const f = s.fields[s.bc % s.fields.length];
  s.bc++;
  const boss = !s.bounties.some((b) => b.boss) && s.bc % 3 === 0;
  const b: Bounty = {
    id: `b${s.bc}`,
    boss,
    f: f.id,
    name: boss ? `${f.n} Boss: Final Trial` : `${f.n} Bounty`,
    obj: boss ? f.b : f.w,
    xp: boss ? 500 : 300,
    exp: now + (boss ? 5 : 7) * DAY_MS,
    ti: boss ? `Slayer of the ${f.n} Boss` : '',
  };
  s.bounties.push(b);
}

function fillBounties(s: GameState, now: number) {
  s.bounties = s.bounties.filter((b) => b.exp > now);
  const target = Math.min(3, s.fields.length + 1);
  for (let guard = 0; s.bounties.length < target && guard < 10; guard++) addBounty(s, now);
}

/** Add XP to a field (or to the general pool when fid is null) and emit level/title events. */
function award(s: GameState, fid: string | null, amt: number) {
  const before = level(totalXp(s));
  const f = fid ? s.fields.find((x) => x.id === fid) : undefined;
  if (f) {
    const oldLvl = level(f.xp);
    f.xp += amt;
    const newLvl = level(f.xp);
    if (newLvl > oldLvl) {
      log(s, `${f.ic} ${f.n} reached Level ${newLvl}`);
      toast(s, `${f.ic} ${f.n} reached Level ${newLvl}`);
      if (bracket(newLvl) > bracket(oldLvl)) {
        s.events.push({
          type: 'achieve', icon: f.ic, field: f.n,
          from: f.ti[bracket(oldLvl)], to: f.ti[bracket(newLvl)],
        });
      }
    }
  } else {
    s.bonus += amt;
  }
  const after = level(totalXp(s));
  if (after > before) {
    log(s, `Overall Level ${after} reached`);
    toast(s, `⭐ Overall Level ${after}`);
  }
}

function completeDay(s: GameState, today: string) {
  if (s.perfectDay === today) return;
  s.perfectDay = today;
  if (s.rest) {
    // Recovery keeps the chain alive without growing it or paying a bonus.
    s.lastPerfect = today;
    log(s, 'Rest day complete. Streak preserved.');
    toast(s, '🌿 Recovered. Your streak is safe.');
    return;
  }
  s.streak = s.lastPerfect === shiftDay(today, -1) ? s.streak + 1 : 1;
  s.lastPerfect = today;
  const bonus = 100 + 25 * Math.min(s.streak - 1, 6);
  award(s, null, bonus);
  log(s, `Streak Bonus +${bonus} XP (${s.streak}-day streak)`);
  toast(s, `🔥 All dailies cleared: +${bonus} XP`);
}

/* ---------- reducer ---------- */
export type Action =
  | { type: 'START'; setup: SetupInput; today: string; now: number }
  | { type: 'ROLLOVER'; today: string; now: number }
  | { type: 'COMPLETE'; id: string; today: string }
  | { type: 'TURN_IN'; id: string; evidence: string; today: string; now: number }
  | { type: 'REST'; on: boolean }
  | { type: 'DISMISS_REST' }
  | { type: 'ACK' }
  | { type: 'RESET' };

export function reducer(s: GameState | null, a: Action): GameState | null {
  if (a.type === 'START') return createGame(a.setup, a.today, a.now);
  if (a.type === 'RESET') return null;
  if (!s) return s;
  if (a.type === 'ROLLOVER' && s.day === a.today) return s;

  const d = structuredClone(s);
  switch (a.type) {
    case 'ROLLOVER': {
      if (d.lastActive && daysBetween(d.lastActive, a.today) >= 2) d.restOffer = true;
      if (d.lastPerfect !== shiftDay(a.today, -1) && d.lastPerfect !== a.today) d.streak = 0;
      startDay(d, a.today, a.now);
      break;
    }
    case 'COMPLETE': {
      const q = dailyQuests(d).find((x) => x.id === a.id);
      if (!q || d.done[q.id]) return s;
      d.done[q.id] = true;
      d.lastActive = a.today;
      d.restOffer = false;
      award(d, q.f, q.xp);
      log(d, `${q.rest ? 'Rest' : 'Quest'} done: ${q.t} (+${q.xp} XP)`);
      if (dailyQuests(d).every((x) => d.done[x.id])) completeDay(d, a.today);
      break;
    }
    case 'TURN_IN': {
      const b = d.bounties.find((x) => x.id === a.id);
      if (!b) return s;
      const proof = a.evidence.trim();
      if (b.xp >= EVIDENCE_THRESHOLD && proof.length < 10) return s;
      d.bounties = d.bounties.filter((x) => x.id !== b.id);
      d.lastActive = a.today;
      award(d, b.f, b.xp);
      log(d, `Bounty claimed: ${b.name} (+${b.xp} XP)${b.ti ? ` · Title: ${b.ti}` : ''}`);
      if (b.ti) toast(d, `🏆 Title earned: ${b.ti}`);
      fillBounties(d, a.now);
      break;
    }
    case 'REST':
      d.rest = a.on;
      d.restOffer = false;
      break;
    case 'DISMISS_REST':
      d.restOffer = false;
      break;
    case 'ACK':
      if (!d.events.length) return s;
      d.events = [];
      break;
  }
  return d;
}
