import { rrulestr } from 'rrule';
import type { CalendarEvent } from '../google/types';
import { durationMillis, toMillis } from './eventTime';

/** Sentinel: the series has no end (or we cannot prove it ends). */
export const NEVER = Number.POSITIVE_INFINITY;

const FAR_FUTURE = Date.UTC(9999, 0, 1);

/**
 * Computes the end (epoch ms) of the last occurrence of a recurring series master.
 * Returns NEVER for unbounded series or when the rule cannot be parsed —
 * we fail safe: anything we do not understand is never considered expired.
 *
 * Note: rrule is evaluated in UTC from the master's start instant. DST shifts can
 * move occurrences by up to an hour, which is irrelevant for expiry decisions.
 */
export function lastOccurrenceEnd(master: CalendarEvent): number {
  const start = toMillis(master.start);
  const lines = master.recurrence ?? [];
  if (start === undefined || lines.length === 0) return NEVER;

  const rules = lines.filter((l) => /^(RRULE|RDATE|EXRULE|EXDATE)/i.test(l));
  const rrules = rules.filter((l) => /^RRULE/i.test(l));
  // Any RRULE without UNTIL or COUNT is infinite.
  if (rrules.some((r) => !/UNTIL=|COUNT=/i.test(r))) return NEVER;

  try {
    const dtstart = formatIcsUtc(start);
    const set = rrulestr([`DTSTART:${dtstart}`, ...rules].join('\n'), { forceset: true });
    const last = set.before(new Date(FAR_FUTURE), true);
    // No occurrences at all → the series is effectively over after its first start.
    const lastStart = last ? last.getTime() : start;
    return lastStart + durationMillis(master);
  } catch {
    return NEVER;
  }
}

function formatIcsUtc(ms: number): string {
  return new Date(ms)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}
