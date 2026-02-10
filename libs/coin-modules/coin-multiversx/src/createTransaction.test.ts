import BigNumber from "bignumber.js";
import { createTransaction } from "./createTransaction";
import { MIN_GAS_LIMIT } from "./constants";

describe("createTransaction", () => {
  it("creates a transaction with default values", () => {
    const tx = createTransaction({} as any);

    expect(tx).toBeDefined();
    expect(tx.family).toBe("multiversx");
  });

  it("sets default mode to 'send'", () => {
    const tx = createTransaction({} as any);

    expect(tx.mode).toBe("send");
  });

  it("sets default amount to 0", () => {
    const tx = createTransaction({} as any);

    expect(tx.amount).toEqual(new BigNumber(0));
  });

  it("sets default recipient to empty string", () => {
    const tx = createTransaction({} as any);

    expect(tx.recipient).toBe("");
  });

  it("sets default useAllAmount to false", () => {
    const tx = createTransaction({} as any);

    expect(tx.useAllAmount).toBe(false);
  });

  it("sets default fees to 50000", () => {
    const tx = createTransaction({} as any);

    expect(tx.fees).toEqual(new BigNumber(50000));
  });

  it("sets default gasLimit to MIN_GAS_LIMIT", () => {
    const tx = createTransaction({} as any);

    expect(tx.gasLimit).toBe(MIN_GAS_LIMIT);
    expect(tx.gasLimit).toBe(50000);
  });

  it("returns a new transaction object each time", () => {
    const tx1 = createTransaction({} as any);
    const tx2 = createTransaction({} as any);

    expect(tx1).not.toBe(tx2);
    expect(tx1).toEqual(tx2);
  });

  it("transaction has correct shape for MultiversX", () => {
    const tx = createTransaction({} as any);

    expect(tx).toMatchObject({
      family: "multiversx",
      mode: expect.any(String),
      amount: expect.any(BigNumber),
      recipient: expect.any(String),
      useAllAmount: expect.any(Boolean),
      fees: expect.any(BigNumber),
      gasLimit: expect.any(Number),
    });
  });
});
