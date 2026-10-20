import { useState } from 'react';
import { storeClientId, type AppConfig } from '../config';

export function SignIn({
  config,
  busy,
  onSignIn,
}: {
  config: AppConfig;
  busy: boolean;
  onSignIn: (clientId: string) => void;
}) {
  const [clientId, setClientId] = useState(config.googleClientId);
  const needsClientId = !config.mock && !config.googleClientId;

  return (
    <section className="card">
      <h2>Clean up your Google Calendar</h2>
      <p>Find and remove duplicate events and events that are already over.</p>
      <p>Nothing is deleted until you review the list and confirm.</p>

      {needsClientId && (
        <label className="field">
          Google OAuth client ID
          <input
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="1234-abc.apps.googleusercontent.com"
          />
          <small>
            This instance has no client ID configured. See{' '}
            <a href="https://github.com/habbo656/calendar-cleaner/blob/main/docs/self-hosting.md">
              self-hosting docs
            </a>
            .
          </small>
        </label>
      )}

      <button
        type="button"
        className="primary"
        disabled={busy || (!config.mock && !clientId.trim())}
        onClick={() => {
          if (needsClientId) storeClientId(clientId);
          onSignIn(clientId.trim());
        }}
      >
        {config.mock ? 'Sign in (mock)' : 'Sign in with Google'}
      </button>
    </section>
  );
}
