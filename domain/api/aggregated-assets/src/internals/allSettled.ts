type SettledResult<T> = { status: "fulfilled"; value: T } | { status: "rejected"; reason: unknown };

/**
 * Local `Promise.allSettled`, so a failed chunk does not reject the whole batch.
 *
 * Internal: the chunked lookup endpoint's partial-result tolerance depends on it.
 */
export function allSettled<T>(promises: Promise<T>[]): Promise<SettledResult<T>[]> {
  return Promise.all(
    promises.map(p =>
      p
        .then(value => ({ status: "fulfilled" as const, value }))
        .catch(reason => ({ status: "rejected" as const, reason })),
    ),
  );
}
