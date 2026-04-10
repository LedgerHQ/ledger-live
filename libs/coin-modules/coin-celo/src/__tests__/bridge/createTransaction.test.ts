import BigNumber from "bignumber.js";
import createTransaction from "../../bridge/createTransaction";
import { accountFixture } from "../../bridge/fixtures";

describe("createTransaction", () => {
  it("returns a dummy transaction", () => {
    expect(createTransaction(accountFixture)).toMatchObject({
      family: "celo",
      amount: new BigNumber(0),
      recipient: "",
      useAllAmount: false,
      fees: null,
      mode: "send",
      index: null,
      feeCurrency: null,
      feeCurrencyUnwrapped: null,
      feeCurrencyAccountId: null,
    });
  });

  it("initializes fee currency fields as null", () => {
    const transaction = createTransaction(accountFixture);
    expect(transaction.feeCurrency).toBeNull();
    expect(transaction.feeCurrencyUnwrapped).toBeNull();
    expect(transaction.feeCurrencyAccountId).toBeNull();
  });
});
