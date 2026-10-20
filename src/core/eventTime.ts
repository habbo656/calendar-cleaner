import type { CalendarEvent, EventDateTime } from '../google/types';

/**
 * Converts an EventDateTime to epoch milliseconds.
 * All-day dates are interpreted as local midnight, matching how users see them.
 */
export function toMillis(dt: EventDateTime | undefined): number | undefined {
  if (!dt) return undefined;
  if (dt.dateTime) {
    const ms = Date.parse(dt.dateTime);
    return Number.isNaN(ms) ? undefined : ms;
  }
  if (dt.date) {
    const [y, m, d] = dt.date.split('-').map(Number);
    if (!y || !m || !d) return undefined;
    return new Date(y, m - 1, d).getTime();
  }
  return undefined;
}

export function isAllDay(event: CalendarEvent): boolean {
  return !!event.start?.date && !event.start?.dateTime;
}

/** Duration in ms (0 when start or end is missing). */
export function durationMillis(event: CalendarEvent): number {
  const start = toMillis(event.start);
  const end = toMillis(event.end);
  return start !== undefined && end !== undefined ? Math.max(0, end - start) : 0;
}

export function isRecurringMaster(event: CalendarEvent): boolean {
  return !!event.recurrence?.length;
}

export function isException(event: CalendarEvent): boolean {
  return !!event.recurringEventId;
}

/** Human-readable start for lists. */
export function formatStart(event: CalendarEvent, locale?: string): string {
  const ms = toMillis(event.start);
  if (ms === undefined) return '—';
  const opts: Intl.DateTimeFormatOptions = isAllDay(event)
    ? { dateStyle: 'medium' }
    : { dateStyle: 'medium', timeStyle: 'short' };
  return new Intl.DateTimeFormat(locale, opts).format(ms);
}
