import BigNumber from "bignumber.js";
import { createTestTransaction, getEmptyAccount, ICP_CURRENCY_MOCK } from "../test/__fixtures__";
import { ICPAccount } from "../types";
import { getEstimatedFees } from "./bridgeHelpers/fee";
import { estimateMaxSpendable } from "./estimateMaxSpendable";

describe("estimateMaxSpendable", () => {
  let account: ICPAccount;

  beforeEach(() => {
    account = getEmptyAccount(ICP_CURRENCY_MOCK);
  });

  it("should return the balance minus transaction fees", async () => {
    account.balance = new BigNumber(100000000);
    const transaction = createTestTransaction({ fees: new BigNumber(10000) });

    const maxSpendable = await estimateMaxSpendable({ account, transaction });

    expect(maxSpendable).toEqual(new BigNumber(99990000));
  });

  it("should return the balance minus estimated fees if transaction has no fees", async () => {
    account.balance = new BigNumber(100000000);
    const transaction = createTestTransaction({ fees: undefined });

    const maxSpendable = await estimateMaxSpendable({ account, transaction });
    const estimatedFees = getEstimatedFees();

    expect(maxSpendable).toEqual(account.balance.minus(estimatedFees));
  });

  it("should return 0 if the balance is less than the fees", async () => {
    account.balance = new BigNumber(5000);
    const transaction = createTestTransaction({ fees: new BigNumber(10000) });

    const maxSpendable = await estimateMaxSpendable({ account, transaction });

    expect(maxSpendable).toEqual(new BigNumber(0));
  });

  it("should return 0 if the balance is equal to the fees", async () => {
    account.balance = new BigNumber(10000);
    const transaction = createTestTransaction({ fees: new BigNumber(10000) });

    const maxSpendable = await estimateMaxSpendable({ account, transaction });

    expect(maxSpendable).toEqual(new BigNumber(0));
  });

  it("should use estimated fees when transaction is not provided", async () => {
    account.balance = new BigNumber(100000000);

    const maxSpendable = await estimateMaxSpendable({ account });
    const estimatedFees = getEstimatedFees();

    expect(maxSpendable).toEqual(account.balance.minus(estimatedFees));
  });
});
