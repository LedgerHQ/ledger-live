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

  it("should remove older transactions based on block height", () => {
    const tx1: BtcOperation = {
      ...baseTx,
      id: "op1",
      hash: "tx1",
      blockHeight: 100,
      date: new Date("2024-01-01"),
      extra: { inputs: ["input1"] },
    };

    const tx2: BtcOperation = {
      ...baseTx,
      id: "op2",
      hash: "tx2",
      blockHeight: 105, // Newer block height
      date: new Date("2024-01-02"),
      extra: { inputs: ["input1"] },
    };

    const result = removeReplaced([tx1, tx2]);
    expect(result).toEqual([tx2]); // tx1 should be removed
  });

  it("should remove older transactions based on timestamp when block height is unavailable", () => {
    const tx1: BtcOperation = {
      ...baseTx,
      id: "op1",
      hash: "tx1",
      blockHeight: null,
      date: new Date("2024-01-01"),
      extra: { inputs: ["input1"] },
    };

    const tx2: BtcOperation = {
      ...baseTx,
      id: "op2",
      hash: "tx2",
      blockHeight: null,
      date: new Date("2024-01-02"), // Newer timestamp
      extra: { inputs: ["input1"] },
    };

    const result = removeReplaced([tx1, tx2]);
    expect(result).toEqual([tx2]); // tx1 should be removed
  });

  it("should not remove transactions if block height and date are the same", () => {
    const tx1: BtcOperation = {
      ...baseTx,
      id: "op1",
      hash: "tx1",
      blockHeight: 100,
      date: new Date("2024-01-01"),
      extra: { inputs: ["input1"] },
    };

    const tx2: BtcOperation = {
      ...baseTx,
      id: "op2",
      hash: "tx2",
      blockHeight: 100, // Same block height
      date: new Date("2024-01-01"), // Same date
      extra: { inputs: ["input1"] },
    };

    const result = removeReplaced([tx1, tx2]);
    expect(result).toEqual([tx1, tx2]); // Both should remain
  });

  it("should ignore coinbase transactions", () => {
    const coinbaseTx: BtcOperation = {
      ...baseTx,
      id: "coinbase",
      hash: "coinbase",
      blockHeight: 100,
      date: new Date("2024-01-01"),
      extra: { inputs: ["0000000000000000000000000000000000000000000000000000000000000000"] }, // Coinbase input
    };

    const tx1: BtcOperation = {
      ...baseTx,
      id: "op1",
      hash: "tx1",
      blockHeight: 100,
      date: new Date("2024-01-01"),
      extra: { inputs: ["input1"] },
    };

    const result = removeReplaced([coinbaseTx, tx1]);
    expect(result).toEqual([coinbaseTx, tx1]); // Coinbase transaction should not be replaced
  });

  it("should keep transactions without inputs", () => {
    const tx1: BtcOperation = {
      ...baseTx,
      id: "op1",
      hash: "tx1",
      blockHeight: 100,
      date: new Date("2024-01-01"),
      extra: {}, // No inputs
    };

    const tx2: BtcOperation = {
      ...baseTx,
      id: "op2",
      hash: "tx2",
      blockHeight: 105,
      date: new Date("2024-01-02"),
      extra: { inputs: ["input1"] },
    };

    const result = removeReplaced([tx1, tx2]);
    expect(result).toEqual([tx1, tx2]); // tx1 should remain since it has no inputs
  });
});
