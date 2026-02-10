import { Account, AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { createTransaction } from "./createTransaction";

describe("createTransaction", () => {
  it("should create a 0 amount transaction", () => {
    expect(createTransaction({} as AccountLike<Account>).amount.toNumber()).toEqual(0);
    expect(createTransaction({} as AccountLike<Account>).recipient).toEqual("");
    expect(createTransaction({} as AccountLike<Account>).useAllAmount).toEqual(false);
    expect(createTransaction({} as AccountLike<Account>).fees).toEqual({
      fee: new BigNumber(0),
      accountCreationFee: new BigNumber(0),
    });
    expect(createTransaction({} as AccountLike<Account>).memo).toEqual(undefined);
    expect(createTransaction({} as AccountLike<Account>).nonce).toEqual(0);
  });

  it("should create a transaction with boilerplate family", () => {
    expect(createTransaction({} as AccountLike<Account>).family).toEqual("mina");
  });
});
