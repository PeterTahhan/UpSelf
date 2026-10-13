import { useState, type Dispatch } from 'react';
import { EVIDENCE_THRESHOLD } from '../game/engine';
import type { Action } from '../game/engine';
import type { Bounty, GameState } from '../game/types';
import { Modal } from './Modal';

interface Props {
  s: GameState;
  today: string;
  dispatch: Dispatch<Action>;
}

const expiry = (b: Bounty) => {
  const d = Math.ceil((b.exp - Date.now()) / 86_400_000);
  return d <= 1 ? 'Expires today' : `Expires in ${d} days`;
};

export function Bounties({ s, today, dispatch }: Props) {
  const [proofFor, setProofFor] = useState<Bounty | null>(null);
  const [proof, setProof] = useState('');

  const turnIn = (b: Bounty) => {
    if (b.xp >= EVIDENCE_THRESHOLD) {
      setProof('');
      setProofFor(b);
    } else {
      dispatch({ type: 'TURN_IN', id: b.id, evidence: '', today, now: Date.now() });
    }
  };

  const submit = () => {
    if (!proofFor) return;
    dispatch({ type: 'TURN_IN', id: proofFor.id, evidence: proof, today, now: Date.now() });
    setProofFor(null);
  };

  return (
    <section className="card">
      <h2>Active bounties</h2>
      {s.bounties.length === 0 && <div className="sub">No bounties posted. Check back tomorrow.</div>}
      {s.bounties.map((b) => (
        <div key={b.id} className={`bounty ${b.boss ? 'boss' : ''}`}>
          <b>{b.boss ? '👹' : '🎯'} {b.name}</b>
          {b.obj}
          <div className="meta">
            <span>+{b.xp} XP{b.ti ? ` · ${b.ti}` : ''} · {expiry(b)}</span>
            <button className="btn" onClick={() => turnIn(b)}>Turn in</button>
          </div>
        </div>
      ))}

      {proofFor && (
        <Modal onClose={() => setProofFor(null)}>
          <h2>Turn in: {proofFor.name}</h2>
          <p className="sub">{proofFor.obj}. Describe briefly what you did as proof for the guild.</p>
          <textarea
            rows={3}
            autoFocus
            value={proof}
            onChange={(e) => setProof(e.target.value)}
            placeholder="What did you accomplish?"
          />
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn" disabled={proof.trim().length < 10} onClick={submit}>Submit proof</button>
            <button className="btn ghost" onClick={() => setProofFor(null)}>Cancel</button>
          </div>
        </Modal>
      )}
    </section>
  );
}
