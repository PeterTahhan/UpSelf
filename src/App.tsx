import { useEffect, useState } from 'react';
import { Achievement } from './components/Achievement';
import { Bounties } from './components/Bounties';
import { Dailies } from './components/Dailies';
import { Fields } from './components/Fields';
import { Header } from './components/Header';
import { LogPanel } from './components/LogPanel';
import { Modal } from './components/Modal';
import { Setup } from './components/Setup';
import { dayString } from './game/engine';
import type { GameEvent } from './game/types';
import { useGame } from './store';

type Achieve = Extract<GameEvent, { type: 'achieve' }>;

export default function App() {
  const { state, dispatch } = useGame();
  const [toast, setToast] = useState<{ msg: string; k: number } | null>(null);
  const [achieve, setAchieve] = useState<Achieve | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  // Drain transient game events into UI (toasts, title modal).
  useEffect(() => {
    if (!state?.events.length) return;
    for (const e of state.events) {
      if (e.type === 'toast') setToast({ msg: e.msg, k: Date.now() });
      else setAchieve(e);
    }
    dispatch({ type: 'ACK' });
  }, [state?.events, dispatch]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  const toggleTheme = () => {
    const root = document.documentElement;
    const dark = root.dataset.theme
      ? root.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
  };

  if (!state) {
    return (
      <div className="wrap">
        <Setup
          onStart={(setup) => dispatch({ type: 'START', setup, today: dayString(), now: Date.now() })}
        />
      </div>
    );
  }

  const today = dayString();
  return (
    <div className="wrap">
      <Header s={state} today={today} />
      <div className="grid">
        <div className="col">
          <Dailies s={state} today={today} dispatch={dispatch} />
          <Fields s={state} />
        </div>
        <div className="col">
          <Bounties s={state} today={today} dispatch={dispatch} />
          <LogPanel s={state} />
          <div className="row">
            <button className="btn ghost" onClick={toggleTheme}>Toggle theme</button>
            <button className="btn ghost" onClick={() => setConfirmReset(true)}>Reset hero</button>
          </div>
        </div>
      </div>

      {achieve && <Achievement name={state.name} e={achieve} onClose={() => setAchieve(null)} />}
      {confirmReset && (
        <Modal onClose={() => setConfirmReset(false)} center>
          <h2>Reset your hero?</h2>
          <p className="sub">All levels, titles and the log will be erased from this device.</p>
          <div className="row center">
            <button
              className="btn danger"
              onClick={() => { dispatch({ type: 'RESET' }); setConfirmReset(false); }}
            >
              Erase progress
            </button>
            <button className="btn ghost" onClick={() => setConfirmReset(false)}>Keep playing</button>
          </div>
        </Modal>
      )}
      <div id="toast" role="status" className={toast ? 'show' : ''}>{toast?.msg}</div>
    </div>
  );
}
