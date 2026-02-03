/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useSendFlowAccount } from "../send/hooks/useSendFlowAccount";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

// Mock getAccountCurrency
jest.mock("../../account/helpers", () => ({
  getAccountCurrency: jest.fn((account: Account | TokenAccount) => {
    if ("token" in account) {
      return account.token;
    }
    return account.currency;
  }),
}));

// Test fixtures
const mockCurrency: CryptoCurrency = {
  type: "CryptoCurrency",
  id: "bitcoin",
  name: "Bitcoin",
  ticker: "BTC",
  family: "bitcoin",
  color: "#ffae35",
  units: [{ name: "bitcoin", code: "BTC", magnitude: 8 }],
  managerAppName: "Bitcoin",
  coinType: 0,
  scheme: "bitcoin",
  blockAvgTime: 600,
  ethereumLikeInfo: undefined,
  explorerViews: [],
  keywords: ["btc", "bitcoin"],
} as unknown as CryptoCurrency;

const mockTokenCurrency: TokenCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usd_coin",
  name: "USD Coin",
  ticker: "USDC",
  parentCurrency: {
    type: "CryptoCurrency",
    id: "ethereum",
    name: "Ethereum",
    ticker: "ETH",
    family: "evm",
  } as unknown as CryptoCurrency,
  tokenType: "erc20",
  units: [{ name: "USDC", code: "USDC", magnitude: 6 }],
} as unknown as TokenCurrency;

const mockAccount: Account = {
  type: "Account",
  id: "btc-account-1",
  currency: mockCurrency,
  balance: BigInt(100000000),
  spendableBalance: BigInt(100000000),
  name: "Bitcoin Account",
  starred: false,
  used: true,
  seedIdentifier: "seed-1",
  freshAddress: "bc1q...",
  freshAddressPath: "84'/0'/0'/0/0",
  index: 0,
  operationsCount: 10,
  operations: [],
  pendingOperations: [],
  blockHeight: 800000,
  lastSyncDate: new Date(),
  creationDate: new Date(),
} as unknown as Account;

const mockTokenAccount: TokenAccount = {
  type: "TokenAccount",
  id: "eth-token-usdc-1",
  token: mockTokenCurrency,
  parentId: "eth-account-1",
  balance: BigInt(1000000000),
  spendableBalance: BigInt(1000000000),
  operations: [],
  pendingOperations: [],
  operationsCount: 5,
  starred: false,
  creationDate: new Date(),
} as unknown as TokenAccount;

const mockParentAccount: Account = {
  type: "Account",
  id: "eth-account-1",
  currency: {
    type: "CryptoCurrency",
    id: "ethereum",
    name: "Ethereum",
    ticker: "ETH",
    family: "evm",
  } as unknown as CryptoCurrency,
  balance: BigInt(1000000000000000000),
  spendableBalance: BigInt(1000000000000000000),
  name: "Ethereum Account",
  starred: false,
  used: true,
  seedIdentifier: "seed-1",
  freshAddress: "0x...",
  freshAddressPath: "44'/60'/0'/0/0",
  index: 0,
  operationsCount: 20,
  operations: [],
  pendingOperations: [],
  blockHeight: 18000000,
  lastSyncDate: new Date(),
  creationDate: new Date(),
  subAccounts: [mockTokenAccount],
} as unknown as Account;

describe("useSendFlowAccount", () => {
  describe("initialization", () => {
    it("should initialize with null values when no initial account provided", () => {
      const { result } = renderHook(() => useSendFlowAccount());

      expect(result.current.state).toEqual({
        account: null,
        parentAccount: null,
        currency: null,
      });
      expect(result.current.hasAccount).toBe(false);
      expect(result.current.currencyId).toBeNull();
    });

    it("should initialize with provided account", () => {
      const { result } = renderHook(() =>
        useSendFlowAccount({
          initialAccount: mockAccount,
        }),
      );

      expect(result.current.state.account).toBe(mockAccount);
      expect(result.current.state.parentAccount).toBeNull();
      expect(result.current.state.currency).toBe(mockCurrency);
      expect(result.current.hasAccount).toBe(true);
      expect(result.current.currencyId).toBe("bitcoin");
    });

    it("should initialize with token account and parent", () => {
      const { result } = renderHook(() =>
        useSendFlowAccount({
          initialAccount: mockTokenAccount,
          initialParentAccount: mockParentAccount,
        }),
      );

      expect(result.current.state.account).toBe(mockTokenAccount);
      expect(result.current.state.parentAccount).toBe(mockParentAccount);
      expect(result.current.state.currency).toBe(mockTokenCurrency);
      expect(result.current.hasAccount).toBe(true);
      expect(result.current.currencyId).toBe("ethereum/erc20/usd_coin");
    });
  });

  describe("setAccount", () => {
    it("should update account state", () => {
      const { result } = renderHook(() => useSendFlowAccount());

      act(() => {
        result.current.setAccount(mockAccount);
      });

      expect(result.current.state.account).toBe(mockAccount);
      expect(result.current.state.currency).toBe(mockCurrency);
      expect(result.current.hasAccount).toBe(true);
    });

    it("should update account with parent account", () => {
      const { result } = renderHook(() => useSendFlowAccount());

      act(() => {
        result.current.setAccount(mockTokenAccount, mockParentAccount);
      });

      expect(result.current.state.account).toBe(mockTokenAccount);
      expect(result.current.state.parentAccount).toBe(mockParentAccount);
      expect(result.current.state.currency).toBe(mockTokenCurrency);
    });

    it("should replace existing account", () => {
      const { result } = renderHook(() =>
        useSendFlowAccount({
          initialAccount: mockAccount,
        }),
      );

      act(() => {
        result.current.setAccount(mockTokenAccount, mockParentAccount);
      });

      expect(result.current.state.account).toBe(mockTokenAccount);
      expect(result.current.state.parentAccount).toBe(mockParentAccount);
    });
  });

  describe("clearAccount", () => {
    it("should clear account state", () => {
      const { result } = renderHook(() =>
        useSendFlowAccount({
          initialAccount: mockAccount,
        }),
      );

      expect(result.current.hasAccount).toBe(true);

      act(() => {
        result.current.clearAccount();
      });

      expect(result.current.state).toEqual({
        account: null,
        parentAccount: null,
        currency: null,
      });
      expect(result.current.hasAccount).toBe(false);
      expect(result.current.currencyId).toBeNull();
    });
  });

  describe("memoization", () => {
    it("should return stable function references", () => {
      const { result, rerender } = renderHook(() => useSendFlowAccount());

      const initialSetAccount = result.current.setAccount;
      const initialClearAccount = result.current.clearAccount;

      rerender();

      expect(result.current.setAccount).toBe(initialSetAccount);
      expect(result.current.clearAccount).toBe(initialClearAccount);
    });
  });
});
