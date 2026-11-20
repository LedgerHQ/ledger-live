import { createTransaction } from "./createTransaction";

describe("createTransaction", () => {
  it("creates an empty kaspa send with the fast fee strategy", () => {
    const transaction = createTransaction();

    expect({
      family: transaction.family,
      recipient: transaction.recipient,
      amount: transaction.amount.toString(),
      useAllAmount: transaction.useAllAmount,
      feesStrategy: transaction.feesStrategy,
      networkInfo: transaction.networkInfo,
    }).toEqual({
      family: "kaspa",
      recipient: "",
      amount: "0",
      useAllAmount: false,
      feesStrategy: "fast",
      networkInfo: [],
    });
  });
});
