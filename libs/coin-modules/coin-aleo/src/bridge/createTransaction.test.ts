import BigNumber from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { createTransaction } from "./createTransaction";

describe("createTransaction", () => {
  it("should create a transaction with aleo family", () => {
    const tx = createTransaction({} as AccountLike<Account>);

    expect(tx).toMatchObject({
      family: "aleo",
      amount: new BigNumber(0),
      useAllAmount: false,
      recipient: "",
      fees: new BigNumber(0),
    });
  });
});
