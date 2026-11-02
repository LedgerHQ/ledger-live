import { track } from "@shared/analytics";
import { renderHook, act } from "@tests/test-renderer";
import BigNumber from "bignumber.js";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import {
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
  usdcToken,
  maticEth,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { Account } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import {
  MAX_PREVIEW_OPERATIONS,
  useRecentOperationsViewModel,
  type RecentOperationsParams,
} from "../useRecentOperationsViewModel";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

function withState(activeAccounts: Account[]) {
  return {
    overrideInitialState: (state: State): State => ({
      ...state,
      accounts: { ...state.accounts, active: activeAccounts },
    }),
  };
}

function withSixBtcConfirmations(account: Account) {
  return {
    overrideInitialState: function withSixConfirmations(state: State): State {
      return {
        ...state,
        accounts: { ...state.accounts, active: [account] },
        settings: {
          ...state.settings,
          currenciesSettings: {
            BTC: { confirmationsNb: 6, unit: mockBtcCryptoCurrency.units[0] },
          },
        },
      };
    },
  };
}

function genBitcoinAccounts(count: number, operationsSize = 0): Account[] {
  return Array.from({ length: count }, (_, i) =>
    genAccount(`bitcoin-${i}`, { currency: mockBtcCryptoCurrency, operationsSize }),
  );
}

function confirmOperations(account: Account): Account {
  return {
    ...account,
    operations: account.operations.map(function confirm(op) {
      return { ...op, blockHeight: account.blockHeight - 100 };
    }),
  };
}

function params(overrides: Partial<RecentOperationsParams>): RecentOperationsParams {
  return {
    accountIds: [],
    trackingPage: "Asset Detail",
    trackingCurrencyId: "bitcoin",
    ...overrides,
  };
}

describe("useRecentOperationsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("operations", () => {
    it("returns no operations without account ids", () => {
      const { result } = renderHook(() => useRecentOperationsViewModel(params({})));
      expect(result.current.operations).toEqual([]);
      expect(result.current.hasData).toBe(false);
    });

    it("returns no operations when the accounts have none", () => {
      const accounts = genBitcoinAccounts(2, 0);
      const { result } = renderHook(
        () => useRecentOperationsViewModel(params({ accountIds: accounts.map(a => a.id) })),
        withState(accounts),
      );
      expect(result.current.operations).toEqual([]);
    });

    it("returns at most MAX_PREVIEW_OPERATIONS operations", () => {
      const accounts = genBitcoinAccounts(2, 20);
      const { result } = renderHook(
        () => useRecentOperationsViewModel(params({ accountIds: accounts.map(a => a.id) })),
        withState(accounts),
      );

      expect(result.current.hasData).toBe(true);
      expect(result.current.operations).toHaveLength(MAX_PREVIEW_OPERATIONS);
    });

    it("returns no operations when no account matches the ids", () => {
      const ethAccount = genAccount("ethereum-0", {
        currency: mockEthCryptoCurrency,
        operationsSize: 10,
      });
      const { result } = renderHook(
        () => useRecentOperationsViewModel(params({ accountIds: ["unknown-id"] })),
        withState([ethAccount]),
      );

      expect(result.current.operations).toEqual([]);
    });
  });

  describe("pendingOperationIds", () => {
    it("flags an operation with a block height but not enough confirmations as pending", () => {
      const confirmed = confirmOperations(genBitcoinAccounts(1, 3)[0]);
      const [newest, ...older] = confirmed.operations;
      const account: Account = {
        ...confirmed,
        operations: [{ ...newest, blockHeight: confirmed.blockHeight }, ...older],
      };

      const { result } = renderHook(function useScopedViewModel() {
        return useRecentOperationsViewModel(params({ accountIds: [account.id] }));
      }, withSixBtcConfirmations(account));

      expect([...result.current.pendingOperationIds]).toEqual([newest.id]);
    });

    it("lists a pending operation older than the preview window first", () => {
      const confirmed = confirmOperations(genBitcoinAccounts(1, 6)[0]);
      const oldest = confirmed.operations[confirmed.operations.length - 1];
      const account: Account = {
        ...confirmed,
        operations: [
          ...confirmed.operations.slice(0, -1),
          { ...oldest, blockHeight: confirmed.blockHeight },
        ],
      };

      const { result } = renderHook(function useScopedViewModel() {
        return useRecentOperationsViewModel(params({ accountIds: [account.id] }));
      }, withSixBtcConfirmations(account));

      expect(result.current.operations).toHaveLength(MAX_PREVIEW_OPERATIONS);
      expect(result.current.operations[0].id).toBe(oldest.id);
      expect([...result.current.pendingOperationIds]).toEqual([oldest.id]);
    });

    it("lists a broadcast operation the explorer has not returned yet as pending", () => {
      const confirmed = confirmOperations(genBitcoinAccounts(1, 3)[0]);
      const broadcast = {
        ...confirmed.operations[0],
        id: "broadcast-op",
        hash: "broadcast-hash",
        blockHeight: null,
      };
      const account: Account = { ...confirmed, pendingOperations: [broadcast] };

      const { result } = renderHook(function useScopedViewModel() {
        return useRecentOperationsViewModel(params({ accountIds: [account.id] }));
      }, withSixBtcConfirmations(account));

      expect(result.current.operations[0].id).toBe(broadcast.id);
      expect([...result.current.pendingOperationIds]).toEqual([broadcast.id]);
    });

    it("drops a broadcast operation once the explorer returns it confirmed", () => {
      const confirmed = confirmOperations(genBitcoinAccounts(1, 3)[0]);
      const [newest] = confirmed.operations;
      const account: Account = {
        ...confirmed,
        pendingOperations: [{ ...newest, id: "broadcast-op", blockHeight: null }],
      };

      const { result } = renderHook(function useScopedViewModel() {
        return useRecentOperationsViewModel(params({ accountIds: [account.id] }));
      }, withSixBtcConfirmations(account));

      expect(result.current.operations.map(op => op.id)).not.toContain("broadcast-op");
      expect(result.current.pendingOperationIds.size).toBe(0);
    });

    it("returns no pending operations when all are confirmed", () => {
      const account = confirmOperations(genBitcoinAccounts(1, 3)[0]);

      const { result } = renderHook(
        function useScopedViewModel() {
          return useRecentOperationsViewModel(params({ accountIds: [account.id] }));
        },
        withState([account]),
      );

      expect(result.current.pendingOperationIds.size).toBe(0);
    });
  });

  describe("scoping", () => {
    it("returns only the token's operations for a token sub-account id (USDC on ETH)", () => {
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

      const { result } = renderHook(
        () => useRecentOperationsViewModel(params({ accountIds: [usdc.id] })),
        withState([ethTree]),
      );

      expect(result.current.operations.length).toBeGreaterThan(0);
      expect(result.current.operations.every(op => op.accountId === usdc.id)).toBe(true);
    });

    it("returns an account's own and its token operations, not another account's", () => {
      const ethRoot = genAccount("eth-account-scope", {
        currency: mockEthCryptoCurrency,
        subAccountsCount: 0,
        operationsSize: 1,
      });
      const usdc = genTokenAccount(0, ethRoot, usdcToken);
      const ethTree: Account = { ...ethRoot, subAccounts: [usdc] };
      const otherEth = genAccount("eth-other-account", {
        currency: mockEthCryptoCurrency,
        subAccountsCount: 0,
        operationsSize: 5,
      });

      const { result } = renderHook(
        () => useRecentOperationsViewModel(params({ accountIds: [ethTree.id, usdc.id] })),
        withState([ethTree, otherEth]),
      );

      const accountIds = result.current.operations.map(op => op.accountId);
      expect(accountIds.length).toBeGreaterThan(0);
      expect(accountIds.every(id => id === ethTree.id || id === usdc.id)).toBe(true);
    });
  });

  describe("accountByAddress", () => {
    it("builds a map keyed by currencyId:freshAddress from root accounts", () => {
      const accounts = genBitcoinAccounts(2, 1);
      const { result } = renderHook(
        () => useRecentOperationsViewModel(params({ accountIds: accounts.map(a => a.id) })),
        withState(accounts),
      );

      expect(result.current.accountByAddress.size).toBeGreaterThan(0);
    });

    it("returns an empty map when there are no scoped accounts", () => {
      const { result } = renderHook(() => useRecentOperationsViewModel(params({})));
      expect(result.current.accountByAddress.size).toBe(0);
    });
  });

  describe("onHeaderPress", () => {
    it("navigates to OperationsHistory with the scoped account ids and tracks the page", () => {
      const accounts = genBitcoinAccounts(1, 5);
      const { result } = renderHook(
        () =>
          useRecentOperationsViewModel(
            params({ accountIds: accounts.map(a => a.id), trackingPage: "Account Detail" }),
          ),
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
        page: "Account Detail",
      });
    });
  });

  describe("findAccount", () => {
    it("resolves an account by operation accountId", () => {
      const accounts = genBitcoinAccounts(1, 5);
      const { result } = renderHook(
        () => useRecentOperationsViewModel(params({ accountIds: accounts.map(a => a.id) })),
        withState(accounts),
      );

      const [op] = result.current.operations;
      expect(result.current.findAccount(op.accountId)?.account.id).toBe(op.accountId);
    });

    it("returns null for an unknown accountId", () => {
      const accounts = genBitcoinAccounts(1, 5);
      const { result } = renderHook(
        () => useRecentOperationsViewModel(params({ accountIds: accounts.map(a => a.id) })),
        withState(accounts),
      );

      expect(result.current.findAccount("unknown-id")).toBeNull();
    });
  });
});
