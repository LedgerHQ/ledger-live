import { BigNumber } from "bignumber.js";
import createTransactionDefault, { createTransaction } from "./createTransaction";

describe("createTransaction", () => {
  it("creates an empty send transaction without any validator field", () => {
    const transaction = createTransaction({} as never);

    expect(transaction).toEqual({
      family: "cosmos",
      mode: "send",
      amount: new BigNumber(0),
      fees: null,
      gas: null,
      recipient: "",
      useAllAmount: false,
      networkInfo: null,
      memo: null,
    });
  });

  it("is the default export", () => {
    expect(createTransactionDefault).toBe(createTransaction);
  });
});
