import BigNumber from "bignumber.js";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { SuiAccount, Transaction } from "../types";

describe("buildOptimisticOperation", () => {
  it("should build optimistic operation for transfer", () => {
    // GIVEN
    const account: SuiAccount = createFixtureAccount();
    const transaction: Transaction = createFixtureTransaction();
    const fee = new BigNumber(10);

    // WHEN
    const result = buildOptimisticOperation(account, transaction, fee);

    // THEN
    expect(result).toEqual({
      id: "js:2:sui:0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0:sui--OUT-0",
      hash: "",
      type: "OUT",
      value: transaction.amount.plus(fee), // amount + fee
      fee: new BigNumber(10),
      senders: ["0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0"],
      recipients: ["0x65449f57946938c84c512732f1d69405d1fce417d9c9894696ddf4522f479e24"],
      accountId: "js:2:sui:0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0:sui",
      date: expect.any(Date),
      blockHash: null,
      blockHeight: null,
      extra: {
        transferAmount: new BigNumber(3000000000),
      },
    });
  });

  it("should calculate correct value for OUT type", () => {
    // GIVEN
    const account: SuiAccount = createFixtureAccount();
    const transaction: Transaction = createFixtureTransaction();
    const amount = new BigNumber(500);
    const fee = new BigNumber(50);
    const tx = {
      ...transaction,
      amount,
    };

    // WHEN
    const result = buildOptimisticOperation(account, tx, fee);

    // THEN
    expect(result.value).toEqual(amount.plus(fee));
    expect(result.fee).toEqual(fee);
  });
});
