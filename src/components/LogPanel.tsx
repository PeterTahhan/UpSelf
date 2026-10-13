import type { GameState } from '../game/types';

export function LogPanel({ s }: { s: GameState }) {
  return (
    <section className="card log">
      <h2>Log &amp; achievements</h2>
      {s.log.length ? s.log.map((l, i) => <div key={i}>{l}</div>) : (
        <div className="sub">Your story begins with the first quest.</div>
      )}
    </section>
  );
}
