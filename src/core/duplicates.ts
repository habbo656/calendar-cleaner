import type { CalendarEvent } from '../google/types';
import { isException, toMillis } from './eventTime';

export interface DuplicateOptions {
  /** Also require identical location. */
  matchLocation: boolean;
  /** Also require identical description. */
  matchDescription: boolean;
}

export interface DuplicateGroup {
  key: string;
  /** The event that is kept (oldest `created`). */
  keep: CalendarEvent;
  /** The redundant copies, proposed for deletion. */
  duplicates: CalendarEvent[];
}

export function normalizeText(s: string | undefined): string {
  return (s ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Builds the identity key of an event. Two events with the same key are duplicates.
 * Title is compared case/whitespace-insensitively; start and end are compared as
 * instants (so the same moment expressed in different time zones still matches).
 * Series masters additionally compare their recurrence rules.
 */
export function duplicateKey(event: CalendarEvent, options: DuplicateOptions): string {
  const parts = [
    normalizeText(event.summary),
    event.start?.date ? `d:${event.start.date}` : `t:${toMillis(event.start) ?? ''}`,
    event.end?.date ? `d:${event.end.date}` : `t:${toMillis(event.end) ?? ''}`,
    (event.recurrence ?? [])
      .map((r) => r.trim().toUpperCase())
      .sort()
      .join('|'),
  ];
  if (options.matchLocation) parts.push(normalizeText(event.location));
  if (options.matchDescription) parts.push(normalizeText(event.description));
  return JSON.stringify(parts);
}

/** Oldest first; ties broken by id for determinism. */
function compareForKeep(a: CalendarEvent, b: CalendarEvent): number {
  const ca = a.created ? Date.parse(a.created) : Number.POSITIVE_INFINITY;
  const cb = b.created ? Date.parse(b.created) : Number.POSITIVE_INFINITY;
  if (ca !== cb) return ca - cb;
  return a.id.localeCompare(b.id);
}

/**
 * Groups duplicate events. Exceptions of recurring series and cancelled entries
 * are ignored — they are managed through their series master.
 */
export function findDuplicates(
  events: CalendarEvent[],
  options: DuplicateOptions,
): DuplicateGroup[] {
  const groups = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    if (event.status === 'cancelled' || isException(event)) continue;
    if (!event.start || !event.end) continue;
    const key = duplicateKey(event, options);
    const list = groups.get(key) ?? [];
    list.push(event);
    groups.set(key, list);
  }

  const result: DuplicateGroup[] = [];
  for (const [key, list] of groups) {
    if (list.length < 2) continue;
    const [keep, ...duplicates] = [...list].sort(compareForKeep);
    result.push({ key, keep: keep!, duplicates });
  }
  return result.sort((a, b) => (toMillis(a.keep.start) ?? 0) - (toMillis(b.keep.start) ?? 0));
}
