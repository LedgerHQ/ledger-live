import { Account, AccountLike } from "@ledgerhq/types-live";
import { AnchorMode } from "@stacks/transactions";
import { createTransaction } from "./createTransaction";

describe("createTransaction", () => {
  it("should create a 0 amount transaction", () => {
    expect(createTransaction({} as AccountLike<Account>).amount.toNumber()).toEqual(0);
  });

  it("should create a transaction with stacks family", () => {
    expect(createTransaction({} as AccountLike<Account>).family).toEqual("stacks");
  });

  it("should create a transaction with empty recipient", () => {
    expect(createTransaction({} as AccountLike<Account>).recipient).toEqual("");
  });

  it("should create a transaction with mainnet network", () => {
    expect(createTransaction({} as AccountLike<Account>).network).toEqual("mainnet");
  });

  it("should create a transaction with AnchorMode.Any", () => {
    expect(createTransaction({} as AccountLike<Account>).anchorMode).toEqual(AnchorMode.Any);
  });

  it("should create a transaction with useAllAmount set to false", () => {
    expect(createTransaction({} as AccountLike<Account>).useAllAmount).toEqual(false);
  });
});
