import { TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { isAccountEmpty } from "./helpers";
import { createMockCantonAccount, createMockPendingTransferProposal } from "./test/fixtures";

describe("isAccountEmpty", () => {
  describe("when account is not of type Account", () => {
    it("should return false for TokenAccount", () => {
      const tokenAccount: TokenAccount = {
        type: "TokenAccount",
        id: "token-account-id",
        parentId: "parent-account-id",
        token: {
          type: "TokenCurrency",
          id: "token-id",
          contractAddress: "0x123",
          name: "Test Token",
          ticker: "TEST",
          decimals: 18,
          parentCurrency: {
            id: "ethereum",
            type: "CryptoCurrency",
            name: "Ethereum",
            ticker: "ETH",
            family: "evm",
            units: [],
            explorerViews: [],
          },
        },
        balance: new BigNumber(0),
        spendableBalance: new BigNumber(0),
        operationsCount: 0,
        operations: [],
        pendingOperations: [],
        balanceHistoryCache: {
          HOUR: { latestDate: null, balances: [] },
          DAY: { latestDate: null, balances: [] },
          WEEK: { latestDate: null, balances: [] },
        },
        swapHistory: [],
        creationDate: new Date(),
        balanceHistory: [],
      };

      expect(isAccountEmpty(tokenAccount)).toBe(false);
    });
  });

  describe("when account is not a Canton account", () => {
    it("should return false for non-Canton account", () => {
      const { cantonResources, ...nonCantonAccount } = createMockCantonAccount();
      expect(isAccountEmpty(nonCantonAccount)).toBe(false);
    });
  });

  describe("when account is a Canton account", () => {
    it("should return true for empty account (zero operations, zero balance, no subAccounts, no pending proposals)", () => {
      const emptyAccount = createMockCantonAccount();

      expect(isAccountEmpty(emptyAccount)).toBe(true);
    });

    it("should return false when account has operations", () => {
      const accountWithOperations = createMockCantonAccount({
        operationsCount: 1,
      });

      expect(isAccountEmpty(accountWithOperations)).toBe(false);
    });

    it("should return false when account has non-zero balance", () => {
      const accountWithBalance = createMockCantonAccount({
        balance: new BigNumber(100),
      });

      expect(isAccountEmpty(accountWithBalance)).toBe(false);
    });

    it("should return false when account has subAccounts", () => {
      const accountWithSubAccounts = createMockCantonAccount({
        subAccounts: [
          {
            type: "TokenAccount",
            id: "token-account-id",
            parentId: "parent-id",
            token: {
              type: "TokenCurrency",
              id: "token-id",
              contractAddress: "0x123",
              name: "Test Token",
              ticker: "TEST",
              decimals: 18,
              parentCurrency: createMockCantonAccount().currency,
            },
            balance: new BigNumber(0),
            spendableBalance: new BigNumber(0),
            operationsCount: 0,
            operations: [],
            pendingOperations: [],
            balanceHistoryCache: {
              HOUR: { latestDate: null, balances: [] },
              DAY: { latestDate: null, balances: [] },
              WEEK: { latestDate: null, balances: [] },
            },
            swapHistory: [],
            creationDate: new Date(),
            balanceHistory: [],
          },
        ],
      });

      expect(isAccountEmpty(accountWithSubAccounts)).toBe(false);
    });

    it("should return false when account has pending transfer proposals", () => {
      const accountWithPendingProposals = createMockCantonAccount(
        {},
        {
          pendingTransferProposals: [createMockPendingTransferProposal()],
        },
      );

      expect(isAccountEmpty(accountWithPendingProposals)).toBe(false);
    });

    it("should return false when account has operations and balance", () => {
      const accountWithBoth = createMockCantonAccount({
        operationsCount: 5,
        balance: new BigNumber(1000),
      });

      expect(isAccountEmpty(accountWithBoth)).toBe(false);
    });

    it("should return false when account has operations and subAccounts", () => {
      const accountWithOperationsAndSubAccounts = createMockCantonAccount({
        operationsCount: 2,
        subAccounts: [
          {
            type: "TokenAccount",
            id: "token-account-id",
            parentId: "parent-id",
            token: {
              type: "TokenCurrency",
              id: "token-id",
              contractAddress: "0x123",
              name: "Test Token",
              ticker: "TEST",
              decimals: 18,
              parentCurrency: createMockCantonAccount().currency,
            },
            balance: new BigNumber(0),
            spendableBalance: new BigNumber(0),
            operationsCount: 0,
            operations: [],
            pendingOperations: [],
            balanceHistoryCache: {
              HOUR: { latestDate: null, balances: [] },
              DAY: { latestDate: null, balances: [] },
              WEEK: { latestDate: null, balances: [] },
            },
            swapHistory: [],
            creationDate: new Date(),
            balanceHistory: [],
          },
        ],
      });

      expect(isAccountEmpty(accountWithOperationsAndSubAccounts)).toBe(false);
    });

    it("should return false when account has balance and pending proposals", () => {
      const accountWithBalanceAndProposals = createMockCantonAccount(
        {
          balance: new BigNumber(500),
        },
        {
          pendingTransferProposals: [createMockPendingTransferProposal()],
        },
      );

      expect(isAccountEmpty(accountWithBalanceAndProposals)).toBe(false);
    });

    it("should return false when account has all non-empty indicators", () => {
      const fullyUsedAccount = createMockCantonAccount(
        {
          operationsCount: 10,
          balance: new BigNumber(10000),
          subAccounts: [
            {
              type: "TokenAccount",
              id: "token-account-id",
              parentId: "parent-id",
              token: {
                type: "TokenCurrency",
                id: "token-id",
                contractAddress: "0x123",
                name: "Test Token",
                ticker: "TEST",
                decimals: 18,
                parentCurrency: createMockCantonAccount().currency,
              },
              balance: new BigNumber(100),
              spendableBalance: new BigNumber(100),
              operationsCount: 5,
              operations: [],
              pendingOperations: [],
              balanceHistoryCache: {
                HOUR: { latestDate: null, balances: [] },
                DAY: { latestDate: null, balances: [] },
                WEEK: { latestDate: null, balances: [] },
              },
              swapHistory: [],
              creationDate: new Date(),
              balanceHistory: [],
            },
          ],
        },
        {
          instrumentUtxoCounts: {
            "instrument-1": 5,
            "instrument-2": 3,
          },
          pendingTransferProposals: [createMockPendingTransferProposal()],
        },
      );

      expect(isAccountEmpty(fullyUsedAccount)).toBe(false);
    });

    it("should handle undefined subAccounts", () => {
      const accountWithUndefinedSubAccounts = createMockCantonAccount({
        subAccounts: undefined,
      });

      expect(isAccountEmpty(accountWithUndefinedSubAccounts)).toBe(true);
    });

    it("should handle empty subAccounts array", () => {
      const accountWithEmptySubAccounts = createMockCantonAccount();

      expect(isAccountEmpty(accountWithEmptySubAccounts)).toBe(true);
    });

    it("should handle empty pendingTransferProposals array", () => {
      const accountWithEmptyProposals = createMockCantonAccount();

      expect(isAccountEmpty(accountWithEmptyProposals)).toBe(true);
    });
  });
});
