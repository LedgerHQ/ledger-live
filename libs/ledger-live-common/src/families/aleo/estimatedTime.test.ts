import BigNumber from "bignumber.js";
import { SINGLE_CALL_SIGNING_TIME, TRANSACTION_TYPE } from "./constants";
import { getEstimatedSendTimeMs } from "./estimatedTime";
import type { Transaction } from "./types";

const baseTransaction = {
  family: "aleo",
  amount: new BigNumber(0),
  recipient: "",
  fees: new BigNumber(0),
} as const;

const privateTransaction = (amountRecords: number, hasFeeRecord: boolean) =>
  ({
    ...baseTransaction,
    mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
    properties: {
      amountRecordCommitments: Array.from({ length: amountRecords }, (_, i) => `record-${i}`),
      feeRecordCommitment: hasFeeRecord ? "fee-record" : null,
    },
  }) as Transaction;

describe("getEstimatedSendTimeMs", () => {
  it("counts a single signing call for a public send", () => {
    const transaction = {
      ...baseTransaction,
      mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
    } as Transaction;

    expect(getEstimatedSendTimeMs(transaction)).toBe(SINGLE_CALL_SIGNING_TIME);
  });

  it("counts one signing call per amount record plus the fee record for a private send", () => {
    expect(getEstimatedSendTimeMs(privateTransaction(3, true))).toBe(4 * SINGLE_CALL_SIGNING_TIME);
  });

  it("counts at least one signing call before any record is selected", () => {
    expect(getEstimatedSendTimeMs(privateTransaction(0, false))).toBe(SINGLE_CALL_SIGNING_TIME);
  });
});
