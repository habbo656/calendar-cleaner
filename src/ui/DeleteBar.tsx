import { useState } from 'react';
import { downloadFile, toBackupJson } from '../core/backup';
import { runQueue } from '../core/runQueue';
import type { CalendarApi, CalendarEvent, CalendarListEntry } from '../google/types';

/**
 * Shared "backup + confirm + delete" flow. Deletion is a two-step action: the first
 * click arms the button, the second one deletes.
 */
export function DeleteBar({
  api,
  calendar,
  toDelete,
  onDeleted,
  onError,
}: {
  api: CalendarApi;
  calendar: CalendarListEntry;
  toDelete: CalendarEvent[];
  onDeleted: () => void;
  onError: (e: unknown) => void;
}) {
  const [armed, setArmed] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  const backup = () =>
    downloadFile(
      `calendar-cleaner-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '')}.json`,
      toBackupJson(calendar.id, toDelete),
    );

  const run = async () => {
    setArmed(false);
    setSummary(null);
    setProgress({ done: 0, total: toDelete.length });
    try {
      const result = await runQueue(toDelete, (e) => api.deleteEvent(calendar.id, e.id), {
        concurrency: 4,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      const failed = result.failed.length;
      setSummary(
        `Deleted ${result.succeeded.length} event${result.succeeded.length === 1 ? '' : 's'}` +
          (failed ? `, ${failed} failed (${errorText(result.failed[0]?.error)})` : '.'),
      );
      onDeleted();
    } catch (e) {
      onError(e);
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="delete-bar">
      <span>
        <strong data-testid="selected-count">{toDelete.length}</strong> selected
      </span>
      <button type="button" onClick={backup} disabled={!toDelete.length || !!progress}>
        Download backup
      </button>
      {armed ? (
        <>
          <button type="button" className="danger" onClick={run}>
            Really delete {toDelete.length} from “{calendar.summary}”
          </button>
          <button type="button" onClick={() => setArmed(false)}>
            Cancel
          </button>
        </>
      ) : (
        <button
          type="button"
          className="danger"
          onClick={() => setArmed(true)}
          disabled={!toDelete.length || !!progress}
        >
          Delete selected
        </button>
      )}
      {progress && (
        <progress max={progress.total} value={progress.done} aria-label="Deleting">
          {progress.done}/{progress.total}
        </progress>
      )}
      {summary && (
        <span role="status" className="muted">
          {summary}
        </span>
      )}
    </div>
  );
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
