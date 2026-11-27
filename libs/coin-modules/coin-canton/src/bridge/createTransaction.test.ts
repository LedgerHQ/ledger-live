import { Account, AccountLike } from "@ledgerhq/types-live";
import { createTransaction } from "./createTransaction";

describe("createTransaction", () => {
  it("should create a 0 amount transaction", () => {
    expect(createTransaction({} as AccountLike<Account>).amount.toNumber()).toEqual(0);
  });

  it("should create a transaction with canton family", () => {
    expect(createTransaction({} as AccountLike<Account>).family).toEqual("canton");
  });

  it("should create a transaction with Send max off, so the apps offer it", () => {
    expect(createTransaction({} as AccountLike<Account>).useAllAmount).toBe(false);
  });
});
