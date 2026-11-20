import { z } from "zod";
import { toRecordDecodeError } from "./toRecordDecodeError";

/** The stored value and back. */
export type ValueCodec<Slice, Stored> = {
  encode(slice: Slice): Stored;
  /** Gives the slice of a stored value that the schema accepted. A migration of an older shape goes here. */
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
  /** A label for the reports and the schema snapshot. Persistence does not store it. */
  version: number;
  schema: (zod: typeof z) => z.ZodType<Stored>;
  codec: ValueCodec<Slice, Stored>;
  state: ValueStateMapping<State, Slice, Action>;
};

export type ValueRecordDefinition<State, Action = unknown, Slice = unknown> = Readonly<{
  kind: "value";
  key: string;
  version: number;
  schema: z.ZodType;
  /** `decode` checks the stored value with the schema first, and throws `RecordDecodeError`. */
  codec: Readonly<{ encode(slice: Slice): unknown; decode(stored: unknown): Slice }>;
  state: Readonly<ValueStateMapping<State, Slice, Action>>;
}>;

/** A record stored as 1 value, such as `history`. */
export function defineRecord<State, Slice, Stored, Action>(
  input: ValueRecordInput<State, Slice, Stored, Action>,
): ValueRecordDefinition<State, Action, Slice> {
  const { key, version, codec, state } = input;
  const schema = input.schema(z);

  return Object.freeze({
    kind: "value",
    key,
    version,
    schema,
    codec: Object.freeze({
      encode: codec.encode,
      decode: (stored: unknown) => {
        const result = schema.safeParse(stored);
        if (!result.success) throw toRecordDecodeError(key, version, result.error.issues);
        return codec.decode(result.data);
      },
    }),
    state: Object.freeze({ select: state.select, toHydrationAction: state.toHydrationAction }),
  });
}
