import type { CalendarApi, CalendarEvent, CalendarListEntry } from './types';

const BASE = 'https://www.googleapis.com/calendar/v3';
const EVENT_FIELDS =
  'nextPageToken,items(id,status,summary,description,location,start,end,recurrence,recurringEventId,originalStartTime,created,updated,htmlLink,iCalUID,organizer)';

export class AuthExpiredError extends Error {
  constructor() {
    super('Your Google session expired. Please sign in again.');
  }
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isRetryable(status: number, body: string): boolean {
  if (status === 429 || status >= 500) return true;
  return status === 403 && /rateLimitExceeded|userRateLimitExceeded/.test(body);
}

export function createGoogleCalendarApi(
  getToken: () => string,
  fetchImpl: typeof fetch = fetch,
): CalendarApi {
  async function request(path: string, init: RequestInit = {}, attempt = 0): Promise<Response> {
    const res = await fetchImpl(`${BASE}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${getToken()}`, ...init.headers },
    });
    if (res.ok) return res;
    if (res.status === 401) throw new AuthExpiredError();
    const body = await res.text();
    if (attempt < 5 && isRetryable(res.status, body)) {
      await sleep(2 ** attempt * 500 + Math.random() * 250);
      return request(path, init, attempt + 1);
    }
    // 410 Gone / 404 on delete is handled by the caller.
    throw new ApiError(res.status, extractMessage(body) ?? `HTTP ${res.status}`);
  }

  return {
    async listCalendars() {
      const items: CalendarListEntry[] = [];
      let pageToken: string | undefined;
      do {
        const q = new URLSearchParams({ maxResults: '250', minAccessRole: 'writer' });
        if (pageToken) q.set('pageToken', pageToken);
        const data = (await (await request(`/users/me/calendarList?${q}`)).json()) as {
          items?: CalendarListEntry[];
          nextPageToken?: string;
        };
        items.push(...(data.items ?? []));
        pageToken = data.nextPageToken;
      } while (pageToken);
      return items;
    },

    async listEvents(calendarId, onProgress) {
      const items: CalendarEvent[] = [];
      let pageToken: string | undefined;
      do {
        const q = new URLSearchParams({
          maxResults: '2500',
          singleEvents: 'false',
          showDeleted: 'false',
          fields: EVENT_FIELDS,
        });
        if (pageToken) q.set('pageToken', pageToken);
        const res = await request(`/calendars/${encodeURIComponent(calendarId)}/events?${q}`);
        const data = (await res.json()) as { items?: CalendarEvent[]; nextPageToken?: string };
        items.push(...(data.items ?? []));
        onProgress?.(items.length);
        pageToken = data.nextPageToken;
      } while (pageToken);
      return items;
    },

    async deleteEvent(calendarId, eventId) {
      try {
        await request(
          `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=none`,
          { method: 'DELETE' },
        );
      } catch (e) {
        // Already gone → the desired end state is reached.
        if (e instanceof ApiError && (e.status === 410 || e.status === 404)) return;
        throw e;
      }
    },
  };
}

function extractMessage(body: string): string | undefined {
  try {
    return (JSON.parse(body) as { error?: { message?: string } }).error?.message;
  } catch {
    return undefined;
  }
}
