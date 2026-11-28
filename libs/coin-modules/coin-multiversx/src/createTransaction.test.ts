import { createTransaction } from "./createTransaction";
import { buildAccount } from "./test/fixtures";

describe("createTransaction", () => {
  it("creates an empty send with the minimum gas limit and default fees", () => {
    const transaction = createTransaction(buildAccount());

    expect({
      family: transaction.family,
      mode: transaction.mode,
      recipient: transaction.recipient,
      amount: transaction.amount.toString(),
      useAllAmount: transaction.useAllAmount,
      fees: transaction.fees?.toString(),
      gasLimit: transaction.gasLimit,
    }).toEqual({
      family: "multiversx",
      mode: "send",
      recipient: "",
      amount: "0",
      useAllAmount: false,
      fees: "50000",
      gasLimit: 50000,
    });
  });
});
