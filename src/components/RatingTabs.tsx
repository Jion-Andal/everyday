interface RatingTabsProps {
  value: number;
  onChange: (rating: number) => void;
}

const LABELS = ['1', '2', '3', '4', '5'];

export function RatingTabs({ value, onChange }: RatingTabsProps) {
  return (
    <div className="rating-tabs" role="tablist" aria-label="Rate your day">
      {LABELS.map((label, i) => {
        const rating = i + 1;
        return (
          <button
            key={rating}
            type="button"
            role="tab"
            aria-selected={value === rating}
            className={`rating-tab ${value === rating ? 'rating-tab--active' : ''}`}
            onClick={() => onChange(rating)}
          >
            {label}
          </button>
        );
      })}
      <span className="rating-hint">
        {value <= 2 ? 'rough day' : value >= 4 ? 'good day' : 'okay day'}
      </span>
    </div>
  );
}
