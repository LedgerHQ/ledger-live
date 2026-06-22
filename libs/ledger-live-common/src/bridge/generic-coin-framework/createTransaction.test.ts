import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { createTransaction } from "./createTransaction";

describe("createTransaction", () => {
  it("returns the Cardano default transaction with a zero nonce", () => {
    const account = {
      type: "Account",
      currency: getCryptoCurrencyById("cardano"),
    } as unknown as Account;

    expect(createTransaction(account)).toEqual({
      family: "cardano",
      amount: new BigNumber(0),
      recipient: "",
      fees: null,
      useAllAmount: false,
      mode: "send",
      nonce: new BigNumber(0),
    });
  });
});
