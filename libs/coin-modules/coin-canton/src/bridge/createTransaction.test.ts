/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { Account, AccountLike } from "@ledgerhq/types-live";
import { createMockCantonAccount } from "../test/fixtures";
import { createTransaction } from "./createTransaction";

describe("createTransaction", () => {
  it("should create a 0 amount transaction", () => {
    expect(
      createTransaction(createMockCantonAccount() as AccountLike<Account>).amount.toNumber(),
    ).toEqual(0);
  });

  it("should create a transaction with canton family", () => {
    expect(createTransaction(createMockCantonAccount() as AccountLike<Account>).family).toEqual(
      "canton",
    );
  });
});
