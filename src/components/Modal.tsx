import { useEffect, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onClose: () => void;
  center?: boolean;
}

export function Modal({ children, onClose, center }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${center ? 'center' : ''}`} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}
