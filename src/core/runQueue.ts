export interface QueueResult<T> {
  succeeded: T[];
  failed: { item: T; error: unknown }[];
}

/**
 * Runs `task` for every item with bounded concurrency. Never throws; failures are
 * collected so one bad item cannot abort a bulk deletion halfway.
 */
export async function runQueue<T>(
  items: T[],
  task: (item: T) => Promise<void>,
  options: {
    concurrency: number;
    onProgress?: (done: number, total: number) => void;
    signal?: AbortSignal;
  },
): Promise<QueueResult<T>> {
  const result: QueueResult<T> = { succeeded: [], failed: [] };
  let next = 0;
  let done = 0;

  async function worker(): Promise<void> {
    while (next < items.length && !options.signal?.aborted) {
      const item = items[next++]!;
      try {
        await task(item);
        result.succeeded.push(item);
      } catch (error) {
        result.failed.push({ item, error });
      }
      options.onProgress?.(++done, items.length);
    }
  }

  const workers = Array.from(
    { length: Math.max(1, Math.min(options.concurrency, items.length)) },
    worker,
  );
  await Promise.all(workers);
  return result;
}
