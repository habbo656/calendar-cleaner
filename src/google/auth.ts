/**
 * Browser-only OAuth via Google Identity Services (token model).
 * The access token lives in memory only and is never persisted.
 */

export const SCOPES = [
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ');

const GIS_SRC = 'https://accounts.google.com/gsi/client';

let gisLoading: Promise<void> | undefined;

function loadGis(): Promise<void> {
  gisLoading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gisLoading = undefined;
      reject(
        new Error('Could not load Google Identity Services. Check your network or ad blocker.'),
      );
    };
    document.head.appendChild(script);
  });
  return gisLoading;
}

export interface AccessToken {
  token: string;
  expiresAt: number;
}

export async function requestAccessToken(clientId: string): Promise<AccessToken> {
  await loadGis();
  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description || response.error || 'Authorization failed'));
          return;
        }
        const [first = '', ...rest] = SCOPES.split(' ');
        if (!google.accounts.oauth2.hasGrantedAllScopes(response, first, ...rest)) {
          reject(new Error('Please grant all requested calendar permissions.'));
          return;
        }
        resolve({
          token: response.access_token,
          expiresAt: Date.now() + Number(response.expires_in) * 1000,
        });
      },
      error_callback: (err) => reject(new Error(err.message || err.type)),
    });
    client.requestAccessToken();
  });
}

export function revokeAccessToken(token: string): void {
  if (typeof google !== 'undefined') google.accounts.oauth2.revoke(token, () => {});
}
