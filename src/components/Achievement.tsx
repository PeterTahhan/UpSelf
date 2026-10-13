import type { GameEvent } from '../game/types';
import { Modal } from './Modal';

type Props = {
  name: string;
  e: Extract<GameEvent, { type: 'achieve' }>;
  onClose: () => void;
};

export function Achievement({ name, e, onClose }: Props) {
  return (
    <Modal onClose={onClose} center>
      <div className="big">{e.icon}</div>
      <h2>{e.to}</h2>
      <p className="sub">
        {name}, the {e.field} trials have reshaped you. You entered as <b>{e.from}</b> and you leave
        as <b>{e.to}</b>. The realm takes notice, and the next trial is already waiting.
      </p>
      <button className="btn" onClick={onClose}>Claim title</button>
    </Modal>
  );
}
