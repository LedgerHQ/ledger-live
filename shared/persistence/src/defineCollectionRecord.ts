import { z } from "zod";
import { toRecordDecodeError } from "./toRecordDecodeError";

/** The stored entry and back: the only codec work. */
export type CollectionCodec<State, Entry, Stored, Decoded> = {
  /** Decodes 1 stored entry that the schema accepted. A migration of an older shape goes here. */
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

/** The codec of a definition: `decode` checks the stored entry with the entry schema first. */
export type CollectionCodecDefinition<State, Entry, Decoded> = Readonly<{
  /** Rejects with `RecordDecodeError` when the entry schema refuses the stored entry. */
  decode(stored: unknown): Promise<Decoded>;
  decodedId(decoded: Decoded): string;
  encode(entry: Entry, state: State): Promise<unknown>;
}>;

type CollectionCodecInput<State, Entry, Stored, Decoded> = {
  key: string;
  /** A label for the reports and the schema snapshot. Persistence does not store it. */
  version: number;
  /** The stored shape of 1 entry. */
  entrySchema: (zod: typeof z) => z.ZodType<Stored>;
  codec: CollectionCodec<State, Entry, Stored, Decoded>;
};

export type CollectionRecordInput<State, Entry, Stored, Decoded, Action> = CollectionCodecInput<
  State,
  Entry,
  Stored,
  Decoded
> & {
  entryId: (entry: Entry) => string;
  /** The id of a stored entry, read without a decode: an entry that does not decode keeps its id. */
  storedEntryId: (stored: unknown) => string | undefined;
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
  version: number;
  entrySchema: z.ZodType;
  entryId(entry: Entry): string;
  storedEntryId(stored: unknown): string | undefined;
  codec: CollectionCodecDefinition<State, Entry, Decoded>;
  state: Readonly<CollectionStateMapping<State, Entry, Decoded, Action>>;
}>;

function checkedCodec<State, Entry, Stored, Decoded>(
  { key, version, codec }: CollectionCodecInput<State, Entry, Stored, Decoded>,
  entrySchema: z.ZodType<Stored>,
): CollectionCodecDefinition<State, Entry, Decoded> {
  return Object.freeze({
    decode: async (stored: unknown) => {
      const result = entrySchema.safeParse(stored);
      if (!result.success) throw toRecordDecodeError(key, version, result.error.issues);
      return codec.decode(result.data);
    },
    decodedId: codec.decodedId,
    encode: codec.encode,
  });
}

/** The codec alone, for the Node tools that read and write a stored list with no Redux. */
export function defineCollectionCodec<State, Entry, Stored, Decoded>(
  input: CollectionCodecInput<State, Entry, Stored, Decoded>,
): CollectionCodecDefinition<State, Entry, Decoded> {
  return checkedCodec(input, input.entrySchema(z));
}

/** A record stored as a list of entries, such as the accounts. Each entry decodes alone. */
export function defineCollectionRecord<State, Entry, Stored, Decoded, Action>(
  input: CollectionRecordInput<State, Entry, Stored, Decoded, Action>,
): CollectionRecordDefinition<State, Action, Entry, Decoded> {
  const { key, version, state } = input;
  const entrySchema = input.entrySchema(z);

  return Object.freeze({
    kind: "collection",
    key,
    version,
    entrySchema,
    entryId: input.entryId,
    storedEntryId: input.storedEntryId,
    codec: checkedCodec(input, entrySchema),
    state: Object.freeze({
      select: state.select,
      changed: state.changed,
      toHydrationActions: state.toHydrationActions,
    }),
  });
}
