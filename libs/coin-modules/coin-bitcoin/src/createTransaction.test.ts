import BigNumber from "bignumber.js";
import { createFixtureAccount } from "./fixtures/common.fixtures";
import createTransactionDefault, { createTransaction } from "./createTransaction";
import { updateTransaction } from "./updateTransaction";

describe("createTransaction", () => {
  const account = createFixtureAccount();

  it("creates an empty transaction with the medium fees strategy and no fee loaded", () => {
    expect(createTransaction(account)).toEqual({
      family: "bitcoin",
      amount: new BigNumber(0),
      utxoStrategy: { strategy: 0, excludeUTXOs: [] },
      recipient: "",
      rbf: false,
      feePerByte: null,
      networkInfo: null,
      useAllAmount: false,
      feesStrategy: "medium",
    });
  });

  it("is the default export", () => {
    expect(createTransactionDefault).toBe(createTransaction);
  });

  it("creates a new transaction on every call", () => {
    expect(createTransaction(account)).not.toBe(createTransaction(account));
  });

  it("keeps the other fields when the recipient is updated", () => {
    const updated = updateTransaction(createTransaction(account), {
      recipient: "BC1QQMXQDRKXGX6SWRVJL9L2E6SZVVKG45ALL5U4FL",
    });

    expect(updated).toEqual({
      ...createTransaction(account),
      recipient: "bc1qqmxqdrkxgx6swrvjl9l2e6szvvkg45all5u4fl",
    });
  });

  it("returns the same transaction when an update is applied twice with no patch", () => {
    const updated = updateTransaction(createTransaction(account), {});

    expect(updateTransaction(updated, {})).toBe(updated);
  });

  it("returns the same transaction when the same patch is applied twice", () => {
    const patch = { amount: new BigNumber(1000), recipient: account.freshAddress };
    const updated = updateTransaction(createTransaction(account), patch);

    expect(updateTransaction(updated, patch)).toBe(updated);
  });
});
