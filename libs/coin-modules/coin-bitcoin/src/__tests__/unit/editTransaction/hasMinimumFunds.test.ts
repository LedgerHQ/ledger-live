import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { Transaction as BtcTransaction } from "../../../types";
import { getAdditionalFeeRequiredForRbf } from "../../../rbfHelpers";
import {
  hasMinimumFundsToCancel,
  hasMinimumFundsToSpeedUp,
} from "../../../editTransaction/hasMinimumFunds";

jest.mock("../../../rbfHelpers", () => ({
  getAdditionalFeeRequiredForRbf: jest.fn(),
}));

const mockedGetAdditionalFeeRequiredForRbf = getAdditionalFeeRequiredForRbf as jest.Mock;

describe("hasMinimumFunds", () => {
  const transactionToUpdate = {} as BtcTransaction;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("hasMinimumFundsToCancel", () => {
    it("returns true when spendableBalance is >= additional fee", async () => {
      const additionalFee = new BigNumber(100);
      mockedGetAdditionalFeeRequiredForRbf.mockResolvedValueOnce(additionalFee);

      const mainAccount = {
        balance: new BigNumber(50),
        spendableBalance: new BigNumber(150),
      } as unknown as Account;

      const result = await hasMinimumFundsToCancel({
        mainAccount,
        transactionToUpdate,
      });

      expect(mockedGetAdditionalFeeRequiredForRbf).toHaveBeenCalledWith({
        mainAccount,
        transactionToUpdate,
      });
      expect(result).toBe(true);
    });

    it("returns false when getting additional fee fails", async () => {
      mockedGetAdditionalFeeRequiredForRbf.mockRejectedValueOnce(new Error("network error"));

      const mainAccount = {
        balance: new BigNumber(1_000),
      } as unknown as Account;

      const result = await hasMinimumFundsToCancel({
        mainAccount,
        transactionToUpdate,
      });

      expect(result).toBe(false);
    });
  });

  describe("hasMinimumFundsToSpeedUp", () => {
    it("delegates to hasMinimumFundsToCancel with same arguments", async () => {
      const additionalFee = new BigNumber(200);
      mockedGetAdditionalFeeRequiredForRbf.mockResolvedValueOnce(additionalFee);

      const mainAccount = {
        balance: new BigNumber(500),
        spendableBalance: new BigNumber(500),
      } as unknown as Account;

      const result = await hasMinimumFundsToSpeedUp({
        mainAccount,
        transactionToUpdate,
      });

      expect(mockedGetAdditionalFeeRequiredForRbf).toHaveBeenCalledWith({
        mainAccount,
        transactionToUpdate,
      });
      expect(result).toBe(true);
    });
  });
});
