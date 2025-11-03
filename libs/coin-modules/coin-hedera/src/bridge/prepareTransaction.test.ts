import BigNumber from "bignumber.js";
import { estimateFees } from "../logic/estimateFees";
import { prepareTransaction } from "./prepareTransaction";
import { getMockedAccount } from "../test/fixtures/account.fixture";
import { getMockedTransaction } from "../test/fixtures/transaction.fixture";
import * as utils from "./utils";
import type { EstimateFeesResult } from "../types";

jest.mock("../logic/estimateFees");

describe("prepareTransaction", () => {
  const mockAccount = getMockedAccount();
  const mockTx = getMockedTransaction();
  const mockFeeEstimation: EstimateFeesResult = { tinybars: new BigNumber(10) };

  beforeEach(() => {
    jest.clearAllMocks();

    (estimateFees as jest.Mock).mockResolvedValue(mockFeeEstimation);
    jest
      .spyOn(utils, "calculateAmount")
      .mockResolvedValue(
        Promise.resolve({ amount: new BigNumber(100), totalSpent: new BigNumber(100) }),
      );
  });

  test("should set amount and maxFee from utils", async () => {
    const result = await prepareTransaction(mockAccount, mockTx);
    expect(result.amount).toStrictEqual(new BigNumber(100));
    expect(result.maxFee).toStrictEqual(new BigNumber(10));
  });
});
