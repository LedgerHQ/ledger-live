import BigNumber from "bignumber.js";
import type { Operation as AlpacaOperation } from "@ledgerhq/coin-framework/api/index";
import type { AleoOperation } from "../../types";

export function getMockedAlpacaOperation(overrides?: Partial<AlpacaOperation>): AlpacaOperation {
  return {
    id: "at1mockhashmockhashmockhashmockhash",
    type: "OUT",
    senders: ["aleo1test"],
    recipients: ["aleo1receiver"],
    value: 100000000n,
    asset: { type: "native" },
    details: {
      functionId: "transfer_public",
      transactionType: "public",
      ledgerOpType: "OUT",
    },
    tx: {
      hash: "at1mockhashmockhashmockhashmockhash",
      fees: 1000000n,
      date: new Date("2024-01-01T00:00:00.000Z"),
      block: {
        hash: "ab1mockblockhash",
        height: 1000000,
        time: new Date("2024-01-01T00:00:00.000Z"),
      },
      failed: false,
    },
    ...overrides,
  };
}

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
