import BigNumber from "bignumber.js";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getEstimatedFees } from "./bridgeHelpers/fee";
import { ICPAccount, Transaction } from "../types";
import { getEmptyAccount, ICP_CURRENCY_MOCK } from "../test/__fixtures__";

describe("estimateMaxSpendable", () => {
  let account: ICPAccount;

  beforeEach(() => {
    account = getEmptyAccount(ICP_CURRENCY_MOCK);
  });

  it("should return the balance minus transaction fees", async () => {
    account.balance = new BigNumber(100000000);
    const transaction = {
      fees: new BigNumber(10000),
    } as Transaction;

    const maxSpendable = await estimateMaxSpendable({ account, transaction });

    expect(maxSpendable).toStrictEqual(new BigNumber(99990000));
  });

  it("should return the balance minus estimated fees if transaction has no fees", async () => {
    account.balance = new BigNumber(100000000);
    const transaction = {} as Transaction;

    const maxSpendable = await estimateMaxSpendable({ account, transaction });
    const estimatedFees = getEstimatedFees();

    expect(maxSpendable).toStrictEqual(account.balance.minus(estimatedFees));
  });

  it("should return 0 if the balance is less than the fees", async () => {
    account.balance = new BigNumber(5000);
    const transaction = {
      fees: new BigNumber(10000),
    } as Transaction;

    const maxSpendable = await estimateMaxSpendable({ account, transaction });

    expect(maxSpendable).toStrictEqual(new BigNumber(0));
  });

  it("should return 0 if the balance is equal to the fees", async () => {
    account.balance = new BigNumber(10000);
    const transaction = {
      fees: new BigNumber(10000),
    } as Transaction;

    const maxSpendable = await estimateMaxSpendable({ account, transaction });

    expect(maxSpendable).toStrictEqual(new BigNumber(0));
  });

  it("should use estimated fees when transaction is not provided", async () => {
    account.balance = new BigNumber(100000000);

    const maxSpendable = await estimateMaxSpendable({ account });
    const estimatedFees = getEstimatedFees();

    expect(maxSpendable).toStrictEqual(account.balance.minus(estimatedFees));
  });
});
