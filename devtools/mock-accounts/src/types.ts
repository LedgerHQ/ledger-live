import type { AccountDataSource } from "@domain/api-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";

/** A mock account of the accounts slice. */
export interface MockAccountsToolAccount {
  readonly accountUUID: string;
  readonly descriptor: AccountDescriptor;
}

export interface MockAccountsToolProps {
  /** The accounts slice entries whose descriptor has the `mock` purpose. */
  readonly accounts: readonly MockAccountsToolAccount[];
  readonly onAdd: (descriptors: readonly AccountDescriptor[]) => void;
  readonly onRemove: (accountUUIDs: readonly string[]) => void;
  /** Adds the mock source to the host's router; the tool calls it once loaded. */
  readonly addSource: (source: AccountDataSource) => void;
}
