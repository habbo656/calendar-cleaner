import type { CalendarApi, CalendarEvent, CalendarListEntry } from './types';

/**
 * In-memory fake of the Calendar API. Enabled with `?mock` in the URL.
 * Used for local development without Google credentials and for all e2e tests,
 * so agents and CI can exercise the full UI deterministically.
 *
 * Fixture (calendar "Personal (mock)"), relative to now:
 * - "Team sync" ×3 identical (→ 2 duplicates), created at different times
 * - "Dentist" ×2 identical (→ 1 duplicate), in the past (→ also expired)
 * - "Dinner" ×2 different times (not duplicates)
 * - "Old conference", "Old trip (all-day)" in the past (expired)
 * - "Weekly standup" series with COUNT that ended in the past (expired series)
 * - "Forever weekly" infinite series (never expired)
 * - "Future party" in the future
 */
export function createMockCalendarApi(now: Date = new Date(), latencyMs = 50): CalendarApi {
  const day = 24 * 60 * 60 * 1000;
  const at = (offsetDays: number, hour = 10) => {
    const d = new Date(now.getTime() + offsetDays * day);
    d.setHours(hour, 0, 0, 0);
    return d;
  };
  const timed = (
    id: string,
    summary: string,
    offsetDays: number,
    hour: number,
    createdOffsetDays: number,
    extra: Partial<CalendarEvent> = {},
  ): CalendarEvent => ({
    id,
    status: 'confirmed',
    summary,
    start: { dateTime: at(offsetDays, hour).toISOString() },
    end: { dateTime: at(offsetDays, hour + 1).toISOString() },
    created: at(createdOffsetDays).toISOString(),
    ...extra,
  });
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const calendars: CalendarListEntry[] = [
    { id: 'mock-personal', summary: 'Personal (mock)', primary: true, accessRole: 'owner' },
    { id: 'mock-empty', summary: 'Empty (mock)', accessRole: 'owner' },
  ];

  const events = new Map<string, CalendarEvent[]>([
    [
      'mock-personal',
      [
        timed('sync-1', 'Team sync', 3, 9, -30),
        timed('sync-2', 'Team sync', 3, 9, -20),
        timed('sync-3', '  team  SYNC ', 3, 9, -10),
        timed('dentist-1', 'Dentist', -40, 14, -60),
        timed('dentist-2', 'Dentist', -40, 14, -50),
        timed('dinner-1', 'Dinner', 5, 19, -5),
        timed('dinner-2', 'Dinner', 6, 19, -5),
        timed('conf-1', 'Old conference', -100, 9, -200, { location: 'Berlin' }),
        {
          id: 'trip-1',
          status: 'confirmed',
          summary: 'Old trip (all-day)',
          start: { date: ymd(at(-20)) },
          end: { date: ymd(at(-17)) },
          created: at(-90).toISOString(),
        },
        timed('standup-series', 'Weekly standup', -120, 9, -130, {
          recurrence: ['RRULE:FREQ=WEEKLY;COUNT=5'],
        }),
        timed('forever-series', 'Forever weekly', -120, 11, -130, {
          recurrence: ['RRULE:FREQ=WEEKLY'],
        }),
        timed('party-1', 'Future party', 30, 20, -2),
      ],
    ],
    ['mock-empty', []],
  ]);

  const delay = () => new Promise((r) => setTimeout(r, latencyMs));

  return {
    async listCalendars() {
      await delay();
      return structuredClone(calendars);
    },
    async listEvents(calendarId, onProgress) {
      await delay();
      const list = structuredClone(events.get(calendarId) ?? []);
      onProgress?.(list.length);
      return list;
    },
    async deleteEvent(calendarId, eventId) {
      await delay();
      const list = events.get(calendarId) ?? [];
      events.set(
        calendarId,
        list.filter((e) => e.id !== eventId && e.recurringEventId !== eventId),
      );
    },
  };
}
