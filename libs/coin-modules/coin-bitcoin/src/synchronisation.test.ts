import { removeReplaced } from "./synchronisation"; // Adjust path as needed
import { BtcOperation } from "./types";
import BigNumber from "bignumber.js";

describe("removeReplaced", () => {
  const baseTx: Omit<BtcOperation, "hash" | "id" | "blockHeight" | "date" | "extra"> = {
    accountId: "test-account",
    type: "OUT",
    fee: new BigNumber(1000),
    value: new BigNumber(50000),
    senders: ["sender1"],
    recipients: ["recipient1"],
    blockHash: null,
    hasFailed: false,
  };

  it("should keep confirmed transactions and remove unconfirmed replacements", () => {
    const confirmedTx: BtcOperation = {
      ...baseTx,
      id: "confirmed1",
      hash: "tx1",
      blockHeight: 100, // Confirmed transaction
      date: new Date("2024-01-01"),
      extra: { inputs: ["input1"] },
    };

    const unconfirmedTx: BtcOperation = {
      ...baseTx,
      id: "unconfirmed1",
      hash: "tx2",
      blockHeight: null, // Unconfirmed
      date: new Date("2024-01-02"),
      extra: { inputs: ["input1"] },
    };

    const result = removeReplaced([confirmedTx, unconfirmedTx]);
    expect(result).toEqual([confirmedTx]); // Unconfirmed tx should be removed
  });

  it("should replace an unconfirmed transaction with a newer unconfirmed transaction", () => {
    const oldUnconfirmedTx: BtcOperation = {
      ...baseTx,
      id: "oldUnconfirmed",
      hash: "tx1",
      blockHeight: null,
      date: new Date("2024-01-01"),
      extra: { inputs: ["input1"] },
    };

    const newUnconfirmedTx: BtcOperation = {
      ...baseTx,
      id: "newUnconfirmed",
      hash: "tx2",
      blockHeight: null,
      date: new Date("2024-01-02"), // Newer date
      extra: { inputs: ["input1"] },
    };

    const result = removeReplaced([oldUnconfirmedTx, newUnconfirmedTx]);
    expect(result).toEqual([newUnconfirmedTx]); // Older unconfirmed tx should be removed
  });

  it("should replace transactions based on block height", () => {
    const lowerHeightTx: BtcOperation = {
      ...baseTx,
      id: "lowHeight",
      hash: "tx1",
      blockHeight: 90, // Lower height
      date: new Date("2024-01-01"),
      extra: { inputs: ["input1"] },
    };

    const higherHeightTx: BtcOperation = {
      ...baseTx,
      id: "highHeight",
      hash: "tx2",
      blockHeight: 100, // Higher block height
      date: new Date("2024-01-02"),
      extra: { inputs: ["input1"] },
    };

    const result = removeReplaced([lowerHeightTx, higherHeightTx]);
    expect(result).toEqual([higherHeightTx]); // Lower height tx should be removed
  });

  it("should keep transactions without inputs", () => {
    const txWithoutInputs: BtcOperation = {
      ...baseTx,
      id: "tx1",
      hash: "tx1",
      blockHeight: 100,
      date: new Date("2024-01-01"),
      extra: {}, // No inputs
    };

    const txWithInputs: BtcOperation = {
      ...baseTx,
      id: "tx2",
      hash: "tx2",
      blockHeight: 105,
      date: new Date("2024-01-02"),
      extra: { inputs: ["input1"] },
    };

    const result = removeReplaced([txWithoutInputs, txWithInputs]);
    expect(result).toEqual([txWithoutInputs, txWithInputs]); // Both should remain
  });

  it("should handle multiple inputs correctly", () => {
    const tx1: BtcOperation = {
      ...baseTx,
      id: "tx1",
      hash: "tx1",
      blockHeight: null,
      date: new Date("2024-01-01"),
      extra: { inputs: ["input1", "input2"] },
    };

    const tx2: BtcOperation = {
      ...baseTx,
      id: "tx2",
      hash: "tx2",
      blockHeight: null,
      date: new Date("2024-01-02"),
      extra: { inputs: ["input1", "input2"] },
    };

    const result = removeReplaced([tx1, tx2]);
    expect(result).toEqual([tx2]); // tx1 should be removed because tx2 is newer
  });

  it("should keep multiple unrelated transactions", () => {
    const tx1: BtcOperation = {
      ...baseTx,
      id: "tx1",
      hash: "tx1",
      blockHeight: 100,
      date: new Date("2024-01-01"),
      extra: { inputs: ["input1"] },
    };

    const tx2: BtcOperation = {
      ...baseTx,
      id: "tx2",
      hash: "tx2",
      blockHeight: 105,
      date: new Date("2024-01-02"),
      extra: { inputs: ["input2"] },
    };

    const result = removeReplaced([tx1, tx2]);
    expect(result).toEqual([tx1, tx2]); // Both should remain since they have different inputs
  });
});
