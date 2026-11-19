import BigNumber from "bignumber.js";
import { DEFAULT_COIN_TYPE } from "../network/sdk";
import { createFixtureAccount } from "../types/bridge.fixture";
import { createTransaction } from "./createTransaction";

describe("createTransaction", () => {
  it("returns an empty send transaction with the native coin type", () => {
    expect(createTransaction(createFixtureAccount())).toEqual({
      family: "sui",
      mode: "send",
      coinType: DEFAULT_COIN_TYPE,
      amount: new BigNumber(0),
      recipient: "",
      useAllAmount: false,
      fees: null,
      gasBudget: null,
      errors: {},
    });
  });

  it("returns a new transaction object on each call", () => {
    const first = createTransaction(createFixtureAccount());
    const second = createTransaction(createFixtureAccount());

    expect(first).not.toBe(second);
    expect(first.amount).not.toBe(second.amount);
  });
});
