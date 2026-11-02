/** A dependency a test can replace, kept in the module that uses it. */
export type TestSeam<T> = {
  /** The test's replacement, or else the real dependency. */
  get(): T;
  /** Replaces the dependency (`null` restores it) and returns the replacement it drops. */
  set(replacement: T | null): T | null;
};

const resets: (() => void)[] = [];

/**
 * Every seam is registered here, so one `resetTestSeams()` restores them all. `onSet` runs before
 * each change, e.g. to drop what the old dependency built, or to refuse the change by throwing.
 */
export function createTestSeam<T>(real: T, onSet?: () => void): TestSeam<T> {
  let replacement: T | null = null;
  const seam: TestSeam<T> = {
    get: () => replacement ?? real,
    set: next => {
      onSet?.();
      const previous = replacement;
      replacement = next;
      return previous;
    },
  };
  resets.push(() => {
    if (replacement !== null) seam.set(null);
  });
  return seam;
}

/** @internal For a test's after hook: restores every seam, even past one that refuses. */
export function resetTestSeams(): void {
  let failure: { error: unknown } | undefined;
  for (const reset of resets) {
    try {
      reset();
    } catch (error) {
      failure ??= { error };
    }
  }
  if (failure) throw failure.error;
}
