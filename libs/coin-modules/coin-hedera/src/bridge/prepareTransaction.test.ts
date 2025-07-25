import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import * as utils from "./utils";
import { prepareTransaction } from "./prepareTransaction";
import { Transaction } from "../types";

describe("prepareTransaction", () => {
  const mockAccount = {
    id: "hedera:0:testAccount",
    freshAddress: "0.0.123",
    spendableBalance: new BigNumber(1000000),
    currency: { id: "hedera" },
  } as Account;

  const mockTx = {
    family: "hedera",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
  } as Transaction;

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(utils, "getEstimatedFees").mockResolvedValue(Promise.resolve(new BigNumber(10)));
    jest
      .spyOn(utils, "calculateAmount")
      .mockResolvedValue(
        Promise.resolve({ amount: new BigNumber(100), totalSpent: new BigNumber(100) }),
      );
  });

  test("should set amount and maxFee from utils", async () => {
    const result = await prepareTransaction(mockAccount, mockTx);
    expect(result.amount.isEqualTo(new BigNumber(100))).toBe(true);
    expect(result.maxFee?.isEqualTo(new BigNumber(10))).toBe(true);
  });
});
