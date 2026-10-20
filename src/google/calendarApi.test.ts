import { describe, expect, it, vi } from 'vitest';
import { AuthExpiredError, createGoogleCalendarApi } from './calendarApi';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('createGoogleCalendarApi', () => {
  it('follows pagination when listing events and sends the bearer token', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ items: [{ id: 'a' }], nextPageToken: 'p2' }))
      .mockResolvedValueOnce(json({ items: [{ id: 'b' }] }));
    const api = createGoogleCalendarApi(() => 'tok', fetchMock);
    const events = await api.listEvents('cal@x');
    expect(events.map((e) => e.id)).toEqual(['a', 'b']);
    const [url, init] = fetchMock.mock.calls[1]!;
    expect(String(url)).toContain('/calendars/cal%40x/events?');
    expect(String(url)).toContain('pageToken=p2');
    expect(String(url)).toContain('singleEvents=false');
    expect((init!.headers as Record<string, string>).Authorization).toBe('Bearer tok');
  });

  it('treats 410 Gone on delete as success', async () => {
    const api = createGoogleCalendarApi(
      () => 't',
      vi.fn<typeof fetch>().mockResolvedValue(json({}, 410)),
    );
    await expect(api.deleteEvent('c', 'e')).resolves.toBeUndefined();
  });

  it('throws AuthExpiredError on 401', async () => {
    const api = createGoogleCalendarApi(
      () => 't',
      vi.fn<typeof fetch>().mockResolvedValue(json({}, 401)),
    );
    await expect(api.listCalendars()).rejects.toBeInstanceOf(AuthExpiredError);
  });

  it('retries rate-limited requests', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ error: { errors: [{ reason: 'rateLimitExceeded' }] } }, 403))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const api = createGoogleCalendarApi(() => 't', fetchMock);
    const p = api.deleteEvent('c', 'e');
    await vi.runAllTimersAsync();
    await expect(p).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('surfaces the Google error message for non-retryable errors', async () => {
    const api = createGoogleCalendarApi(
      () => 't',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(json({ error: { message: 'Forbidden for you' } }, 403)),
    );
    await expect(api.deleteEvent('c', 'e')).rejects.toThrow('Forbidden for you');
  });
});
