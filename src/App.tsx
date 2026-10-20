import { useCallback, useMemo, useState } from 'react';
import type { AppConfig } from './config';
import { requestAccessToken, revokeAccessToken } from './google/auth';
import { AuthExpiredError, createGoogleCalendarApi } from './google/calendarApi';
import { createMockCalendarApi } from './google/mockApi';
import type { CalendarApi, CalendarEvent, CalendarListEntry } from './google/types';
import { SignIn } from './ui/SignIn';
import { CalendarPicker } from './ui/CalendarPicker';
import { DuplicatesPanel } from './ui/DuplicatesPanel';
import { ExpiredPanel } from './ui/ExpiredPanel';

type Mode = 'duplicates' | 'expired';

export function App({ config }: { config: AppConfig }) {
  const [api, setApi] = useState<CalendarApi | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [calendars, setCalendars] = useState<CalendarListEntry[]>([]);
  const [calendarId, setCalendarId] = useState<string>('');
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('duplicates');

  const handleError = useCallback((e: unknown) => {
    if (e instanceof AuthExpiredError) {
      setApi(null);
      setToken(null);
    }
    setError(e instanceof Error ? e.message : String(e));
  }, []);

  const signIn = useCallback(
    async (clientId: string) => {
      setError(null);
      try {
        let nextApi: CalendarApi;
        if (config.mock) {
          nextApi = createMockCalendarApi();
        } else {
          const t = await requestAccessToken(clientId);
          setToken(t.token);
          nextApi = createGoogleCalendarApi(() => t.token);
        }
        setLoading('Loading calendars…');
        const list = await nextApi.listCalendars();
        setApi(nextApi);
        setCalendars(list);
        setCalendarId(list.find((c) => c.primary)?.id ?? list[0]?.id ?? '');
      } catch (e) {
        handleError(e);
      } finally {
        setLoading(null);
      }
    },
    [config.mock, handleError],
  );

  const signOut = useCallback(() => {
    if (token) revokeAccessToken(token);
    setApi(null);
    setToken(null);
    setCalendars([]);
    setEvents(null);
  }, [token]);

  const loadEvents = useCallback(async () => {
    if (!api || !calendarId) return;
    setError(null);
    setLoading('Loading events…');
    try {
      const list = await api.listEvents(calendarId, (n) => setLoading(`Loading events… ${n}`));
      setEvents(list);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(null);
    }
  }, [api, calendarId, handleError]);

  const calendar = useMemo(
    () => calendars.find((c) => c.id === calendarId),
    [calendars, calendarId],
  );

  return (
    <div className="app">
      <header className="header">
        <h1>🧹 Calendar Cleaner</h1>
        {config.mock && <span className="badge">Mock mode</span>}
        {api && (
          <button type="button" className="link" onClick={signOut}>
            Sign out
          </button>
        )}
      </header>

      {error && (
        <div role="alert" className="error">
          {error}
        </div>
      )}

      {!api ? (
        <SignIn config={config} busy={!!loading} onSignIn={signIn} />
      ) : (
        <main>
          <CalendarPicker
            calendars={calendars}
            value={calendarId}
            onChange={(id) => {
              setCalendarId(id);
              setEvents(null);
            }}
            onLoad={loadEvents}
            busy={!!loading}
            loadedCount={events?.length}
          />

          {events && calendar && (
            <>
              <nav className="tabs" role="tablist">
                <button
                  role="tab"
                  aria-selected={mode === 'duplicates'}
                  onClick={() => setMode('duplicates')}
                >
                  Duplicates
                </button>
                <button
                  role="tab"
                  aria-selected={mode === 'expired'}
                  onClick={() => setMode('expired')}
                >
                  Expired
                </button>
              </nav>
              {mode === 'duplicates' ? (
                <DuplicatesPanel
                  api={api}
                  calendar={calendar}
                  events={events}
                  onDeleted={loadEvents}
                  onError={handleError}
                />
              ) : (
                <ExpiredPanel
                  api={api}
                  calendar={calendar}
                  events={events}
                  onDeleted={loadEvents}
                  onError={handleError}
                />
              )}
            </>
          )}
        </main>
      )}

      {loading && (
        <p className="status" aria-live="polite">
          {loading}
        </p>
      )}

      <footer className="footer">
        Runs entirely in your browser. Your calendar data never leaves your device except to talk
        directly to Google.
      </footer>
    </div>
  );
}
