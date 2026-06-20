import { useEffect, useState } from 'react';
import { getErrorMessage } from '../lib/errors';
import { ImageUpload } from './ImageUpload';
import { RatingTabs } from './RatingTabs';
import { EMPTY_LOG_FORM, type DailyLog, type LogFormData } from '../types/log';
import { formatDisplayDate } from '../services/logs';

interface LogModalProps {
  open: boolean;
  date: Date;
  existingLog?: DailyLog;
  onClose: () => void;
  onSave: (form: LogFormData) => Promise<void>;
}

export function LogModal({ open, date, existingLog, onClose, onSave }: LogModalProps) {
  const [form, setForm] = useState<LogFormData>(EMPTY_LOG_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (existingLog) {
      setForm({
        wordOfDay: existingLog.wordOfDay,
        whatHappened: existingLog.whatHappened,
        rating: existingLog.rating,
        imageFile: null,
        imagePreview: existingLog.imageUrl,
      });
    } else {
      setForm(EMPTY_LOG_FORM);
    }
    setError(null);
  }, [open, existingLog]);

  if (!open) return null;

  const dateLabel = formatDisplayDate(
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.wordOfDay.trim()) {
      setError('Please add a word for the day.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save your log.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal modal--log"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-modal-title"
      >
        <header className="modal__header modal__header--log">
          <h2 id="log-modal-title" className="modal__title">
            {existingLog ? 'Edit your day' : 'Log your day'}
          </h2>
          <p className="modal__subtitle">{dateLabel}</p>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <form className="modal__form" onSubmit={handleSubmit}>
          <div className="modal__body modal__body--log">
            <div className="field">
              <label className="field-label" htmlFor="word-of-day">
                Word of the day
              </label>
              <input
                id="word-of-day"
                type="text"
                className="field-input"
                placeholder="one word that captures today..."
                value={form.wordOfDay}
                onChange={(e) => setForm({ ...form, wordOfDay: e.target.value })}
                maxLength={40}
                autoFocus
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="what-happened">
                What happened today?
              </label>
              <textarea
                id="what-happened"
                className="field-textarea"
                placeholder="write freely — no one else has to read this..."
                rows={4}
                value={form.whatHappened}
                onChange={(e) => setForm({ ...form, whatHappened: e.target.value })}
              />
            </div>

            <div className="field field--last">
              <span className="field-label">Rate your day</span>
              <RatingTabs
                value={form.rating}
                onChange={(rating) => setForm({ ...form, rating })}
              />
            </div>

            <ImageUpload
              preview={form.imagePreview}
              onChange={(file, preview) =>
                setForm({ ...form, imageFile: file, imagePreview: preview })
              }
            />

            {error && <p className="form-error">{error}</p>}
          </div>

          <footer className="modal__footer modal__footer--log">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save entry'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
