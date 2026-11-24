import type { z } from "zod";
import type { RecordVersions } from "./recordVersions";

/** The stored value and back. */
export type ValueCodec<Slice, Stored> = {
  encode(slice: Slice): Stored;
  /** Gives the slice of the latest version. The versions upgrade an older stored value first. */
  decode(stored: Stored): Slice;
};

/** How the record reads its slice of the app state, and puts it back at hydration. */
export type ValueStateMapping<State, Slice, Action> = {
  /** Persistence compares this reference to find a change. */
  select(state: State): Slice;
  /** Only at hydration, never for a write. */
  toHydrationAction(slice: Slice): Action;
};

export type ValueRecordInput<State, Slice, Stored, Action> = {
  key: string;
  versions: RecordVersions<Stored>;
  codec: ValueCodec<Slice, Stored>;
  state: ValueStateMapping<State, Slice, Action>;
};

export type ValueRecordDefinition<State, Action = unknown, Slice = unknown> = Readonly<{
  kind: "value";
  key: string;
  /** The latest version. */
  version: number;
  /** The stored schema of each version, from v0. */
  storedSchemas: ReadonlyArray<z.ZodType>;
  /**
   * `decode` upgrades the stored value to the latest version first, and throws
   * `RecordDecodeError`, or `NewerRecordVersionError` for a value of a newer app.
   */
  codec: Readonly<{ encode(slice: Slice): unknown; decode(stored: unknown): Slice }>;
  state: Readonly<ValueStateMapping<State, Slice, Action>>;
}>;

/** A record stored as 1 value, such as `history`. */
export function defineRecord<State, Slice, Stored, Action>(
  input: ValueRecordInput<State, Slice, Stored, Action>,
): ValueRecordDefinition<State, Action, Slice> {
  const { key, versions, codec, state } = input;

  return Object.freeze({
    kind: "value",
    key,
    version: versions.latest,
    storedSchemas: versions.storedSchemas,
    codec: Object.freeze({
      encode: (slice: Slice) => versions.encode(codec.encode(slice)),
      decode: (stored: unknown) => codec.decode(versions.decode(stored, key)),
    }),
    state: Object.freeze({ select: state.select, toHydrationAction: state.toHydrationAction }),
  });
}
