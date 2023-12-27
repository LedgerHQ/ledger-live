import type { Account, AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import * as liveEnv from "@ledgerhq/live-env";
import * as logic from "../../../logic";
import type { Transaction } from "../../../types/index";
import {
  hasMinimumFundsToCancel,
  hasMinimumFundsToSpeedUp,
} from "../../../editTransaction/hasMinimumFunds";

jest.mock("@ledgerhq/live-env");
jest.mock("../../../logic");
const mockedLogic = jest.mocked(logic);
const mockedLiveEnv = jest.mocked(liveEnv);

describe("hasMinimumFunds", () => {
  describe("hasMinimumFundsToCancel", () => {
    const mainAccount: Account = {
      balance: new BigNumber(0),
    } as Account;

    afterAll(() => {
      jest.restoreAllMocks();
    });

    describe.each([
      { label: "EIP1559", type: 2, envVar: "EVM_REPLACE_TX_EIP1559_MAXFEE_FACTOR" },
      { label: "Legacy", type: 1, envVar: "EVM_REPLACE_TX_LEGACY_GASPRICE_FACTOR" },
    ])("$label", ({ type, envVar }) => {
      const transactionToUpdate: Transaction = { type } as Transaction;
      test("should return true if has enough funds", () => {
        // Mock the necessary dependencies
        jest.spyOn(liveEnv, "getEnv").mockReturnValue(new BigNumber(2) as any);
        jest.spyOn(logic, "getEstimatedFees").mockReturnValue(new BigNumber(100));
        mainAccount.balance = new BigNumber(201);

        const result = hasMinimumFundsToCancel({ mainAccount, transactionToUpdate });

        expect(result).toBe(true);
        expect(mockedLiveEnv.getEnv).toHaveBeenCalledWith(envVar);
        expect(mockedLogic.getEstimatedFees).toHaveBeenCalledWith(transactionToUpdate);
      });

      test("should return false if does not have enough funds", () => {
        // Mock the necessary dependencies
        jest.spyOn(liveEnv, "getEnv").mockReturnValue(new BigNumber(2) as any);
        jest.spyOn(logic, "getEstimatedFees").mockReturnValue(new BigNumber(100));
        mainAccount.balance = new BigNumber(200);

        const result = hasMinimumFundsToCancel({ mainAccount, transactionToUpdate });

        expect(result).toBe(false);
        expect(mockedLiveEnv.getEnv).toHaveBeenCalledWith(envVar);
        expect(mockedLogic.getEstimatedFees).toHaveBeenCalledWith(transactionToUpdate);
      });
    });
  });

  describe("hasMinimumFundsToSpeedUp", () => {
    const mainAccount: Account = {
      balance: new BigNumber(0),
    } as Account;

    afterAll(() => {
      jest.restoreAllMocks();
    });

    describe.each([
      { label: "`account` is Account type", accountType: "Account" },
      { label: "`account` is not Account type", accountType: "TokenAccount" },
    ])("$label", ({ accountType }) => {
      const account: AccountLike = {
        type: accountType,
      } as AccountLike;

      const defaultBalance = accountType === "Account" ? 300 : 200;

      describe.each([
        { label: "EIP1559", type: 2, envVar: "EVM_REPLACE_TX_EIP1559_MAXFEE_FACTOR" },
        { label: "Legacy", type: 1, envVar: "EVM_REPLACE_TX_LEGACY_GASPRICE_FACTOR" },
      ])("$label", ({ type, envVar }) => {
        const transactionToUpdate: Transaction = {
          amount: new BigNumber(100),
          type,
        } as Transaction;

        test("should return true if has enough funds", () => {
          // Mock the necessary dependencies
          jest.spyOn(liveEnv, "getEnv").mockReturnValue(new BigNumber(2) as any);
          jest.spyOn(logic, "getEstimatedFees").mockReturnValue(new BigNumber(100));
          mainAccount.balance = new BigNumber(defaultBalance + 1);

          const result = hasMinimumFundsToSpeedUp({
            account,
            mainAccount,
            transactionToUpdate,
          });

          expect(result).toBe(true);
          expect(mockedLiveEnv.getEnv).toHaveBeenCalledWith(envVar);
          expect(mockedLogic.getEstimatedFees).toHaveBeenCalledWith(transactionToUpdate);
        });

        test("should return false if does not have enough funds", () => {
          // Mock the necessary dependencies
          jest.spyOn(liveEnv, "getEnv").mockReturnValue(new BigNumber(2) as any);
          jest.spyOn(logic, "getEstimatedFees").mockReturnValue(new BigNumber(100));
          mainAccount.balance = new BigNumber(defaultBalance);

          const result = hasMinimumFundsToSpeedUp({
            account,
            mainAccount,
            transactionToUpdate,
          });

          expect(result).toBe(false);
          expect(mockedLiveEnv.getEnv).toHaveBeenCalledWith(envVar);
          expect(mockedLogic.getEstimatedFees).toHaveBeenCalledWith(transactionToUpdate);
        });
      });
    });
  });
});
