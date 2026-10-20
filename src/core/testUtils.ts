import type { CalendarEvent } from '../google/types';

let seq = 0;

/** Builds a timed event; `start`/`end` are ISO strings. */
export function ev(
  partial: Partial<CalendarEvent> & { start?: string; end?: string } = {},
): CalendarEvent {
  const { start = '2026-01-10T10:00:00Z', end = '2026-01-10T11:00:00Z', ...rest } = partial;
  return {
    id: `e${++seq}`,
    status: 'confirmed',
    summary: 'Event',
    created: '2025-01-01T00:00:00Z',
    start: { dateTime: start },
    end: { dateTime: end },
    ...rest,
  } as CalendarEvent;
}
