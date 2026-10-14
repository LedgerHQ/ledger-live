import BigNumber from "bignumber.js";
import type { HederaGenericTransaction } from "@ledgerhq/live-common/families/hedera/types";

export const HEDERA_RECIPIENT_ADDRESS = "0.0.9876543";

export const makeHederaTransaction = (
  overrides?: Partial<HederaGenericTransaction>,
): HederaGenericTransaction => ({
  family: "hedera",
  mode: "send",
  amount: new BigNumber(1_000_000),
  recipient: HEDERA_RECIPIENT_ADDRESS,
  useAllAmount: false,
  ...overrides,
});
