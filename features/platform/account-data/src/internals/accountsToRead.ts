/** The accounts already read, for one store and one set of read options. */
export type ReadRecord = { store: unknown; options: string; keys: ReadonlySet<string> };

/** The accounts to read now, and the record to keep: an account is read once per store and options while it stays listed. */
export function accountsToRead(
  previous: ReadRecord | undefined,
  next: { store: unknown; options: string; keys: readonly string[] },
): { toRead: string[]; record: ReadRecord } {
  const same = previous && previous.store === next.store && previous.options === next.options;
  const already = same ? previous.keys : new Set<string>();
  return {
    toRead: next.keys.filter(key => !already.has(key)),
    record: { store: next.store, options: next.options, keys: new Set(next.keys) },
  };
}
