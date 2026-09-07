import type { ContactId } from "@domain/entity-contact";

/**
 * An account `OUT` reduced to what contact matching needs, so the platform layer never depends on
 * `@ledgerhq/types-live` or the account store. `id` is unused by matching and kept only for a later
 * History filter. `date` is epoch milliseconds.
 */
export type OutgoingOperation = Readonly<{
  id?: string;
  recipientAddress: string;
  date: number;
  currencyId: string;
}>;

type ContactOperationBase = Readonly<{
  id: string;
  currencyId: string;
  /** Epoch milliseconds, like {@link OutgoingOperation}. */
  date: number;
}>;

/** An incoming transfer: only its `senders` can match a contact address. */
export type ContactIncomingOperation = ContactOperationBase &
  Readonly<{ type: "IN"; senders: readonly string[] }>;

/** An outgoing transfer: only its `recipients` can match a contact address. */
export type ContactOutgoingOperation = ContactOperationBase &
  Readonly<{ type: "OUT"; recipients: readonly string[] }>;

/**
 * A crypto send/receive reduced to what contact matching needs, keeping the platform layer free of
 * `@ledgerhq/types-live`. `type` mirrors the ledger `OperationType`; only `IN` and `OUT` carry a
 * counterparty a contact can be matched on. Field names match `Operation.senders` / `recipients`.
 */
export type ContactOperation = ContactIncomingOperation | ContactOutgoingOperation;

/** `lastSentAt` is omitted when the contact was never sent to. */
export type ContactOperationsSummary = Readonly<{
  lastSentAt?: number;
  txCount: number;
}>;

export type ContactOperationsSummaries = Readonly<Record<ContactId, ContactOperationsSummary>>;
