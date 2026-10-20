import { describe, expect, it } from 'vitest';
import { runQueue } from './runQueue';

describe('runQueue', () => {
  it('runs all items with bounded concurrency and collects failures', async () => {
    let active = 0;
    let maxActive = 0;
    const progress: number[] = [];
    const result = await runQueue(
      [1, 2, 3, 4, 5, 6],
      async (n) => {
        active++;
        maxActive = Math.max(maxActive, active);
        await new Promise((r) => setTimeout(r, 5));
        active--;
        if (n % 3 === 0) throw new Error(`fail ${n}`);
      },
      { concurrency: 2, onProgress: (d) => progress.push(d) },
    );
    expect(maxActive).toBe(2);
    expect(result.succeeded.sort()).toEqual([1, 2, 4, 5]);
    expect(result.failed.map((f) => f.item).sort()).toEqual([3, 6]);
    expect(progress).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('handles an empty list', async () => {
    expect(await runQueue([], async () => {}, { concurrency: 4 })).toEqual({
      succeeded: [],
      failed: [],
    });
  });
});
