import BigNumber from "bignumber.js";
import type { AleoOperation } from "../../types";

export function getMockedOperation(overrides?: Partial<AleoOperation>): AleoOperation {
  return {
    id: "js:2:aleo:aleo1test:op1-OUT",
    hash: "at1mockhashmockhashmockhashmockhash",
    type: "OUT",
    value: new BigNumber(100000000),
    fee: new BigNumber(1000000),
    blockHeight: 1000000,
    blockHash: "ab1mockblockhash",
    accountId: "js:2:aleo:aleo1test:",
    senders: ["aleo1test"],
    recipients: ["aleo1receiver"],
    date: new Date("2024-01-01T00:00:00.000Z"),
    transactionSequenceNumber: new BigNumber(0),
    hasFailed: false,
    extra: {
      functionId: "transfer_public",
      transactionType: "public",
    },
    ...overrides,
  };
}
