import type { UnknownAction } from "@reduxjs/toolkit";
import { encodeEntries, type CollectionRecordDefinition } from "@shared/persistence";
import type { ListableStoragePort, StoragePort } from "@shared/storage";
import type { KeyPerEntryScheme, PersistenceBinding } from "../bindings";

type CollectionRecord<State> = CollectionRecordDefinition<State, UnknownAction>;

/** 1 stored entry and its id, when it has one: its value, or the error of its read. */
export type StoredEntry = { id: string | undefined; key?: string } & (
  | { value: unknown }
  | { readError: unknown }
);

/** The ids and the entries of the last write: the next write compares the state with them. */
export type WrittenEntries = { ids: string[]; byId: Map<string, unknown> };

export class NotAListError extends Error {
  override name = "NotAListError";
}

/** 1 stored entry after its decode: the decoded entry, or why it failed. */
export type DecodedStoredEntry<Decoded> = { entry: StoredEntry } & (
  | { decoded: Decoded }
  | { failure: { operation: "read" | "decode"; error: unknown } }
);

export async function decodeStoredEntry<State, Decoded>(
  record: CollectionRecordDefinition<State, UnknownAction, unknown, Decoded>,
  entry: StoredEntry,
): Promise<DecodedStoredEntry<Decoded>> {
  if ("readError" in entry)
    return { entry, failure: { operation: "read", error: entry.readError } };
  try {
    return { entry, decoded: await record.codec.decode(entry.value) };
  } catch (error) {
    return { entry, failure: { operation: "decode", error } };
  }
}

const isListable = (storage: StoragePort): storage is ListableStoragePort =>
  "keys" in storage && typeof storage.keys === "function";

function listable(storage: StoragePort): ListableStoragePort {
  if (!isListable(storage)) throw new TypeError("keyPerEntry needs a listable storage");
  return storage;
}

export function assertBindingsFit<State>(
  storage: StoragePort,
  bindings: ReadonlyArray<PersistenceBinding<State>>,
): void {
  for (const { record, keyScheme } of bindings) {
    if (!keyScheme) continue;
    if (record.kind !== "collection") {
      throw new TypeError(`Record "${record.key}": keyPerEntry needs a collection record`);
    }
    listable(storage);
  }
}

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === "string");

/** Keys missing from the order come first, as the legacy mobile read does. */
export function orderEntryKeys(
  keys: ReadonlyArray<string>,
  prefix: string,
  order: unknown,
): string[] {
  if (!isStringList(order)) return [...keys];
  const position = new Map(order.map((id, index) => [id, index]));
  const positionOf = (key: string) => position.get(key.slice(prefix.length)) ?? -1;
  return [...keys].sort((a, b) => positionOf(a) - positionOf(b));
}

/** The stored entries in order, or `undefined` when nothing is stored. */
export async function readEntries<State>(
  storage: StoragePort,
  record: CollectionRecord<State>,
  keyScheme: KeyPerEntryScheme | undefined,
): Promise<StoredEntry[] | undefined> {
  if (!keyScheme) {
    const stored = await storage.get(record.key);
    if (stored === undefined || stored === null) return undefined;
    if (!Array.isArray(stored)) throw new NotAListError();
    return stored.map(value => ({ id: record.storedEntryId(value), value }));
  }
  const entryStorage = listable(storage);
  const keys = await entryStorage.keys(keyScheme.prefix);
  if (keys.length === 0) return undefined;
  const order = await entryStorage.get(keyScheme.orderKey).catch(() => undefined);
  return Promise.all(
    orderEntryKeys(keys, keyScheme.prefix, order).map(key => {
      const id = key.slice(keyScheme.prefix.length);
      return entryStorage.get(key).then(
        (value): StoredEntry => ({ id, key, value }),
        (readError: unknown): StoredEntry => ({ id, key, readError }),
      );
    }),
  );
}

export function snapshotEntries<State>(
  record: CollectionRecord<State>,
  state: State,
): WrittenEntries {
  const entries = record.state.select(state);
  return {
    ids: entries.map(entry => record.entryId(entry)),
    byId: new Map(entries.map(entry => [record.entryId(entry), entry])),
  };
}

/**
 * What storage holds after the hydration, as the baseline of the first write. A state entry with
 * no stored id (a migration gave it a new id) is not stored yet. A stored id that is neither in the
 * state nor kept (the old id of that entry) is stale: the first write removes it.
 */
export function storedSnapshot<State>(
  record: CollectionRecord<State>,
  state: State,
  storedIds: ReadonlySet<string>,
  kept: ReadonlyArray<StoredEntry>,
): WrittenEntries {
  const inState = snapshotEntries(record, state);
  const keptIds = new Set(kept.map(entry => entry.id));
  const stored = inState.ids.filter(id => storedIds.has(id));
  const stale = [...storedIds].filter(id => !inState.byId.has(id) && !keptIds.has(id));
  return {
    ids: [...stored, ...stale],
    byId: new Map(stored.map(id => [id, inState.byId.get(id)])),
  };
}

/** Waits for all the operations, so that none runs after a failure returns, then rejects. */
async function settleAll(operations: ReadonlyArray<Promise<unknown>>): Promise<void> {
  const results = await Promise.allSettled(operations);
  const failed = results.find(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );
  if (failed) throw failed.reason;
}

const sameIds = (a: ReadonlyArray<string>, b: ReadonlyArray<string>) =>
  a.length === b.length && a.every((id, index) => id === b[index]);

/**
 * Writes what changed since `previous`. The kept entries stay stored, unless the state has an
 * entry with the same id. Returns `undefined` when nothing changed.
 */
export async function writeEntries<State>(
  storage: StoragePort,
  record: CollectionRecord<State>,
  keyScheme: KeyPerEntryScheme | undefined,
  state: State,
  previous: WrittenEntries,
  kept: ReadonlyArray<StoredEntry>,
): Promise<{ written: WrittenEntries; kept: StoredEntry[] } | undefined> {
  const entries = record.state.select(state);
  const current = snapshotEntries(record, state);
  const currentIds = new Set(current.ids);
  const changed = entries.filter(entry => {
    const before = previous.byId.get(record.entryId(entry));
    return before === undefined || record.state.changed(before, entry);
  });
  const removed = previous.ids.some(id => !currentIds.has(id));
  if (changed.length === 0 && !removed && sameIds(previous.ids, current.ids)) return undefined;

  const stillKept = kept.filter(entry => entry.id === undefined || !currentIds.has(entry.id));
  if (!keyScheme) {
    const keptValues = stillKept.flatMap(entry => ("value" in entry ? [entry.value] : []));
    await storage.set(record.key, [
      ...(await encodeEntries(record.codec, entries, state)),
      ...keptValues,
    ]);
    return { written: current, kept: stillKept };
  }

  // MMKV cannot write several keys atomically: entries first, stale keys next, the order last.
  const entryStorage = listable(storage);
  await settleAll(
    changed.map(async entry =>
      entryStorage.set(
        keyScheme.prefix + record.entryId(entry),
        await record.codec.encode(entry, state),
      ),
    ),
  );
  const keptKeys = new Set(stillKept.map(entry => entry.key));
  const staleKeys = (await entryStorage.keys(keyScheme.prefix)).filter(
    key => !currentIds.has(key.slice(keyScheme.prefix.length)) && !keptKeys.has(key),
  );
  await settleAll(staleKeys.map(key => entryStorage.remove(key)));
  await entryStorage.set(keyScheme.orderKey, current.ids);
  return { written: current, kept: stillKept };
}
