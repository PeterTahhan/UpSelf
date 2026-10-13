import { useEffect, useReducer } from 'react';
import { dayString, reducer } from './game/engine';
import type { GameState } from './game/types';

const KEY = 'quest-master:v1';

function load(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return { ...(JSON.parse(raw) as GameState), events: [] };
  } catch {
    return null;
  }
}

/** Game state + dispatch, persisted to localStorage, with automatic day rollover. */
export function useGame() {
  const [state, dispatch] = useReducer(reducer, null, load);

  useEffect(() => {
    try {
      if (state) localStorage.setItem(KEY, JSON.stringify({ ...state, events: [] }));
      else localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable (private mode, quota): the game still works in memory */
    }
  }, [state]);

  useEffect(() => {
    const tick = () => dispatch({ type: 'ROLLOVER', today: dayString(), now: Date.now() });
    tick();
    const id = setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  return { state, dispatch };
}
