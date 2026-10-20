import type { CalendarEvent } from '../google/types';
import { isException, isRecurringMaster, toMillis } from './eventTime';
import { lastOccurrenceEnd } from './recurrence';

export interface ExpiredOptions {
  /** Events that ended strictly before this instant are expired. */
  cutoff: number;
  /** Include finished recurring series (deleting the master removes all instances). */
  includeRecurring: boolean;
}

export interface ExpiredCandidate {
  event: CalendarEvent;
  /** End of the event, or of the last occurrence for a series. */
  endsAt: number;
  /** Number of exceptions that disappear together with this series. */
  exceptionCount: number;
}

/**
 * Finds events that are fully in the past relative to `cutoff`.
 *
 * Rules (see docs/requirements.md, US-2):
 * - single events: end < cutoff
 * - series masters: last occurrence end < cutoff AND no exception ends at/after cutoff
 * - exceptions are never returned on their own; they belong to their master
 * - events without a parsable end are never expired (fail safe)
 */
export function findExpired(events: CalendarEvent[], options: ExpiredOptions): ExpiredCandidate[] {
  const live = events.filter((e) => e.status !== 'cancelled');
  const exceptionsByMaster = new Map<string, CalendarEvent[]>();
  for (const e of live) {
    if (!isException(e)) continue;
    const list = exceptionsByMaster.get(e.recurringEventId!) ?? [];
    list.push(e);
    exceptionsByMaster.set(e.recurringEventId!, list);
  }

  const result: ExpiredCandidate[] = [];
  for (const event of live) {
    if (isException(event)) continue;

    if (isRecurringMaster(event)) {
      if (!options.includeRecurring) continue;
      const exceptions = exceptionsByMaster.get(event.id) ?? [];
      const exceptionEnds = exceptions.map((x) => toMillis(x.end) ?? Number.POSITIVE_INFINITY);
      const endsAt = Math.max(lastOccurrenceEnd(event), ...exceptionEnds);
      if (endsAt < options.cutoff) {
        result.push({ event, endsAt, exceptionCount: exceptions.length });
      }
      continue;
    }

    const endsAt = toMillis(event.end);
    if (endsAt !== undefined && endsAt < options.cutoff) {
      result.push({ event, endsAt, exceptionCount: 0 });
    }
  }
  return result.sort((a, b) => a.endsAt - b.endsAt);
}

/** cutoff = start of today (local) minus `days`. */
export function cutoffDaysAgo(days: number, now: Date = new Date()): number {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - days);
  return d.getTime();
}
