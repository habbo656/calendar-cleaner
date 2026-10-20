/** Subset of the Google Calendar API v3 resources this app relies on. */

export interface EventDateTime {
  /** All-day events: `YYYY-MM-DD`. The end date is exclusive. */
  date?: string;
  /** Timed events: RFC 3339 timestamp. */
  dateTime?: string;
  timeZone?: string;
}

export interface CalendarEvent {
  id: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  summary?: string;
  description?: string;
  location?: string;
  start?: EventDateTime;
  end?: EventDateTime;
  /** RRULE / EXRULE / RDATE / EXDATE lines of a recurring series master. */
  recurrence?: string[];
  /** Set on exceptions (modified instances) of a recurring series. */
  recurringEventId?: string;
  originalStartTime?: EventDateTime;
  created?: string;
  updated?: string;
  htmlLink?: string;
  iCalUID?: string;
  organizer?: { email?: string; self?: boolean };
}

export interface CalendarListEntry {
  id: string;
  summary: string;
  primary?: boolean;
  accessRole: 'freeBusyReader' | 'reader' | 'writer' | 'owner';
  backgroundColor?: string;
}

/** The boundary between the app and Google. Real and mock implementations exist. */
export interface CalendarApi {
  listCalendars(): Promise<CalendarListEntry[]>;
  /** Returns all non-expanded events (series masters + exceptions + single events). */
  listEvents(calendarId: string, onProgress?: (loaded: number) => void): Promise<CalendarEvent[]>;
  deleteEvent(calendarId: string, eventId: string): Promise<void>;
}
