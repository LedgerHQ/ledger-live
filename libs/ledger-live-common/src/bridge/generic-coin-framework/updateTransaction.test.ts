import BigNumber from "bignumber.js";
import { updateTransaction } from "./updateTransaction";
import type { GenericTransaction } from "./types";

const transaction = (family: string, recipient = ""): GenericTransaction => ({
  family,
  amount: new BigNumber(0),
  recipient,
  useAllAmount: false,
});

describe("updateTransaction", () => {
  it("lowercases a mixed-case bc1 recipient of a bitcoin transaction", () => {
    const updated = updateTransaction(transaction("bitcoin"), { recipient: "BC1QTEST" });

    expect(updated.recipient).toBe("bc1qtest");
  });

  it("keeps the same reference when nothing changes", () => {
    const tx = transaction("bitcoin", "bc1qtest");

    expect(updateTransaction(tx, { recipient: "bc1qtest" })).toBe(tx);
  });

  it("returns the patched transaction as is when its bc1 recipient is already lowercase", () => {
    const tx = transaction("bitcoin");
    const updated = updateTransaction(tx, { recipient: "bc1qtest" });

    expect(updated).not.toBe(tx);
    expect(updated.recipient).toBe("bc1qtest");
  });

  it("leaves a bitcoin recipient that is not a bc1 address untouched", () => {
    const updated = updateTransaction(transaction("bitcoin"), {
      recipient: "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
    });

    expect(updated.recipient).toBe("1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2");
  });

  it("leaves the recipient of another family untouched", () => {
    const updated = updateTransaction(transaction("evm"), { recipient: "BC1QTEST" });

    expect(updated.recipient).toBe("BC1QTEST");
  });
});
