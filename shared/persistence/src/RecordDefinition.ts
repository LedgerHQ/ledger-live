import type { CollectionRecordDefinition } from "./defineCollectionRecord";
import type { ValueRecordDefinition } from "./defineRecord";

/** Any record that persistence reads and writes. */
export type RecordDefinition<State, Action = unknown> =
  | ValueRecordDefinition<State, Action>
  | CollectionRecordDefinition<State, Action>;
