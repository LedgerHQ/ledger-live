import { getEnv } from "@ledgerhq/live-env";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getCoinConfig } from "../config";
import type { Transaction } from "../types/index";
import { getEstimatedFees } from "../utils";
import { hasMinimumFundsToCancel, hasMinimumFundsToSpeedUp } from "./hasMinimumFunds";

jest.mock("@ledgerhq/live-env", () => ({
  getEnv: jest.fn(),
}));
jest.mock("../logic");
jest.mock("../utils", () => ({
  ...jest.requireActual("../utils"),
  getEstimatedFees: jest.fn(),
}));

const mockGetEnv = getEnv as jest.Mock;
const mockGetEstimatedFees = getEstimatedFees as jest.Mock;

jest.mock("../config");
const mockGetConfig = jest.mocked(getCoinConfig);

describe("hasMinimumFunds", () => {
  beforeEach(() => {
    mockGetConfig.mockImplementation((): any => {
      return { info: {} };
    });
  });
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
        mockGetEnv.mockReturnValue(new BigNumber(2) as any);
        mockGetEstimatedFees.mockReturnValue(new BigNumber(100));
        mainAccount.balance = new BigNumber(201);

        const result = hasMinimumFundsToCancel({ mainAccount, transactionToUpdate });

        expect(result).toBe(true);
        expect(mockGetEnv).toHaveBeenCalledWith(envVar);
        expect(mockGetEstimatedFees).toHaveBeenCalledWith(transactionToUpdate);
      });

      test("should return false if does not have enough funds", () => {
        // Mock the necessary dependencies
        mockGetEnv.mockReturnValue(new BigNumber(2) as any);
        mockGetEstimatedFees.mockReturnValue(new BigNumber(100));
        mainAccount.balance = new BigNumber(200);

        const result = hasMinimumFundsToCancel({ mainAccount, transactionToUpdate });

        expect(result).toBe(false);
        expect(mockGetEnv).toHaveBeenCalledWith(envVar);
        expect(mockGetEstimatedFees).toHaveBeenCalledWith(transactionToUpdate);
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
          mockGetEnv.mockReturnValue(new BigNumber(2) as any);
          mockGetEstimatedFees.mockReturnValue(new BigNumber(100));
          mainAccount.balance = new BigNumber(defaultBalance + 1);

          const result = hasMinimumFundsToSpeedUp({
            account,
            mainAccount,
            transactionToUpdate,
          });

          expect(result).toBe(true);
          expect(mockGetEnv).toHaveBeenCalledWith(envVar);
          expect(mockGetEstimatedFees).toHaveBeenCalledWith(transactionToUpdate);
        });

        test("should return false if does not have enough funds", () => {
          // Mock the necessary dependencies
          mockGetEnv.mockReturnValue(new BigNumber(2) as any);
          mockGetEstimatedFees.mockReturnValue(new BigNumber(100));
          mainAccount.balance = new BigNumber(defaultBalance);

          const result = hasMinimumFundsToSpeedUp({
            account,
            mainAccount,
            transactionToUpdate,
          });

          expect(result).toBe(false);
          expect(mockGetEnv).toHaveBeenCalledWith(envVar);
          expect(mockGetEstimatedFees).toHaveBeenCalledWith(transactionToUpdate);
        });
      });
    });
  });
});
