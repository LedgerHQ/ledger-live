/** Shares the call in flight for a key with the callers of the same key, until it settles. */
export function dedupeInFlight<K, V>(): (key: K, run: () => Promise<V>) => Promise<V> {
  const inflight = new Map<K, Promise<V>>();
  return (key, run) => {
    const running = inflight.get(key);
    if (running) return running;
    const started = run().finally(() => inflight.delete(key));
    inflight.set(key, started);
    return started;
  };
}
