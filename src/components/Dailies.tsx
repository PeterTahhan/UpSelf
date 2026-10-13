import type { Dispatch } from 'react';
import { dailyQuests } from '../game/engine';
import type { Action } from '../game/engine';
import type { GameState } from '../game/types';

interface Props {
  s: GameState;
  today: string;
  dispatch: Dispatch<Action>;
}

export function Dailies({ s, today, dispatch }: Props) {
  const qs = dailyQuests(s);
  return (
    <section className="card">
      <h2>Daily quests</h2>

      {s.restOffer && !s.rest && (
        <div className="note">
          Welcome back, adventurer. No penalties here. Take a lighter Rest &amp; Recovery day?
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn" onClick={() => dispatch({ type: 'REST', on: true })}>Start recovery</button>
            <button className="btn ghost" onClick={() => dispatch({ type: 'DISMISS_REST' })}>Keep regular quests</button>
          </div>
        </div>
      )}
      {s.rest && <div className="note">🌿 Rest &amp; Recovery day. Finish these to keep your streak safe.</div>}

      <div style={{ marginTop: 10 }}>
        {qs.map((q) => {
          const f = s.fields.find((x) => x.id === q.f);
          const done = !!s.done[q.id];
          return (
            <button
              key={q.id}
              className={`quest ${done ? 'done' : ''}`}
              aria-pressed={done}
              onClick={() => dispatch({ type: 'COMPLETE', id: q.id, today })}
            >
              <span className="box">{done ? '✓' : ''}</span>
              <span className="qt">
                {q.t}
                <small>{f ? `${f.ic} ${f.n}` : '🌿 Recovery'}</small>
              </span>
              <span className="xp">+{q.xp}</span>
            </button>
          );
        })}
      </div>

      <p className="sub small">
        Clear every quest for a Streak Bonus of 100+ XP. Tasks get harder as your streak builds.
      </p>
      <div className="row">
        {s.rest ? (
          <button className="btn ghost" onClick={() => dispatch({ type: 'REST', on: false })}>
            Back to regular quests
          </button>
        ) : (
          <button className="btn ghost" onClick={() => dispatch({ type: 'REST', on: true })}>
            Feeling burned out? Rest &amp; Recovery
          </button>
        )}
      </div>
    </section>
  );
}
