import { Account, AccountLike } from "@ledgerhq/types-live";
import { createTransaction } from "./createTransaction";

describe("createTransaction", () => {
  it("should create a 0 amount transaction", () => {
    expect(createTransaction({} as AccountLike<Account>).amount.toNumber()).toEqual(0);
  });

  it("should create a transaction with boilerplate family", () => {
    expect(createTransaction({} as AccountLike<Account>).family).toEqual("boilerplate");
  });
});
