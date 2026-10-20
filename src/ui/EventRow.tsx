import { formatStart } from '../core/eventTime';
import type { CalendarEvent } from '../google/types';

export function EventRow({
  event,
  checked,
  onToggle,
  note,
}: {
  event: CalendarEvent;
  checked?: boolean;
  onToggle?: () => void;
  note?: string;
}) {
  const title = event.summary?.trim() || '(no title)';
  return (
    <li className="event">
      {onToggle ? (
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          aria-label={`Select ${title}`}
        />
      ) : (
        <span className="keep" title="Kept">
          ✓
        </span>
      )}
      <span className="when">{formatStart(event)}</span>
      <span className="title">
        {event.htmlLink ? (
          <a href={event.htmlLink} target="_blank" rel="noreferrer">
            {title}
          </a>
        ) : (
          title
        )}
        {event.recurrence?.length ? <span className="badge">series</span> : null}
      </span>
      {note && <span className="muted">{note}</span>}
    </li>
  );
}
