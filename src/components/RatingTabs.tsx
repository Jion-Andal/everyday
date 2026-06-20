interface RatingTabsProps {
  value: number;
  onChange: (rating: number) => void;
}

const LABELS = ['1', '2', '3', '4', '5'];

const HINTS: Record<number, string> = {
  1: 'hate this day',
  2: 'rough day',
  3: 'meh day',
  4: 'nice day',
  5: 'great day',
};

export function RatingTabs({ value, onChange }: RatingTabsProps) {
  return (
    <div className="rating-tabs" role="tablist" aria-label="Rate your day">
      <div className="rating-tabs__row">
        {LABELS.map((label, i) => {
          const rating = i + 1;
          return (
            <button
              key={rating}
              type="button"
              role="tab"
              aria-selected={value === rating}
              className={`rating-tab ${value === rating ? 'rating-tab--active' : ''}`}
              onClick={(e) => {
                onChange(rating);
                e.currentTarget.blur();
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      <span className="rating-hint">{HINTS[value]}</span>
    </div>
  );
}
