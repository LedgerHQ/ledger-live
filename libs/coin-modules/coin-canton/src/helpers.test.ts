import { TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { isAccountEmpty } from "./helpers";
import { createMockAccount } from "./test/fixtures";
import { CantonAccount } from "./types";

describe("isAccountEmpty", () => {
  const createCantonAccount = (overrides: Partial<CantonAccount> = {}): CantonAccount => {
    const baseAccount = createMockAccount(overrides);
    return {
      ...baseAccount,
      cantonResources: {
        instrumentUtxoCounts: {},
        pendingTransferProposals: [],
        ...overrides.cantonResources,
      },
    };
  };

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
      const nonCantonAccount = createMockAccount({
        currency: {
          ...createMockAccount().currency,
          family: "ethereum",
        },
      });

      expect(isAccountEmpty(nonCantonAccount)).toBe(false);
    });
  });

  describe("when account is a Canton account", () => {
    it("should return true for empty account (zero operations, zero balance, no subAccounts, no pending proposals)", () => {
      const emptyAccount = createCantonAccount({
        operationsCount: 0,
        balance: new BigNumber(0),
        subAccounts: [],
        cantonResources: {
          instrumentUtxoCounts: {},
          pendingTransferProposals: [],
        },
      });

      expect(isAccountEmpty(emptyAccount)).toBe(true);
    });

    it("should return false when account has operations", () => {
      const accountWithOperations = createCantonAccount({
        operationsCount: 1,
        balance: new BigNumber(0),
        subAccounts: [],
        cantonResources: {
          instrumentUtxoCounts: {},
          pendingTransferProposals: [],
        },
      });

      expect(isAccountEmpty(accountWithOperations)).toBe(false);
    });

    it("should return false when account has non-zero balance", () => {
      const accountWithBalance = createCantonAccount({
        operationsCount: 0,
        balance: new BigNumber(100),
        subAccounts: [],
        cantonResources: {
          instrumentUtxoCounts: {},
          pendingTransferProposals: [],
        },
      });

      expect(isAccountEmpty(accountWithBalance)).toBe(false);
    });

    it("should return false when account has subAccounts", () => {
      const accountWithSubAccounts = createCantonAccount({
        operationsCount: 0,
        balance: new BigNumber(0),
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
              parentCurrency: createMockAccount().currency,
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
        cantonResources: {
          instrumentUtxoCounts: {},
          pendingTransferProposals: [],
        },
      });

      expect(isAccountEmpty(accountWithSubAccounts)).toBe(false);
    });

    it("should return false when account has pending transfer proposals", () => {
      const accountWithPendingProposals = createCantonAccount({
        operationsCount: 0,
        balance: new BigNumber(0),
        subAccounts: [],
        cantonResources: {
          instrumentUtxoCounts: {},
          pendingTransferProposals: [
            {
              contract_id: "contract-123",
              sender: "sender-address",
              receiver: "receiver-address",
              instrument_id: "instrument-123",
              amount: "100",
              memo: "test memo",
              expires_at_micros: Date.now() * 1000 + 86400000000,
            },
          ],
        },
      });

      expect(isAccountEmpty(accountWithPendingProposals)).toBe(false);
    });

    it("should return false when account has operations and balance", () => {
      const accountWithBoth = createCantonAccount({
        operationsCount: 5,
        balance: new BigNumber(1000),
        subAccounts: [],
        cantonResources: {
          instrumentUtxoCounts: {},
          pendingTransferProposals: [],
        },
      });

      expect(isAccountEmpty(accountWithBoth)).toBe(false);
    });

    it("should return false when account has operations and subAccounts", () => {
      const accountWithOperationsAndSubAccounts = createCantonAccount({
        operationsCount: 2,
        balance: new BigNumber(0),
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
              parentCurrency: createMockAccount().currency,
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
        cantonResources: {
          instrumentUtxoCounts: {},
          pendingTransferProposals: [],
        },
      });

      expect(isAccountEmpty(accountWithOperationsAndSubAccounts)).toBe(false);
    });

    it("should return false when account has balance and pending proposals", () => {
      const accountWithBalanceAndProposals = createCantonAccount({
        operationsCount: 0,
        balance: new BigNumber(500),
        subAccounts: [],
        cantonResources: {
          instrumentUtxoCounts: {},
          pendingTransferProposals: [
            {
              contract_id: "contract-456",
              sender: "sender-address",
              receiver: "receiver-address",
              instrument_id: "instrument-456",
              amount: "50",
              memo: "test memo",
              expires_at_micros: Date.now() * 1000 + 86400000000, // 1 day from now
            },
          ],
        },
      });

      expect(isAccountEmpty(accountWithBalanceAndProposals)).toBe(false);
    });

    it("should return false when account has all non-empty indicators", () => {
      const fullyUsedAccount = createCantonAccount({
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
              parentCurrency: createMockAccount().currency,
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
        cantonResources: {
          instrumentUtxoCounts: {
            "instrument-1": 5,
            "instrument-2": 3,
          },
          pendingTransferProposals: [
            {
              contract_id: "contract-789",
              sender: "sender-address",
              receiver: "receiver-address",
              instrument_id: "instrument-789",
              amount: "200",
              memo: "test memo",
              expires_at_micros: Date.now() * 1000 + 86400000000, // 1 day from now
            },
          ],
        },
      });

      expect(isAccountEmpty(fullyUsedAccount)).toBe(false);
    });

    it("should handle undefined subAccounts", () => {
      const accountWithUndefinedSubAccounts = createCantonAccount({
        operationsCount: 0,
        balance: new BigNumber(0),
        subAccounts: undefined,
        cantonResources: {
          instrumentUtxoCounts: {},
          pendingTransferProposals: [],
        },
      });

      expect(isAccountEmpty(accountWithUndefinedSubAccounts)).toBe(true);
    });

    it("should handle empty subAccounts array", () => {
      const accountWithEmptySubAccounts = createCantonAccount({
        operationsCount: 0,
        balance: new BigNumber(0),
        subAccounts: [],
        cantonResources: {
          instrumentUtxoCounts: {},
          pendingTransferProposals: [],
        },
      });

      expect(isAccountEmpty(accountWithEmptySubAccounts)).toBe(true);
    });

    it("should handle empty pendingTransferProposals array", () => {
      const accountWithEmptyProposals = createCantonAccount({
        operationsCount: 0,
        balance: new BigNumber(0),
        subAccounts: [],
        cantonResources: {
          instrumentUtxoCounts: {},
          pendingTransferProposals: [],
        },
      });

      expect(isAccountEmpty(accountWithEmptyProposals)).toBe(true);
    });
  });
});
