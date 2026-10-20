import { describe, expect, it } from 'vitest';
import { cutoffDaysAgo, findExpired } from './expired';
import { ev } from './testUtils';

const cutoff = Date.parse('2026-06-01T00:00:00Z');
const opts = { cutoff, includeRecurring: true };

describe('findExpired', () => {
  it('returns single events that ended before the cutoff', () => {
    const past = ev({ id: 'past', start: '2026-05-01T10:00:00Z', end: '2026-05-01T11:00:00Z' });
    const future = ev({ id: 'future', start: '2026-07-01T10:00:00Z', end: '2026-07-01T11:00:00Z' });
    const spanning = ev({ id: 'span', start: '2026-05-31T23:00:00Z', end: '2026-06-01T01:00:00Z' });
    expect(findExpired([past, future, spanning], opts).map((c) => c.event.id)).toEqual(['past']);
  });

  it('uses the exclusive end date of all-day events', () => {
    const allDay = {
      ...ev({ id: 'ad' }),
      start: { date: '2026-01-01' },
      end: { date: '2026-01-02' },
    };
    expect(findExpired([allDay], opts)).toHaveLength(1);
  });

  it('expires a series only after its last occurrence', () => {
    const finished = ev({
      id: 'finished',
      start: '2026-01-05T09:00:00Z',
      end: '2026-01-05T10:00:00Z',
      recurrence: ['RRULE:FREQ=WEEKLY;COUNT=4'],
    });
    const untilPast = ev({
      id: 'until',
      start: '2026-01-05T09:00:00Z',
      end: '2026-01-05T10:00:00Z',
      recurrence: ['RRULE:FREQ=DAILY;UNTIL=20260301T000000Z'],
    });
    const stillRunning = ev({
      id: 'running',
      start: '2026-01-05T09:00:00Z',
      end: '2026-01-05T10:00:00Z',
      recurrence: ['RRULE:FREQ=WEEKLY;COUNT=100'],
    });
    const infinite = ev({
      id: 'inf',
      start: '2020-01-01T09:00:00Z',
      end: '2020-01-01T10:00:00Z',
      recurrence: ['RRULE:FREQ=YEARLY'],
    });
    const ids = findExpired([finished, untilPast, stillRunning, infinite], opts).map(
      (c) => c.event.id,
    );
    expect(ids.sort()).toEqual(['finished', 'until']);
  });

  it('keeps a finished series if an exception was moved past the cutoff', () => {
    const master = ev({
      id: 'm',
      start: '2026-01-05T09:00:00Z',
      end: '2026-01-05T10:00:00Z',
      recurrence: ['RRULE:FREQ=WEEKLY;COUNT=2'],
    });
    const moved = ev({
      recurringEventId: 'm',
      start: '2026-07-01T09:00:00Z',
      end: '2026-07-01T10:00:00Z',
    });
    expect(findExpired([master, moved], opts)).toHaveLength(0);

    const exceptionInPast = ev({
      recurringEventId: 'm',
      start: '2026-01-13T09:00:00Z',
      end: '2026-01-13T10:00:00Z',
    });
    const [c] = findExpired([master, exceptionInPast], opts);
    expect(c!.event.id).toBe('m');
    expect(c!.exceptionCount).toBe(1);
  });

  it('can exclude recurring series', () => {
    const master = ev({ recurrence: ['RRULE:FREQ=DAILY;COUNT=1'] });
    expect(findExpired([master], { ...opts, includeRecurring: false })).toHaveLength(0);
  });

  it('never returns exceptions or cancelled entries on their own', () => {
    const ex = ev({
      recurringEventId: 'x',
      start: '2026-01-01T09:00:00Z',
      end: '2026-01-01T10:00:00Z',
    });
    const cancelled = ev({
      status: 'cancelled',
      start: '2026-01-01T09:00:00Z',
      end: '2026-01-01T10:00:00Z',
    });
    expect(findExpired([ex, cancelled], opts)).toHaveLength(0);
  });

  it('fails safe on unparsable recurrence or missing end', () => {
    const broken = ev({
      start: '2020-01-01T09:00:00Z',
      end: '2020-01-01T10:00:00Z',
      recurrence: ['RRULE:GARBAGE;COUNT=x'],
    });
    const noEnd = { ...ev(), end: undefined };
    expect(findExpired([broken, noEnd], opts)).toHaveLength(0);
  });
});

describe('cutoffDaysAgo', () => {
  it('returns local midnight minus N days', () => {
    const now = new Date(2026, 5, 15, 13, 45);
    expect(cutoffDaysAgo(0, now)).toBe(new Date(2026, 5, 15).getTime());
    expect(cutoffDaysAgo(30, now)).toBe(new Date(2026, 4, 16).getTime());
  });
});
