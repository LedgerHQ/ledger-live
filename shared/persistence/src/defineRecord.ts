import type { z } from "zod";
import { RecordDecodeError } from "./errors";
import type { RecordVersions } from "./recordVersions";

export type ValueCodec<Slice, Stored> = {
  encode(slice: Slice): Stored;
  /** Gets a value of the latest version: the versions upgrade an older stored value first. */
  decode(stored: Stored): Slice;
};

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
  storedSchemas: ReadonlyArray<z.ZodType>;
  /** `decode` throws `RecordDecodeError`, or `NewerRecordVersionError` for a value of a newer app. */
  codec: Readonly<{ encode(slice: Slice): unknown; decode(stored: unknown): Slice }>;
  state: Readonly<ValueStateMapping<State, Slice, Action>>;
}>;

function runCodecDecode<Slice, Stored>(
  codec: ValueCodec<Slice, Stored>,
  latest: Stored,
  key: string,
  version: number,
): Slice {
  try {
    return codec.decode(latest);
  } catch (error) {
    const name = error instanceof Error ? error.name : typeof error;
    throw new RecordDecodeError(key, version, `the codec decode threw ${name}`);
  }
}

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
      decode: (stored: unknown) =>
        runCodecDecode(codec, versions.decode(stored, key), key, versions.latest),
    }),
    state: Object.freeze({ select: state.select, toHydrationAction: state.toHydrationAction }),
  });
}
