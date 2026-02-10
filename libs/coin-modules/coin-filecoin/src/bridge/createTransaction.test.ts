import { createTransaction } from "./createTransaction";
import BigNumber from "bignumber.js";

describe("createTransaction", () => {
  it("should create a default transaction with correct initial values", () => {
    const tx = createTransaction();

    expect(tx.family).toBe("filecoin");
    expect(tx.amount).toEqual(new BigNumber(0));
    expect(tx.method).toBe(0);
    expect(tx.version).toBe(0);
    expect(tx.nonce).toBe(0);
    expect(tx.gasLimit).toEqual(new BigNumber(0));
    expect(tx.gasFeeCap).toEqual(new BigNumber(0));
    expect(tx.gasPremium).toEqual(new BigNumber(0));
    expect(tx.recipient).toBe("");
    expect(tx.useAllAmount).toBe(false);
  });

  it("should create independent transactions", () => {
    const tx1 = createTransaction();
    const tx2 = createTransaction();

    tx1.amount = new BigNumber(100);
    tx1.recipient = "f1test";

    expect(tx2.amount).toEqual(new BigNumber(0));
    expect(tx2.recipient).toBe("");
  });
});
