import { useState } from 'react';
import { AVAIL_LABELS, DIFFICULTIES } from '../game/engine';
import { TEMPLATES } from '../game/data';
import type { Availability, Difficulty, SetupInput } from '../game/types';

const MAX_FIELDS = 5;

export function Setup({ onStart }: { onStart: (s: SetupInput) => void }) {
  const [name, setName] = useState('');
  const [fieldIds, setFieldIds] = useState<string[]>([]);
  const [custom, setCustom] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [avail, setAvail] = useState<Availability>(1);
  const [diff, setDiff] = useState<Difficulty>('Balanced');
  const [error, setError] = useState('');

  const count = fieldIds.length + custom.length;

  const toggle = (id: string) =>
    setFieldIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const addCustom = () => {
    const v = customInput.trim();
    if (!v || custom.includes(v)) return;
    setCustom([...custom, v]);
    setCustomInput('');
  };

  const begin = () => {
    if (!name.trim()) return setError('Enter a hero name.');
    if (count < 1 || count > MAX_FIELDS) return setError(`Choose between 1 and ${MAX_FIELDS} fields.`);
    onStart({ name, fieldIds, custom, avail, diff });
  };

  return (
    <div className="card setup">
      <h1>Quest Master</h1>
      <p className="sub">Turn your goals into an adventure. Set up your hero to receive your first quests.</p>

      <label className="lbl" htmlFor="name">Hero name</label>
      <input id="name" type="text" value={name} maxLength={24} placeholder="Your name"
        onChange={(e) => setName(e.target.value)} />

      <span className="lbl">Focus fields (pick 1 to {MAX_FIELDS})</span>
      <div>
        {TEMPLATES.map((t) => (
          <button key={t.id} className={`chip ${fieldIds.includes(t.id) ? 'on' : ''}`} aria-pressed={fieldIds.includes(t.id)}
            onClick={() => toggle(t.id)}>
            {t.ic} {t.n}
          </button>
        ))}
        {custom.map((c) => (
          <button key={c} className="chip on" aria-pressed onClick={() => setCustom(custom.filter((x) => x !== c))}>
            ✨ {c}
          </button>
        ))}
      </div>
      <form className="row" onSubmit={(e) => { e.preventDefault(); addCustom(); }}>
        <input type="text" value={customInput} maxLength={20} placeholder="Add your own field"
          aria-label="Custom field name" style={{ maxWidth: 260 }}
          onChange={(e) => setCustomInput(e.target.value)} />
        <button type="submit" className="btn ghost">Add</button>
      </form>

      <span className="lbl">Daily availability</span>
      <div>
        {AVAIL_LABELS.map((a, i) => (
          <button key={a} className={`chip ${avail === i ? 'on' : ''}`} aria-pressed={avail === i}
            onClick={() => setAvail(i as Availability)}>{a}</button>
        ))}
      </div>

      <span className="lbl">Difficulty</span>
      <div>
        {DIFFICULTIES.map((d) => (
          <button key={d} className={`chip ${diff === d ? 'on' : ''}`} aria-pressed={diff === d}
            onClick={() => setDiff(d)}>{d}</button>
        ))}
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn" style={{ marginTop: 10 }} onClick={begin}>Begin the adventure</button>
    </div>
  );
}
