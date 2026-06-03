import { renderHook, act } from "@tests/test-renderer";
import BigNumber from "bignumber.js";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import {
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
  usdcToken,
  maticEth,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { Account, AccountLike, DistributionItem, TokenAccount } from "@ledgerhq/types-live";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import { useTransactionsViewModel, MAX_PREVIEW_OPERATIONS } from "../useTransactionsViewModel";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

function buildDistributionItem(
  currency: DistributionItem["currency"],
  accounts: AccountLike[],
): DistributionItem {
  return {
    currency,
    distribution: 1,
    accounts,
    amount: accounts.reduce((sum, a) => sum + a.balance.toNumber(), 0),
    countervalue: 0,
  };
}

function withState(activeAccounts: Account[]) {
  return {
    overrideInitialState: (state: State): State => ({
      ...state,
      accounts: {
        ...state.accounts,
        active: activeAccounts,
      },
    }),
  };
}

function genBitcoinAccounts(count: number, operationsSize = 0): Account[] {
  return Array.from({ length: count }, (_, i) =>
    genAccount(`bitcoin-${i}`, { currency: mockBtcCryptoCurrency, operationsSize }),
  );
}

describe("useTransactionsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("operations", () => {
    it("returns an empty array when currency and distributionItem are undefined", () => {
      const { result } = renderHook(() => useTransactionsViewModel(undefined, undefined));
      expect(result.current.operations).toEqual([]);
    });

    it("falls back to currency-scoped operations for a native currency when distributionItem is undefined", () => {
      const accounts = genBitcoinAccounts(1, 5);
      const { result } = renderHook(
        () => useTransactionsViewModel(mockBtcCryptoCurrency, undefined),
        withState(accounts),
      );
      expect(result.current.operations.length).toBeGreaterThan(0);
    });

    it("returns an empty array for a token currency when distributionItem is undefined", () => {
      const ethRoot = genAccount("eth-no-distribution", {
        currency: mockEthCryptoCurrency,
        subAccountsCount: 0,
        operationsSize: 5,
      });
      const usdc = genTokenAccount(0, ethRoot, usdcToken);
      const ethTree: Account = { ...ethRoot, subAccounts: [usdc] };

      const { result } = renderHook(
        () => useTransactionsViewModel(usdcToken, undefined),
        withState([ethTree]),
      );

      expect(result.current.operations).toEqual([]);
    });

    it("returns an empty array when accounts have no operations", () => {
      const accounts = genBitcoinAccounts(2, 0);
      const distributionItem = buildDistributionItem(mockBtcCryptoCurrency, accounts);
      const { result } = renderHook(
        () => useTransactionsViewModel(mockBtcCryptoCurrency, distributionItem),
        withState(accounts),
      );
      expect(result.current.operations).toEqual([]);
    });

    it("returns operations when accounts have them", () => {
      const accounts = genBitcoinAccounts(1, 10);
      const distributionItem = buildDistributionItem(mockBtcCryptoCurrency, accounts);
      const { result } = renderHook(
        () => useTransactionsViewModel(mockBtcCryptoCurrency, distributionItem),
        withState(accounts),
      );

      expect(result.current.operations.length).toBeGreaterThan(0);
      expect(result.current.operations.length).toBeLessThanOrEqual(MAX_PREVIEW_OPERATIONS);
    });

    it("limits operations to MAX_PREVIEW_OPERATIONS", () => {
      const accounts = genBitcoinAccounts(2, 20);
      const distributionItem = buildDistributionItem(mockBtcCryptoCurrency, accounts);
      const { result } = renderHook(
        () => useTransactionsViewModel(mockBtcCryptoCurrency, distributionItem),
        withState(accounts),
      );

      expect(result.current.operations.length).toBeLessThanOrEqual(MAX_PREVIEW_OPERATIONS);
    });

    it("returns no operations when distributionItem has no matching accounts", () => {
      const ethAccounts = Array.from({ length: 1 }, (_, i) =>
        genAccount(`ethereum-${i}`, { currency: mockEthCryptoCurrency, operationsSize: 10 }),
      );
      const distributionItem = buildDistributionItem(mockBtcCryptoCurrency, []);
      const { result } = renderHook(
        () => useTransactionsViewModel(mockBtcCryptoCurrency, distributionItem),
        withState(ethAccounts),
      );

      expect(result.current.operations).toEqual([]);
    });
  });

  describe("token scoping", () => {
    it("returns only the token's operations when viewing a token sub-account (USDC on ETH)", () => {
      const ethRoot = genAccount("eth-prev-scope", {
        currency: mockEthCryptoCurrency,
        subAccountsCount: 0,
        operationsSize: 5,
      });
      const usdc = genTokenAccount(0, ethRoot, usdcToken);
      const matic = genTokenAccount(1, ethRoot, maticEth);
      usdc.balance = new BigNumber(100);
      usdc.spendableBalance = new BigNumber(100);
      const ethTree: Account = { ...ethRoot, subAccounts: [usdc, matic] };

      const distributionItem = buildDistributionItem(usdcToken, [usdc]);

      const { result } = renderHook(
        () => useTransactionsViewModel(usdcToken, distributionItem),
        withState([ethTree]),
      );

      expect(result.current.operations.length).toBeGreaterThan(0);
      expect(result.current.operations.every(op => op.accountId === usdc.id)).toBe(true);
    });
  });

  describe("accountByAddress", () => {
    it("builds a map keyed by currencyId:freshAddress from root accounts", () => {
      const accounts = genBitcoinAccounts(2, 1);
      const distributionItem = buildDistributionItem(mockBtcCryptoCurrency, accounts);
      const { result } = renderHook(
        () => useTransactionsViewModel(mockBtcCryptoCurrency, distributionItem),
        withState(accounts),
      );

      expect(result.current.accountByAddress).toBeInstanceOf(Map);
      expect(result.current.accountByAddress.size).toBeGreaterThan(0);
    });

    it("returns an empty map when there are no scoped accounts", () => {
      const { result } = renderHook(() => useTransactionsViewModel(undefined, undefined));
      expect(result.current.accountByAddress.size).toBe(0);
    });
  });

  describe("onHeaderPress", () => {
    it("navigates to OperationsHistory with the scoped accountIds and fires analytics", () => {
      const accounts = genBitcoinAccounts(1, 5);
      const distributionItem = buildDistributionItem(mockBtcCryptoCurrency, accounts);
      const { result } = renderHook(
        () => useTransactionsViewModel(mockBtcCryptoCurrency, distributionItem),
        withState(accounts),
      );

      act(() => result.current.onHeaderPress());

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.OperationsHistory, {
        screen: ScreenName.OperationsList,
        params: { accountIds: accounts.map(a => a.id) },
      });
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Transactions",
        currency: "bitcoin",
        page: "Asset Detail",
      });
    });

    it("forwards the token's account ids for a token asset", () => {
      const ethRoot = genAccount("eth-token-nav", {
        currency: mockEthCryptoCurrency,
        subAccountsCount: 0,
        operationsSize: 0,
      });
      const usdc: TokenAccount = genTokenAccount(0, ethRoot, usdcToken);
      const ethTree: Account = { ...ethRoot, subAccounts: [usdc] };
      const distributionItem = buildDistributionItem(usdcToken, [usdc]);

      const { result } = renderHook(
        () => useTransactionsViewModel(usdcToken, distributionItem),
        withState([ethTree]),
      );

      act(() => result.current.onHeaderPress());

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.OperationsHistory, {
        screen: ScreenName.OperationsList,
        params: { accountIds: [usdc.id] },
      });
    });
  });

  describe("findAccount", () => {
    it("resolves an account by operation accountId", () => {
      const accounts = genBitcoinAccounts(1, 5);
      const distributionItem = buildDistributionItem(mockBtcCryptoCurrency, accounts);
      const { result } = renderHook(
        () => useTransactionsViewModel(mockBtcCryptoCurrency, distributionItem),
        withState(accounts),
      );

      const op = result.current.operations[0];
      if (!op) return;

      const resolved = result.current.findAccount(op.accountId);
      expect(resolved).not.toBeNull();
      expect(resolved?.account.id).toBe(op.accountId);
    });

    it("returns null for an unknown accountId", () => {
      const accounts = genBitcoinAccounts(1, 5);
      const distributionItem = buildDistributionItem(mockBtcCryptoCurrency, accounts);
      const { result } = renderHook(
        () => useTransactionsViewModel(mockBtcCryptoCurrency, distributionItem),
        withState(accounts),
      );

      expect(result.current.findAccount("unknown-id")).toBeNull();
    });
  });
});
