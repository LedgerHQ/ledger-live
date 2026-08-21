import BigNumber from "bignumber.js";
import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/live-common/families/hedera/constants";
import type { Transaction } from "@ledgerhq/live-common/families/hedera/types";

export const HEDERA_RECIPIENT_ADDRESS = "0.0.9876543";

// `memoType`/`memoValue` aren't on the legacy `Transaction` type this fixture returns (cast at the
// end below), but are the real fields the generic transaction the send flow carries at runtime uses.
type HederaTransactionOverrides = Partial<Transaction> & { memoType?: string; memoValue?: string };

export const makeHederaTransaction = (overrides?: HederaTransactionOverrides): Transaction =>
  ({
    family: "hedera",
    mode: HEDERA_TRANSACTION_MODES.Send,
    amount: new BigNumber(1_000_000),
    recipient: HEDERA_RECIPIENT_ADDRESS,
    useAllAmount: false,
    ...overrides,
  }) as Transaction;
