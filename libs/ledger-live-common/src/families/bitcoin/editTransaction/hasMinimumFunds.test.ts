import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { Transaction as BtcTransaction } from "../types";
import { getAdditionalFeeRequiredForRbf } from "./rbfValidation";
import { hasMinimumFundsToCancel, hasMinimumFundsToSpeedUp } from "./hasMinimumFunds";

jest.mock("./rbfValidation", () => ({
  getAdditionalFeeRequiredForRbf: jest.fn(),
}));

const mockedGetAdditionalFeeRequiredForRbf = getAdditionalFeeRequiredForRbf as jest.Mock;

describe("hasMinimumFunds", () => {
  const transactionToUpdate = {
    family: "bitcoin",
    familySpecificData: { replaceTxId: "orig-txid", rbf: true },
  } as BtcTransaction;

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

    it("returns true when spendableBalance equals the additional fee", async () => {
      mockedGetAdditionalFeeRequiredForRbf.mockResolvedValueOnce(new BigNumber(100));

      const mainAccount = { spendableBalance: new BigNumber(100) } as unknown as Account;

      await expect(hasMinimumFundsToCancel({ mainAccount, transactionToUpdate })).resolves.toBe(
        true,
      );
    });

    it("returns false when spendableBalance is below the additional fee", async () => {
      mockedGetAdditionalFeeRequiredForRbf.mockResolvedValueOnce(new BigNumber(101));

      const mainAccount = {
        balance: new BigNumber(1_000),
        spendableBalance: new BigNumber(100),
      } as unknown as Account;

      await expect(hasMinimumFundsToCancel({ mainAccount, transactionToUpdate })).resolves.toBe(
        false,
      );
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

    it("returns false when the funds do not cover the additional fee", async () => {
      mockedGetAdditionalFeeRequiredForRbf.mockResolvedValueOnce(new BigNumber(600));

      const mainAccount = { spendableBalance: new BigNumber(500) } as unknown as Account;

      await expect(hasMinimumFundsToSpeedUp({ mainAccount, transactionToUpdate })).resolves.toBe(
        false,
      );
    });
  });
});
