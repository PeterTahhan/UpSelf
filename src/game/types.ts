export type Difficulty = 'Casual' | 'Balanced' | 'Hardcore';
export type Availability = 0 | 1 | 2; // 30 min | 1-2 hours | 2+ hours
export type TitleSet = [string, string, string, string];
export type TaskSet = [string, string, string]; // easy, medium, hard

export interface FieldTemplate {
  id: string;
  n: string;
  ic: string;
  ti: TitleSet;
  tk: TaskSet;
  w: string; // weekly bounty objective
  b: string; // boss bounty objective
}

export interface Field extends FieldTemplate {
  xp: number;
}

export interface Quest {
  id: string;
  t: string;
  xp: number;
  f: string | null; // field id, null for rest quests
  rest?: boolean;
}

export interface Bounty {
  id: string;
  boss: boolean;
  f: string;
  name: string;
  obj: string;
  xp: number;
  exp: number; // epoch ms
  ti: string; // unique title awarded, may be empty
}

export type GameEvent =
  | { type: 'toast'; msg: string }
  | { type: 'achieve'; icon: string; field: string; from: string; to: string };

export interface SetupInput {
  name: string;
  fieldIds: string[]; // template ids
  custom: string[]; // custom field names
  avail: Availability;
  diff: Difficulty;
}

export interface GameState {
  name: string;
  fields: Field[];
  avail: Availability;
  diff: Difficulty;
  bonus: number; // XP not tied to a field (streak bonuses, rest quests)
  streak: number;
  log: string[];
  bounties: Bounty[];
  bc: number; // bounty counter, drives deterministic rotation
  quests: Quest[]; // today's quests, frozen at day start
  done: Record<string, true>;
  day: string; // YYYY-MM-DD of the current quest set
  rest: boolean;
  restOffer: boolean;
  lastActive: string | null;
  lastPerfect: string | null;
  perfectDay: string | null;
  events: GameEvent[]; // transient UI events, never persisted
}
