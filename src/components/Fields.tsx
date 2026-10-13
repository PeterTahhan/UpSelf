import { XP_PER_LEVEL, fieldTitle, level } from '../game/engine';
import type { GameState } from '../game/types';

export function Fields({ s }: { s: GameState }) {
  return (
    <section className="card">
      <h2>Field titles</h2>
      {s.fields.map((f) => {
        const into = f.xp % XP_PER_LEVEL;
        return (
          <div className="field" key={f.id}>
            <span className="fic">{f.ic}</span>
            <div>
              <b>
                <span>{f.n}: {fieldTitle(f)}</span>
                <span className="xp">Lvl {level(f.xp)}</span>
              </b>
              <div className="bar" style={{ margin: '5px 0 3px' }}>
                <i style={{ width: `${(into / XP_PER_LEVEL) * 100}%` }} />
              </div>
              <small>{into}/{XP_PER_LEVEL} XP</small>
            </div>
          </div>
        );
      })}
    </section>
  );
}
