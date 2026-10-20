export interface AppConfig {
  googleClientId: string;
  /** Use the in-memory fake calendar instead of Google (dev, e2e, demos). */
  mock: boolean;
}

const CLIENT_ID_STORAGE_KEY = 'calendar-cleaner.googleClientId';

/**
 * Resolves configuration at runtime so one static build works everywhere.
 * Precedence for the client ID: ?clientId= → localStorage → config.json → build-time env.
 */
export async function loadConfig(): Promise<AppConfig> {
  const params = new URLSearchParams(window.location.search);
  const mock = params.has('mock');

  let fileClientId = '';
  try {
    const res = await fetch('./config.json', { cache: 'no-store' });
    if (res.ok) fileClientId = ((await res.json()) as Partial<AppConfig>).googleClientId ?? '';
  } catch {
    // config.json is optional
  }

  const googleClientId =
    params.get('clientId') ||
    readStoredClientId() ||
    fileClientId ||
    (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ||
    '';

  return { googleClientId, mock };
}

function readStoredClientId(): string {
  try {
    return localStorage.getItem(CLIENT_ID_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function storeClientId(clientId: string): void {
  try {
    localStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId.trim());
  } catch {
    // storage unavailable (private mode) — the value just won't persist
  }
}
