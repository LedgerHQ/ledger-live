import { estimateFee, fetchAccountInfo } from "../../bridge/bridgeHelpers/api";
import estimateMaxSpendable from "../../estimateMaxSpendable";
import {
  account,
  accountInfo,
  fees,
  jettonTransaction,
  tokenAccount,
  totalFees,
  transaction,
} from "../fixtures/common.fixtures";

jest.mock("../../bridge/bridgeHelpers/api");

describe("estimateMaxSpendable", () => {
  beforeAll(() => {
    const fetchAccountInfoMock = jest.mocked(fetchAccountInfo);
    fetchAccountInfoMock.mockReturnValue(Promise.resolve(accountInfo));
    const fetchEstimateFeeMock = jest.mocked(estimateFee);
    fetchEstimateFeeMock.mockReturnValue(Promise.resolve(fees));
  });

  it("should return the max spendable for a TON transaction", async () => {
    const res = await estimateMaxSpendable({ account, transaction });
    expect(res).toEqual(account.balance.minus(totalFees));
  });

  it("should return the max spendable for a jetton transfer", async () => {
    const res = await estimateMaxSpendable({
      account: tokenAccount,
      parentAccount: account,
      transaction: jettonTransaction,
    });
    expect(res).toEqual(tokenAccount.spendableBalance);
  });
});
