import BigNumber from "bignumber.js";
import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/live-common/families/hedera/constants";
import type { Transaction } from "@ledgerhq/live-common/families/hedera/types";

export const HEDERA_RECIPIENT_ADDRESS = "0.0.9876543";

export const makeHederaTransaction = (overrides?: Partial<Transaction>): Transaction =>
  ({
    family: "hedera",
    mode: HEDERA_TRANSACTION_MODES.Send,
    amount: new BigNumber(1_000_000),
    recipient: HEDERA_RECIPIENT_ADDRESS,
    useAllAmount: false,
    ...overrides,
  }) as Transaction;
