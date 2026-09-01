import type { AccountId } from "@shared/schema-primitives";
import type { AccountSlice } from "./port";

/**
 * No registered source can deliver some of the requested slices for this account.
 *
 * Surfaced as a per-slice error rather than thrown at the UI: one unservable slice must not take
 * down the slices that were served.
 */
export class UnservableSlicesError extends Error {
  constructor(
    readonly accountId: AccountId,
    readonly slices: readonly AccountSlice[],
  ) {
    super(`No account data source can serve [${slices.join(", ")}] for ${accountId}`);
    this.name = "UnservableSlicesError";
  }
}

/** A source declared it supports a ref, then failed to produce a slice it declared as a capability. */
export class SourceUnderDeliveryError extends Error {
  constructor(
    readonly sourceId: string,
    readonly accountId: AccountId,
    readonly slices: readonly AccountSlice[],
  ) {
    super(
      `Source "${sourceId}" did not deliver [${slices.join(", ")}] for ${accountId} despite declaring it can`,
    );
    this.name = "SourceUnderDeliveryError";
  }
}
