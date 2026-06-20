interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="modal-backdrop modal-backdrop--confirm" onClick={onCancel} role="presentation">
      <div
        className="modal modal--confirm"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
      >
        <header className="modal__header modal__header--compact">
          <h2 id="confirm-modal-title" className="modal__title">
            {title}
          </h2>
        </header>
        <div className="modal__body modal__body--compact">
          <p id="confirm-modal-message" className="confirm-modal__message">
            {message}
          </p>
        </div>
        <footer className="modal__footer modal__footer--compact">
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${destructive ? 'btn--danger' : 'btn--primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
