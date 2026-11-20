import type { ListableStoragePort } from "@shared/storage";

type ReadRetry = { retries: number; delayMs: number };

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** The legacy start retried each read; without it, 1 read error fails a record for the session. */
export function withReadRetry(
  storage: ListableStoragePort,
  { retries, delayMs }: ReadRetry,
): ListableStoragePort {
  const retry = async <T>(read: () => Promise<T>, attempt = 0): Promise<T> => {
    try {
      return await read();
    } catch (error) {
      // Bad JSON stays bad: a retry only delays the start.
      if (attempt >= retries || error instanceof SyntaxError) throw error;
      await wait(delayMs);
      return retry(read, attempt + 1);
    }
  };

  return {
    get: key => retry(() => storage.get(key)),
    keys: prefix => retry(() => storage.keys(prefix)),
    set: (key, value) => storage.set(key, value),
    remove: key => storage.remove(key),
  };
}
