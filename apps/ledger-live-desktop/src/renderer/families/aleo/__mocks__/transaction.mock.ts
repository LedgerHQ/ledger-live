import BigNumber from "bignumber.js";
import type { Transaction as AleoTransaction } from "@ledgerhq/live-common/families/aleo/types";

export const makeAleoTransaction = (overrides?: Partial<AleoTransaction>): AleoTransaction =>
  ({
    family: "aleo",
    mode: "transfer_public",
    recipient: "",
    amount: new BigNumber(0),
    fees: new BigNumber(0),
    useAllAmount: false,
    ...overrides,
  }) as AleoTransaction;
