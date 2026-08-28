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

/** `lastSentAt` is omitted when the contact was never sent to. */
export type ContactOperationsSummary = Readonly<{
  lastSentAt?: number;
  txCount: number;
}>;

export type ContactOperationsSummaries = Readonly<Record<ContactId, ContactOperationsSummary>>;
