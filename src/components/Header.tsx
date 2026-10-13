import { AVAIL_LABELS, XP_PER_LEVEL, activeStreak, dailyQuests, level, totalXp } from '../game/engine';
import type { GameState } from '../game/types';

function Ring({ p }: { p: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--p2)" strokeWidth="8" />
      <circle
        cx="50" cy="50" r={r} fill="none" stroke="var(--gold2)" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - p)} style={{ transition: 'stroke-dashoffset .6s' }}
      />
    </svg>
  );
}

export function Header({ s, today }: { s: GameState; today: string }) {
  const total = totalXp(s);
  const lvl = level(total);
  const into = total % XP_PER_LEVEL;
  const qs = dailyQuests(s);
  const done = qs.filter((q) => s.done[q.id]).length;

  return (
    <header className="card hero">
      <div className="medallion">
        <Ring p={into / XP_PER_LEVEL} />
        <div className="lvl">
          <div>{lvl}<small>LEVEL</small></div>
        </div>
      </div>
      <div className="grow">
        <h1>{s.name}</h1>
        <div className="sub">
          {into}/{XP_PER_LEVEL} XP to Level {lvl + 1} · {total.toLocaleString()} total XP
        </div>
        <div className="bar" style={{ marginTop: 8 }}><i style={{ width: `${(into / XP_PER_LEVEL) * 100}%` }} /></div>
        <div className="stats">
          <span>🔥 {activeStreak(s, today)}-day streak</span>
          <span>⚔️ {done}/{qs.length} today</span>
          <span className="sub">{s.diff} · {AVAIL_LABELS[s.avail]}/day</span>
        </div>
      </div>
    </header>
  );
}
