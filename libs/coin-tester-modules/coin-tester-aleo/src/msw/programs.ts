import { PROGRAM_ID } from "@ledgerhq/coin-aleo/constants";

/** The caller is private, so the future names no sender (e.g. transfer_private_to_public). */
export const SENDER_ABSENT_FROM_FUTURE = "absent-from-future";

export type IndexedFunction = {
  senderArgIndex: number | typeof SENDER_ABSENT_FROM_FUTURE;
  recipientInputIndex: number;
  amountInputIndex: number;
  amountSuffix: "u64" | "u128";
};

// transfer_private emits no future, so it is not indexed.
export const INDEXED_PROGRAMS: Record<string, Record<string, IndexedFunction>> = {
  [PROGRAM_ID.CREDITS]: {
    transfer_public: {
      senderArgIndex: 0,
      recipientInputIndex: 0,
      amountInputIndex: 1,
      amountSuffix: "u64",
    },
    transfer_public_to_private: {
      senderArgIndex: 0,
      recipientInputIndex: 0,
      amountInputIndex: 1,
      amountSuffix: "u64",
    },
    transfer_private_to_public: {
      senderArgIndex: SENDER_ABSENT_FROM_FUTURE,
      recipientInputIndex: 1,
      amountInputIndex: 2,
      amountSuffix: "u64",
    },
  },
};
