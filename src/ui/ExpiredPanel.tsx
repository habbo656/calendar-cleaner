import { useMemo, useState } from 'react';
import { cutoffDaysAgo, findExpired } from '../core/expired';
import type { CalendarApi, CalendarEvent, CalendarListEntry } from '../google/types';
import { DeleteBar } from './DeleteBar';
import { EventRow } from './EventRow';
import { useSelection } from './useSelection';

export function ExpiredPanel(props: {
  api: CalendarApi;
  calendar: CalendarListEntry;
  events: CalendarEvent[];
  onDeleted: () => void;
  onError: (e: unknown) => void;
}) {
  const [days, setDays] = useState(0);
  const [includeRecurring, setIncludeRecurring] = useState(true);
  const cutoff = useMemo(() => cutoffDaysAgo(days), [days]);
  const candidates = useMemo(
    () => findExpired(props.events, { cutoff, includeRecurring }),
    [props.events, cutoff, includeRecurring],
  );
  const { selected, toggle, setAll } = useSelection(candidates.map((c) => c.event.id));
  const toDelete = candidates.filter((c) => selected.has(c.event.id)).map((c) => c.event);

  return (
    <section className="card" data-testid="expired-panel">
      <div className="row">
        <label className="inline">
          Ended more than
          <input
            type="number"
            min={0}
            value={days}
            onChange={(e) => setDays(Math.max(0, Number(e.target.value) || 0))}
            style={{ width: '6em' }}
          />
          days ago (0 = before today)
        </label>
        <label>
          <input
            type="checkbox"
            checked={includeRecurring}
            onChange={(e) => setIncludeRecurring(e.target.checked)}
          />{' '}
          Include finished recurring series
        </label>
      </div>
      <p className="muted">
        Cutoff: {new Date(cutoff).toLocaleDateString()}. Recurring series without an end date are
        never removed.
      </p>

      {candidates.length === 0 ? (
        <p data-testid="empty">No expired events. 🎉</p>
      ) : (
        <>
          <p>
            {candidates.length} expired entr{candidates.length === 1 ? 'y' : 'ies'}.{' '}
            <button
              type="button"
              className="link"
              onClick={() => setAll(candidates.map((c) => c.event.id))}
            >
              Select all
            </button>{' '}
            <button type="button" className="link" onClick={() => setAll([])}>
              Select none
            </button>
          </p>
          <ul className="group">
            {candidates.map((c) => (
              <EventRow
                key={c.event.id}
                event={c.event}
                checked={selected.has(c.event.id)}
                onToggle={() => toggle(c.event.id)}
                note={
                  c.event.recurrence?.length
                    ? `series ended ${new Date(c.endsAt).toLocaleDateString()}` +
                      (c.exceptionCount ? `, +${c.exceptionCount} exceptions` : '')
                    : undefined
                }
              />
            ))}
          </ul>
        </>
      )}

      <DeleteBar
        api={props.api}
        calendar={props.calendar}
        toDelete={toDelete}
        onDeleted={props.onDeleted}
        onError={props.onError}
      />
    </section>
  );
}
