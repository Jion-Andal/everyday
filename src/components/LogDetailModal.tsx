import { useState } from 'react';
import { ConfirmModal } from './ConfirmModal';
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  if (!log) return null;

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(log);
      setDeleteConfirmOpen(false);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
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
            <button type="button" className="btn btn--secondary" onClick={() => onEdit(log)}>
              Edit
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              Delete entry
            </button>
          </footer>
        </div>
      </div>

      <ConfirmModal
        open={deleteConfirmOpen}
        title="Delete entry?"
        message={`This will permanently remove your log for ${formatDisplayDate(log.logDate)}.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </>
  );
}
