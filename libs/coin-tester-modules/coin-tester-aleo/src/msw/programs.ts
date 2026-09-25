import { PROGRAM_ID } from "@ledgerhq/coin-aleo/constants";
import {
  TOKEN_PROGRAM_ID,
  TRANSFER_PRIVATE_BASE_FEE,
  TRANSFER_TOKEN_PUBLIC_BASE_FEE,
} from "../fixtures";

/**
 * Marks a transition whose future carries no sender at all: the caller is
 * private, so the finalize scope never sees an address to name it by.
 * `credits.aleo/transfer_private_to_public` runs
 * `async transfer_private_to_public r1 r2`, a future of `[receiver, amount]`.
 * The transition is still indexable — the indexer emits it with an empty
 * `sender_address`, which is what a real indexer publishes for it.
 */
export const SENDER_ABSENT_FROM_FUTURE = "absent-from-future";

export type IndexedFunction = {
  /**
   * Position of the sender in the transition's future arguments. Absent for a
   * transition that emits no future — a fully private call chain carries no
   * finalize scope, so it has no future to index, and scanIndexedTransfers
   * must skip it rather than read a sender out of nothing.
   * `SENDER_ABSENT_FROM_FUTURE` is the third case: a future exists and the
   * transition is indexable, but it names no sender.
   */
  senderArgIndex?: number | typeof SENDER_ABSENT_FROM_FUTURE;
  recipientInputIndex: number;
  amountInputIndex: number;
  amountSuffix: "u64" | "u128";
  baseFee: number;
};

/**
 * Argument order differs per program — invisible to a reader who only knows
 * credits.aleo. `credits.aleo/transfer_public`'s future is
 * `[self.caller, r0, r1]` (sender first); the stablecoin's is
 * `[r0, r1, self.caller]` (sender last). Reading argument 0 unconditionally
 * would read the stablecoin's *recipient* as its sender with no error at all.
 *
 * `mint_public` never reaches msw/prove.ts (it is signed and broadcast
 * directly by bootstrapToken.ts, bypassing the bridge), so its `baseFee`
 * stays unused — the price of holding one table instead of two.
 */
export const INDEXED_PROGRAMS: Record<string, Record<string, IndexedFunction>> = {
  [PROGRAM_ID.CREDITS]: {
    transfer_public: {
      senderArgIndex: 0,
      recipientInputIndex: 0,
      amountInputIndex: 1,
      amountSuffix: "u64",
      baseFee: 34060,
    },
    transfer_public_to_private: {
      senderArgIndex: 0,
      recipientInputIndex: 0,
      amountInputIndex: 1,
      amountSuffix: "u64",
      baseFee: 17972,
    },
    // Inputs are `[credits.record, address.public, u64.public]`: the spent
    // record first, then the receiver and the amount the future forwards.
    transfer_private_to_public: {
      senderArgIndex: SENDER_ABSENT_FROM_FUTURE,
      recipientInputIndex: 1,
      amountInputIndex: 2,
      amountSuffix: "u64",
      baseFee: 18494,
    },
  },
  [TOKEN_PROGRAM_ID]: {
    transfer_public: {
      senderArgIndex: 2,
      recipientInputIndex: 0,
      amountInputIndex: 1,
      amountSuffix: "u128",
      baseFee: TRANSFER_TOKEN_PUBLIC_BASE_FEE,
    },
    mint_public: {
      senderArgIndex: 2,
      recipientInputIndex: 0,
      amountInputIndex: 1,
      amountSuffix: "u128",
      baseFee: 0,
    },
  },
  "ldg_p_1114.aleo": {
    /**
     * A fully private call chain — 13 joins and one transfer_private, no
     * async/finalize block anywhere in the program. It emits no future, so it
     * carries no `senderArgIndex`; scanIndexedTransfers skips it for that
     * reason, the same way credits.aleo/transfer_private carries no entry of
     * its own.
     */
    transfer_private_14: {
      recipientInputIndex: 14,
      amountInputIndex: 15,
      amountSuffix: "u64",
      baseFee: TRANSFER_PRIVATE_BASE_FEE,
    },
  },
};
