import type { UnknownAction } from "@reduxjs/toolkit";
import type { RecordDefinition } from "@shared/persistence";

/** 1 storage key for each entry, and 1 key for their order. */
export type KeyPerEntryScheme = { kind: "keyPerEntry"; prefix: string; orderKey: string };

export type WriteStrategy = "immediate" | { debounceMs: number } | { throttleMs: number };

/** How 1 app stores 1 record. With no key scheme, the record is 1 storage key: the record key. */
export type PersistenceBinding<State> = {
  record: RecordDefinition<State, UnknownAction>;
  keyScheme?: KeyPerEntryScheme;
  strategy?: WriteStrategy;
};

export const keyPerEntry = ({
  prefix,
  orderKey,
}: {
  prefix: string;
  orderKey: string;
}): KeyPerEntryScheme => ({ kind: "keyPerEntry", prefix, orderKey });
