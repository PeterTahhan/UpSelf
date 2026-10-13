import { describe, expect, it } from 'vitest';
import {
  activeStreak, bracket, createGame, currentTier, dailyQuests, daysBetween,
  generateQuests, level, reducer, shiftDay, totalXp,
} from './engine';
import type { GameState, SetupInput } from './types';

const D1 = '2026-10-10';
const NOW = Date.parse(`${D1}T12:00:00Z`);
const setup = (over: Partial<SetupInput> = {}): SetupInput => ({
  name: 'Hero', fieldIds: ['cod', 'sec', 'fit'], custom: [], avail: 1, diff: 'Balanced', ...over,
});
const fresh = (over: Partial<SetupInput> = {}) => createGame(setup(over), D1, NOW);
const run = (s: GameState, a: Parameters<typeof reducer>[1]) => reducer(s, a) as GameState;

function clearDay(s: GameState, day: string): GameState {
  let cur = s;
  for (const q of dailyQuests(s)) cur = run(cur, { type: 'COMPLETE', id: q.id, today: day });
  return cur;
}

describe('levels and titles', () => {
  it('levels every 1000 XP', () => {
    expect(level(0)).toBe(1);
    expect(level(999)).toBe(1);
    expect(level(1000)).toBe(2);
    expect(level(5000)).toBe(6);
  });
  it('maps levels to title brackets', () => {
    expect([1, 5, 6, 10, 11, 20, 21].map(bracket)).toEqual([0, 0, 1, 1, 2, 2, 3]);
  });
});

describe('dates', () => {
  it('shifts and diffs day strings', () => {
    expect(shiftDay('2026-10-31', 1)).toBe('2026-11-01');
    expect(daysBetween('2026-10-10', '2026-10-13')).toBe(3);
  });
});

describe('quest generation', () => {
  it('creates 3 to 5 quests', () => {
    expect(generateQuests({ fields: fresh().fields.slice(0, 1), diff: 'Balanced', avail: 1, streak: 0 })).toHaveLength(3);
    const five = fresh({ fieldIds: ['cod', 'sec', 'fit', 'wri', 'rea', 'fin'] });
    expect(five.fields).toHaveLength(6);
    expect(five.quests).toHaveLength(5);
  });
  it('never repeats a task for the same field', () => {
    const ids = generateQuests({ fields: fresh().fields.slice(0, 1), diff: 'Hardcore', avail: 2, streak: 0 }).map((q) => q.id);
    expect(new Set(ids).size).toBe(3);
  });
  it('scales tier with difficulty, availability and streak', () => {
    expect(currentTier({ diff: 'Casual', avail: 1, streak: 0 })).toBe(0);
    expect(currentTier({ diff: 'Hardcore', avail: 0, streak: 0 })).toBe(1);
    expect(currentTier({ diff: 'Balanced', avail: 1, streak: 7 })).toBe(2);
    expect(currentTier({ diff: 'Casual', avail: 2, streak: 14 })).toBe(2);
  });
});

describe('completing quests', () => {
  it('awards XP to the quest field', () => {
    const s = fresh();
    const q = s.quests[0];
    const next = run(s, { type: 'COMPLETE', id: q.id, today: D1 });
    expect(next.fields.find((f) => f.id === q.f)!.xp).toBe(q.xp);
  });
  it('ignores double completion and unknown ids', () => {
    const s = fresh();
    const once = run(s, { type: 'COMPLETE', id: s.quests[0].id, today: D1 });
    expect(run(once, { type: 'COMPLETE', id: s.quests[0].id, today: D1 })).toBe(once);
    expect(run(s, { type: 'COMPLETE', id: 'nope', today: D1 })).toBe(s);
  });
  it('grants a streak bonus when all dailies are cleared', () => {
    const s = clearDay(fresh(), D1);
    const questXp = s.quests.reduce((a, q) => a + q.xp, 0);
    expect(s.streak).toBe(1);
    expect(totalXp(s)).toBe(questXp + 100);
  });
  it('freezes the quest list so completion never reshuffles it', () => {
    const s = fresh();
    const ids = s.quests.map((q) => q.id);
    expect(clearDay(s, D1).quests.map((q) => q.id)).toEqual(ids);
  });
  it('fires an achievement when a title bracket is crossed', () => {
    const s = fresh();
    s.fields.find((f) => f.id === s.quests[0].f)!.xp = 4950;
    const next = run(s, { type: 'COMPLETE', id: s.quests[0].id, today: D1 });
    expect(next.events.some((e) => e.type === 'achieve')).toBe(true);
    expect(run(next, { type: 'ACK' }).events).toHaveLength(0);
  });
});

describe('streaks and rest', () => {
  it('grows on consecutive days', () => {
    let s = clearDay(fresh(), D1);
    const d2 = shiftDay(D1, 1);
    s = run(s, { type: 'ROLLOVER', today: d2, now: NOW + 86_400_000 });
    s = clearDay(s, d2);
    expect(s.streak).toBe(2);
    expect(activeStreak(s, d2)).toBe(2);
  });
  it('rollover is a no-op on the same day', () => {
    const s = fresh();
    expect(reducer(s, { type: 'ROLLOVER', today: D1, now: NOW })).toBe(s);
  });
  it('resets the streak and offers rest after missed days, with no XP penalty', () => {
    let s = clearDay(fresh(), D1);
    const before = totalXp(s);
    s = run(s, { type: 'ROLLOVER', today: shiftDay(D1, 3), now: NOW + 3 * 86_400_000 });
    expect(s.streak).toBe(0);
    expect(s.restOffer).toBe(true);
    expect(totalXp(s)).toBe(before);
  });
  it('rest day keeps the chain without paying a bonus', () => {
    let s = clearDay(fresh(), D1);
    const d2 = shiftDay(D1, 1);
    s = run(s, { type: 'ROLLOVER', today: d2, now: NOW + 86_400_000 });
    s = run(s, { type: 'REST', on: true });
    const bonusBefore = s.bonus;
    s = clearDay(s, d2);
    expect(s.streak).toBe(1);
    expect(s.lastPerfect).toBe(d2);
    expect(s.bonus - bonusBefore).toBe(90); // 25 + 35 + 30 recovery XP, no streak bonus
  });
});

describe('bounties', () => {
  it('seeds bounties on creation', () => {
    expect(fresh().bounties.length).toBeGreaterThan(0);
  });
  it('requires proof for big bounties', () => {
    const s = fresh();
    const b = s.bounties[0];
    expect(run(s, { type: 'TURN_IN', id: b.id, evidence: 'short', today: D1, now: NOW })).toBe(s);
    const ok = run(s, { type: 'TURN_IN', id: b.id, evidence: 'Finished the whole thing today', today: D1, now: NOW });
    expect(ok.fields.find((f) => f.id === b.f)!.xp).toBe(b.xp);
    expect(ok.bounties.some((x) => x.id === b.id)).toBe(false);
    expect(ok.bounties.length).toBe(s.bounties.length); // replenished
  });
  it('expires old bounties on rollover', () => {
    let s = fresh();
    const old = s.bounties.map((b) => b.id);
    const later = NOW + 30 * 86_400_000;
    s = run(s, { type: 'ROLLOVER', today: shiftDay(D1, 30), now: later });
    expect(s.bounties.every((b) => !old.includes(b.id))).toBe(true);
  });
});

describe('reset', () => {
  it('clears the game', () => {
    expect(reducer(fresh(), { type: 'RESET' })).toBeNull();
  });
});
