import type { CalendarEvent } from '../google/types';

/**
 * Serialises events to a JSON backup that contains the full API resources, so
 * deleted events can be inspected or re-imported via the API later.
 */
export function toBackupJson(
  calendarId: string,
  events: CalendarEvent[],
  now = new Date(),
): string {
  return JSON.stringify(
    { app: 'calendar-cleaner', exportedAt: now.toISOString(), calendarId, events },
    null,
    2,
  );
}

export function downloadFile(filename: string, content: string, type = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
