import BigNumber from "bignumber.js";
import type { HederaOperation } from "../../types";

export const getMockedOperation = (overrides?: Partial<HederaOperation>): HederaOperation => {
  return {
    id: "",
    hash: "",
    type: "IN",
    value: new BigNumber(0),
    fee: new BigNumber(0),
    senders: [],
    recipients: [],
    blockHeight: undefined,
    blockHash: undefined,
    accountId: "",
    date: new Date(),
    extra: {},
    ...overrides,
  };
};
