import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
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

  it("returns the Tron default native send transaction", () => {
    const account = {
      type: "Account",
      currency: getCryptoCurrencyById("tron"),
    } as unknown as Account;

    expect(createTransaction(account)).toEqual({
      family: "tron",
      amount: new BigNumber(0),
      recipient: "",
      fees: null,
      useAllAmount: false,
      mode: "send",
    });
  });
});
