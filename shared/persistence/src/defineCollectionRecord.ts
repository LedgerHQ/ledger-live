import type { z } from "zod";
import type { RecordVersions } from "./recordVersions";

/** The stored entry and back: the only codec work. */
export type CollectionCodec<State, Entry, Stored, Decoded> = {
  /** Decodes 1 entry of the latest version. The versions upgrade an older stored entry first. */
  decode(stored: Stored): Promise<Decoded>;
  /** The id of a decoded entry. A migration can change it: it can differ from the stored id. */
  decodedId(decoded: Decoded): string;
  encode(entry: Entry, state: State): Promise<Stored>;
};

/** How the record reads the entries in the app state, and puts them back at hydration. */
export type CollectionStateMapping<State, Entry, Decoded, Action> = {
  /** Persistence compares this reference to find a change. */
  select(state: State): ReadonlyArray<Entry>;
  /** True when a field that the record stores changed. */
  changed(previous: Entry, next: Entry): boolean;
  /** Only at hydration, never for a write. An entry that these actions drop stays stored. */
  toHydrationActions(decoded: ReadonlyArray<Decoded>): ReadonlyArray<Action>;
};

/** The codec of a definition: `decode` upgrades the stored entry to the latest version first. */
export type CollectionCodecDefinition<State, Entry, Decoded> = Readonly<{
  /** Rejects with `RecordDecodeError`, or `NewerRecordVersionError` for an entry of a newer app. */
  decode(stored: unknown): Promise<Decoded>;
  decodedId(decoded: Decoded): string;
  encode(entry: Entry, state: State): Promise<unknown>;
}>;

type CollectionCodecInput<State, Entry, Stored, Decoded> = {
  key: string;
  /** The versions of 1 stored entry. */
  versions: RecordVersions<Stored>;
  codec: CollectionCodec<State, Entry, Stored, Decoded>;
};

export type CollectionRecordInput<State, Entry, Stored, Decoded, Action> = CollectionCodecInput<
  State,
  Entry,
  Stored,
  Decoded
> & {
  entryId: (entry: Entry) => string;
  /**
   * The id in the payload of a stored entry of any version, newer included, read without a
   * decode: an entry that does not decode keeps its id.
   */
  storedEntryId: (payload: unknown) => string | undefined;
  state: CollectionStateMapping<State, Entry, Decoded, Action>;
};

export type CollectionRecordDefinition<
  State,
  Action = unknown,
  Entry = unknown,
  Decoded = unknown,
> = Readonly<{
  kind: "collection";
  key: string;
  /** The latest version. */
  version: number;
  /** The stored schema of 1 entry in each version, from v0. */
  storedSchemas: ReadonlyArray<z.ZodType>;
  entryId(entry: Entry): string;
  storedEntryId(stored: unknown): string | undefined;
  codec: CollectionCodecDefinition<State, Entry, Decoded>;
  state: Readonly<CollectionStateMapping<State, Entry, Decoded, Action>>;
}>;

/** The codec alone, for the Node tools that read and write a stored list with no Redux. */
export function defineCollectionCodec<State, Entry, Stored, Decoded>({
  key,
  versions,
  codec,
}: CollectionCodecInput<State, Entry, Stored, Decoded>): CollectionCodecDefinition<
  State,
  Entry,
  Decoded
> {
  return Object.freeze({
    decode: async (stored: unknown) => codec.decode(versions.decode(stored, key)),
    decodedId: codec.decodedId,
    encode: async (entry: Entry, state: State) => versions.encode(await codec.encode(entry, state)),
  });
}

/** A record stored as a list of entries. Each entry decodes alone. */
export function defineCollectionRecord<State, Entry, Stored, Decoded, Action>(
  input: CollectionRecordInput<State, Entry, Stored, Decoded, Action>,
): CollectionRecordDefinition<State, Action, Entry, Decoded> {
  const { key, versions, state } = input;

  return Object.freeze({
    kind: "collection",
    key,
    version: versions.latest,
    storedSchemas: versions.storedSchemas,
    entryId: input.entryId,
    storedEntryId: (stored: unknown) => input.storedEntryId(versions.payloadOf(stored)),
    codec: defineCollectionCodec(input),
    state: Object.freeze({
      select: state.select,
      changed: state.changed,
      toHydrationActions: state.toHydrationActions,
    }),
  });
}
