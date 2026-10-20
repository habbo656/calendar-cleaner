import { describe, expect, it } from 'vitest';
import { findDuplicates } from './duplicates';
import { ev } from './testUtils';

const opts = { matchLocation: false, matchDescription: false };

describe('findDuplicates', () => {
  it('groups events with same title, start and end and keeps the oldest', () => {
    const a = ev({ id: 'a', created: '2025-03-01T00:00:00Z' });
    const b = ev({ id: 'b', created: '2025-01-01T00:00:00Z' });
    const c = ev({ id: 'c', created: '2025-02-01T00:00:00Z' });
    const [group, ...rest] = findDuplicates([a, b, c], opts);
    expect(rest).toHaveLength(0);
    expect(group!.keep.id).toBe('b');
    expect(group!.duplicates.map((e) => e.id)).toEqual(['c', 'a']);
  });

  it('compares titles case- and whitespace-insensitively', () => {
    const groups = findDuplicates(
      [ev({ summary: 'Team Sync' }), ev({ summary: '  team   sync ' })],
      opts,
    );
    expect(groups).toHaveLength(1);
  });

  it('treats the same instant in different time zones as equal', () => {
    const a = ev({ start: '2026-01-10T10:00:00Z', end: '2026-01-10T11:00:00Z' });
    const b = ev({ start: '2026-01-10T11:00:00+01:00', end: '2026-01-10T12:00:00+01:00' });
    expect(findDuplicates([a, b], opts)).toHaveLength(1);
  });

  it('does not group events with different times or titles', () => {
    const groups = findDuplicates(
      [
        ev(),
        ev({ start: '2026-01-10T12:00:00Z', end: '2026-01-10T13:00:00Z' }),
        ev({ summary: 'Other' }),
      ],
      opts,
    );
    expect(groups).toHaveLength(0);
  });

  it('respects the optional location/description criteria', () => {
    const a = ev({ location: 'Room 1' });
    const b = ev({ location: 'Room 2' });
    expect(findDuplicates([a, b], opts)).toHaveLength(1);
    expect(findDuplicates([a, b], { ...opts, matchLocation: true })).toHaveLength(0);
    const c = ev({ description: 'x' });
    const d = ev({ description: 'y' });
    expect(findDuplicates([c, d], { ...opts, matchDescription: true })).toHaveLength(0);
  });

  it('handles all-day events by date', () => {
    const allDay = () => ({ ...ev(), start: { date: '2026-02-01' }, end: { date: '2026-02-02' } });
    expect(findDuplicates([allDay(), allDay()], opts)).toHaveLength(1);
  });

  it('only groups series masters with identical recurrence', () => {
    const weekly = ev({ recurrence: ['RRULE:FREQ=WEEKLY'] });
    const weekly2 = ev({ recurrence: ['RRULE:FREQ=WEEKLY'] });
    const daily = ev({ recurrence: ['RRULE:FREQ=DAILY'] });
    const single = ev();
    const groups = findDuplicates([weekly, weekly2, daily, single], opts);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.duplicates).toHaveLength(1);
  });

  it('ignores cancelled entries and exceptions of recurring series', () => {
    const groups = findDuplicates(
      [ev(), ev({ status: 'cancelled' }), ev({ recurringEventId: 'series' })],
      opts,
    );
    expect(groups).toHaveLength(0);
  });
});
