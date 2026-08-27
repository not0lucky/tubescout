export class TubeScoutError extends Error {
  constructor(message: string, public readonly hint?: string) {
    super(message);
    this.name = "TubeScoutError";
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  label?: string;
}

/** Retry with exponential backoff + jitter. Logs attempts to stderr (never stdout — MCP owns it). */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const attempts = opts.attempts ?? 3;
  const base = opts.baseDelayMs ?? 500;
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        const delay = base * 2 ** i + Math.random() * base;
        console.error(`[tubescout] ${opts.label ?? "op"} failed (attempt ${i + 1}/${attempts}), retrying in ${Math.round(delay)}ms: ${err instanceof Error ? err.message : err}`);
        await sleep(delay);
      }
    }
  }
  throw lastErr;
}

/** Run tasks with bounded concurrency; failures resolve to fallback(err) instead of rejecting the batch. */
export async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
  fallback: (item: T, err: unknown) => R,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = await fn(items[i]);
      } catch (err) {
        results[i] = fallback(items[i], err);
      }
    }
  });
  await Promise.all(workers);
  return results;
}
