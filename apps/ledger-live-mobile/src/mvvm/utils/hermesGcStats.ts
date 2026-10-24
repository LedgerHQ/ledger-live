/** Garbage collections so far and their total pause time, from Hermes' instrumented stats. */
export type HermesGcStats = { count: number; pauseMs: number };

/** Undefined off Hermes, or when HermesInternal is disabled. */
export function readHermesGcStats(): HermesGcStats | undefined {
  const hermes: unknown = Reflect.get(globalThis, "HermesInternal");
  if (typeof hermes !== "object" || hermes === null || !("getInstrumentedStats" in hermes)) {
    return undefined;
  }
  const { getInstrumentedStats } = hermes;
  if (typeof getInstrumentedStats !== "function") return undefined;
  const stats: unknown = getInstrumentedStats.call(hermes);
  if (typeof stats !== "object" || stats === null) return undefined;
  const count = Reflect.get(stats, "js_numGCs");
  // js_gcTime is the wall time of all GC pauses so far, in seconds.
  const pauseSeconds = Reflect.get(stats, "js_gcTime");
  if (typeof count !== "number" || typeof pauseSeconds !== "number") return undefined;
  return { count, pauseMs: pauseSeconds * 1000 };
}
