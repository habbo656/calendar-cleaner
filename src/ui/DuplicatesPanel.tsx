import { useMemo, useState } from 'react';
import { findDuplicates, type DuplicateOptions } from '../core/duplicates';
import type { CalendarApi, CalendarEvent, CalendarListEntry } from '../google/types';
import { DeleteBar } from './DeleteBar';
import { EventRow } from './EventRow';
import { useSelection } from './useSelection';

export function DuplicatesPanel(props: {
  api: CalendarApi;
  calendar: CalendarListEntry;
  events: CalendarEvent[];
  onDeleted: () => void;
  onError: (e: unknown) => void;
}) {
  const [options, setOptions] = useState<DuplicateOptions>({
    matchLocation: false,
    matchDescription: false,
  });
  const groups = useMemo(() => findDuplicates(props.events, options), [props.events, options]);
  const candidates = useMemo(() => groups.flatMap((g) => g.duplicates), [groups]);
  const { selected, toggle, setAll } = useSelection(candidates.map((e) => e.id));
  const toDelete = candidates.filter((e) => selected.has(e.id));

  return (
    <section className="card" data-testid="duplicates-panel">
      <div className="row">
        <label>
          <input
            type="checkbox"
            checked={options.matchLocation}
            onChange={(e) => setOptions({ ...options, matchLocation: e.target.checked })}
          />{' '}
          Location must match
        </label>
        <label>
          <input
            type="checkbox"
            checked={options.matchDescription}
            onChange={(e) => setOptions({ ...options, matchDescription: e.target.checked })}
          />{' '}
          Description must match
        </label>
      </div>
      <p className="muted">
        Events with the same title, start and end are duplicates. The oldest copy is kept.
      </p>

      {groups.length === 0 ? (
        <p data-testid="empty">No duplicates found. 🎉</p>
      ) : (
        <>
          <p>
            {groups.length} group{groups.length === 1 ? '' : 's'}, {candidates.length} duplicate
            {candidates.length === 1 ? '' : 's'}.{' '}
            <button
              type="button"
              className="link"
              onClick={() => setAll(candidates.map((e) => e.id))}
            >
              Select all
            </button>{' '}
            <button type="button" className="link" onClick={() => setAll([])}>
              Select none
            </button>
          </p>
          {groups.map((g) => (
            <ul key={g.key} className="group">
              <EventRow event={g.keep} note="kept" />
              {g.duplicates.map((d) => (
                <EventRow
                  key={d.id}
                  event={d}
                  checked={selected.has(d.id)}
                  onToggle={() => toggle(d.id)}
                  note="duplicate"
                />
              ))}
            </ul>
          ))}
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
