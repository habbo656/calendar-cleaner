import type { CalendarListEntry } from '../google/types';

export function CalendarPicker({
  calendars,
  value,
  onChange,
  onLoad,
  busy,
  loadedCount,
}: {
  calendars: CalendarListEntry[];
  value: string;
  onChange: (id: string) => void;
  onLoad: () => void;
  busy: boolean;
  loadedCount?: number;
}) {
  if (calendars.length === 0) {
    return <p className="card">No calendars with write access found.</p>;
  }
  return (
    <section className="card row">
      <label className="field grow">
        Calendar
        <select value={value} onChange={(e) => onChange(e.target.value)} disabled={busy}>
          {calendars.map((c) => (
            <option key={c.id} value={c.id}>
              {c.summary}
              {c.primary ? ' (primary)' : ''}
            </option>
          ))}
        </select>
      </label>
      <button type="button" className="primary" onClick={onLoad} disabled={busy || !value}>
        {loadedCount === undefined ? 'Scan calendar' : 'Rescan'}
      </button>
      {loadedCount !== undefined && <span className="muted">{loadedCount} entries loaded</span>}
    </section>
  );
}
