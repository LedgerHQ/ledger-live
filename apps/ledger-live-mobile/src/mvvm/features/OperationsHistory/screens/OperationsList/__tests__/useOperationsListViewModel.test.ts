import { act } from "@testing-library/react-native";
import { renderHook } from "@tests/test-renderer";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { usdcToken, maticEth } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { Account } from "@ledgerhq/types-live";
import type { State } from "~/reducers/types";
import { useOperationsListViewModel } from "../useOperationsListViewModel";

// ─── Hook behaviours — mock needed because useOperationsV1 uses selectors ───

const mockUseOperationsV1 = jest.fn();

jest.mock("~/screens/Analytics/Operations/useOperationsV1", () => ({
  useOperationsV1: (...args: unknown[]) => mockUseOperationsV1(...args),
}));

describe("useOperationsListViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOperationsV1.mockReturnValue({ sections: [], completed: true });
  });

  it("isEmpty is true when completed with no sections", () => {
    const { result } = renderHook(() => useOperationsListViewModel());
    expect(result.current.isEmpty).toBe(true);
  });

  it("isEmpty is false when not completed", () => {
    mockUseOperationsV1.mockReturnValue({ sections: [], completed: false });
    const { result } = renderHook(() => useOperationsListViewModel());
    expect(result.current.isEmpty).toBe(false);
  });

  it("onEndReached increments the operation count when not completed", () => {
    mockUseOperationsV1.mockReturnValue({ sections: [], completed: false });
    const { result } = renderHook(() => useOperationsListViewModel());
    const firstCallCount = mockUseOperationsV1.mock.calls.length;

    act(() => result.current.onEndReached());

    expect(mockUseOperationsV1.mock.calls.length).toBeGreaterThan(firstCallCount);
    const lastArgs = mockUseOperationsV1.mock.calls.at(-1);
    expect(lastArgs[1]).toBeGreaterThan(50); // opCount increased beyond initial
  });

  it("onEndReached does nothing when already completed", () => {
    const { result } = renderHook(() => useOperationsListViewModel());
    const callsBefore = mockUseOperationsV1.mock.calls.length;

    act(() => result.current.onEndReached());

    expect(mockUseOperationsV1.mock.calls.length).toBe(callsBefore);
  });

  describe("markOperationsAsSeen on unmount", () => {
    it("sets lastSeenOperationDate in store when the hook unmounts", () => {
      const { unmount, store } = renderHook(() => useOperationsListViewModel());

      expect(store.getState().history.lastSeenOperationDate).toBeNull();

      act(() => {
        unmount();
      });

      expect(store.getState().history.lastSeenOperationDate).not.toBeNull();
    });
  });

  describe("accountIds scoping", () => {
    it("filters root accounts to those whose tree intersects the given accountIds", () => {
      const ethereum = getCryptoCurrencyById("ethereum");
      const bitcoin = getCryptoCurrencyById("bitcoin");
      const ethAccount = genAccount("eth-filter", { currency: ethereum });
      const btcAccount = genAccount("btc-filter", { currency: bitcoin });

      const { result } = renderHook(() => useOperationsListViewModel([btcAccount.id]), {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: { ...state.accounts, active: [ethAccount, btcAccount] },
        }),
      });

      expect(result.current.accounts).toHaveLength(1);
      expect(result.current.accounts[0].id).toBe(btcAccount.id);
      expect(result.current.flattenedAccounts.every(a => a.id.includes("btc"))).toBe(true);
    });

    it("returns all accounts when accountIds is undefined", () => {
      const ethereum = getCryptoCurrencyById("ethereum");
      const bitcoin = getCryptoCurrencyById("bitcoin");
      const ethAccount = genAccount("eth-nofilter", { currency: ethereum });
      const btcAccount = genAccount("btc-nofilter", { currency: bitcoin });

      const { result } = renderHook(() => useOperationsListViewModel(), {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: { ...state.accounts, active: [ethAccount, btcAccount] },
        }),
      });

      expect(result.current.accounts).toHaveLength(2);
    });

    it("keeps the parent root when only a token sub-account id is provided", () => {
      const ethereum = getCryptoCurrencyById("ethereum");
      const ethRoot = genAccount("eth-token-scope", {
        currency: ethereum,
        subAccountsCount: 0,
      });
      const usdc = genTokenAccount(0, ethRoot, usdcToken);
      const matic = genTokenAccount(1, ethRoot, maticEth);
      const ethTree: Account = { ...ethRoot, subAccounts: [usdc, matic] };

      const { result } = renderHook(() => useOperationsListViewModel([usdc.id]), {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: { ...state.accounts, active: [ethTree] },
        }),
      });

      expect(result.current.accounts).toHaveLength(1);
      expect(result.current.accounts[0].id).toBe(ethTree.id);
      expect(result.current.flattenedAccounts.map(a => a.id)).toEqual(
        expect.arrayContaining([ethTree.id, usdc.id, matic.id]),
      );

      // The scoping filter is forwarded to useOperationsV1 so only USDC ops survive.
      const lastCall = mockUseOperationsV1.mock.calls.at(-1);
      const filter = lastCall?.[2]?.filterOperation;
      expect(typeof filter).toBe("function");
      expect(filter({} as never, usdc)).toBe(true);
      expect(filter({} as never, matic)).toBe(false);
      expect(filter({} as never, ethTree)).toBe(false);
    });
  });

  describe("accountByAddress", () => {
    // EVM chains share the same address format — Base, OP Mainnet, and Ethereum accounts
    // all have identical 0x addresses. The map must key by currencyId:address so that
    // accounts on different chains coexist without overwriting each other.
    it("gives each EVM account its own entry when multiple chains share the same address", () => {
      const sharedAddress = "0xabcdef1234567890abcdef1234567890abcdef12";
      const ethereum = getCryptoCurrencyById("ethereum");
      const bitcoin = getCryptoCurrencyById("bitcoin");
      const ethAccount = {
        ...genAccount("eth-shared-addr", { currency: ethereum }),
        freshAddress: sharedAddress,
      };
      const btcAccount = {
        ...genAccount("btc-shared-addr", { currency: bitcoin }),
        freshAddress: sharedAddress,
      };

      const { result } = renderHook(() => useOperationsListViewModel(), {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: { ...state.accounts, active: [ethAccount, btcAccount] },
        }),
      });

      const map = result.current.accountByAddress;
      expect(map.size).toBe(2);
      expect(map.get(`${ethereum.id}:${sharedAddress}`)).toBe(ethAccount);
      expect(map.get(`${bitcoin.id}:${sharedAddress}`)).toBe(btcAccount);
    });
  });
});
