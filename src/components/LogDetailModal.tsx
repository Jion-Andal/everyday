import { useState } from 'react';
import type { DailyLog } from '../types/log';
import { formatDisplayDate } from '../services/logs';

interface LogDetailModalProps {
  log: DailyLog | null;
  onClose: () => void;
  onDelete: (log: DailyLog) => Promise<void>;
  onEdit: (log: DailyLog) => void;
}

export function LogDetailModal({ log, onClose, onDelete, onEdit }: LogDetailModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!log) return null;

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await onDelete(log);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal modal--detail"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
      >
        <header className="modal__header">
          <h2 id="detail-modal-title" className="modal__title detail-word">
            {log.wordOfDay}
          </h2>
          <p className="modal__subtitle">{formatDisplayDate(log.logDate)}</p>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="modal__body detail-body">
          {log.imageUrl && (
            <img src={log.imageUrl} alt="" className="detail-image" />
          )}

          <div className="detail-rating">
            <span className="field-label">Day rating</span>
            <div className="detail-rating__value">
              {'●'.repeat(log.rating)}
              <span className="detail-rating__num">{log.rating}/5</span>
            </div>
          </div>

          {log.whatHappened && (
            <div className="detail-text">
              <span className="field-label">What happened</span>
              <p>{log.whatHappened}</p>
            </div>
          )}
        </div>

        <footer className="modal__footer">
          <button
            type="button"
            className={`btn ${confirmDelete ? 'btn--danger' : 'btn--ghost'}`}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : confirmDelete ? 'Confirm delete' : 'Delete entry'}
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => onEdit(log)}>
            Edit
          </button>
        </footer>
      </div>
    </div>
  );
}
