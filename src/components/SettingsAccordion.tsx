import { type ReactNode } from 'react';

interface SettingsAccordionProps {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`settings-accordion__chevron ${open ? 'settings-accordion__chevron--open' : ''}`}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SettingsAccordion({ id, title, open, onToggle, children }: SettingsAccordionProps) {
  const panelId = `${id}-panel`;

  return (
    <section className="settings-accordion">
      <button
        type="button"
        className="settings-accordion__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="settings-accordion__title">{title}</span>
        <ChevronIcon open={open} />
      </button>
      <div
        id={panelId}
        className={`settings-accordion__panel ${open ? 'settings-accordion__panel--open' : ''}`}
        aria-hidden={!open}
      >
        <div className="settings-accordion__content">{children}</div>
      </div>
    </section>
  );
}
