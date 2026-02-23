import BigNumber from "bignumber.js";
import { getMockedAccount } from "../__tests__/fixtures/account.fixture";
import { TRANSACTION_TYPE } from "../constants";
import { createTransaction } from "./createTransaction";

describe("createTransaction", () => {
  const mockAccount = getMockedAccount();

  it("should create a transaction with aleo family", () => {
    const tx = createTransaction(mockAccount);

    expect(tx).toMatchObject({
      family: "aleo",
      amount: new BigNumber(0),
      useAllAmount: false,
      recipient: "",
      fees: new BigNumber(0),
      type: TRANSACTION_TYPE.TRANSFER_PUBLIC,
    });
  });
});
