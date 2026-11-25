export type EntryDecodeFailure = { index: number; error: unknown };

export type DecodedEntries<Decoded> = { decoded: Decoded[]; failures: EntryDecodeFailure[] };

/** Decodes each stored entry alone. A failure has the index of its entry, never its value. */
export async function decodeEntries<Decoded>(
  codec: { decode(stored: unknown): Promise<Decoded> },
  stored: ReadonlyArray<unknown>,
): Promise<DecodedEntries<Decoded>> {
  const results = await Promise.allSettled(stored.map(entry => codec.decode(entry)));
  const decoded: Decoded[] = [];
  const failures: EntryDecodeFailure[] = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") decoded.push(result.value);
    else failures.push({ index, error: result.reason });
  });
  return { decoded, failures };
}

export function encodeEntries<State, Entry>(
  codec: { encode(entry: Entry, state: State): Promise<unknown> },
  entries: ReadonlyArray<Entry>,
  state: State,
): Promise<unknown[]> {
  return Promise.all(entries.map(entry => codec.encode(entry, state)));
}

/**
 * The entries whose id is not stored yet, also against a stored entry that does not decode. Filter
 * with it before `encodeEntries`: a stored entry is never encoded again. It compares the stored id
 * before any migration.
 */
export function entriesNotStored<Entry>(
  storedEntryId: (stored: unknown) => string | undefined,
  stored: ReadonlyArray<unknown>,
  entries: ReadonlyArray<Entry>,
  entryId: (entry: Entry) => string,
): Entry[] {
  const storedIds = new Set(stored.map(storedEntryId));
  return entries.filter(entry => !storedIds.has(entryId(entry)));
}

/**
 * Keeps the stored entries as they are, byte for byte, also those that do not decode, and adds
 * each encoded entry whose id is not stored yet. For the Node tools that add to a stored list:
 * filter with `entriesNotStored`, encode, then append.
 */
export function appendEntries(
  storedEntryId: (stored: unknown) => string | undefined,
  stored: ReadonlyArray<unknown>,
  added: ReadonlyArray<unknown>,
): unknown[] {
  const storedIds = new Set(stored.map(storedEntryId));
  return [...stored, ...added.filter(entry => !storedIds.has(storedEntryId(entry)))];
}
