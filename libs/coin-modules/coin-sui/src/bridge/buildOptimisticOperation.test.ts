import BigNumber from "bignumber.js";
import { SuiAccount, Transaction } from "../types";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import { buildOptimisticOperation } from "./buildOptimisticOperation";

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
      id: "js:2:sui:0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0:sui--OUT",
      hash: "",
      type: "OUT",
      value: transaction.amount.plus(fee), // amount + fee
      fee: new BigNumber(10),
      senders: ["0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0"],
      recipients: ["0x65449f57946938c84c512732f1d69405d1fce417d9c9894696ddf4522f479e24"],
      accountId: "js:2:sui:0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0:sui",
      date: expect.any(Date),
      transactionSequenceNumber: expect.any(BigNumber),
      blockHash: null,
      blockHeight: null,
      extra: {
        transferAmount: new BigNumber(3000000000),
      },
    });
    expect(result.transactionSequenceNumber).toBeInstanceOf(BigNumber);
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

  it("should generate unique transactionSequenceNumber for multiple pending operations", async () => {
    // GIVEN
    const account: SuiAccount = createFixtureAccount();
    const transaction: Transaction = createFixtureTransaction();
    const fee = new BigNumber(10);

    // WHEN
    const result1 = buildOptimisticOperation(account, transaction, fee);
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 5));
    const result2 = buildOptimisticOperation(account, transaction, fee);

    // THEN
    expect(result1.transactionSequenceNumber).toBeInstanceOf(BigNumber);
    expect(result2.transactionSequenceNumber).toBeInstanceOf(BigNumber);
    expect(result1.transactionSequenceNumber).not.toStrictEqual(result2.transactionSequenceNumber);
  });
});
