import { act, renderHook } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import type { State } from "~/reducers/types";
import useCryptoAddressesViewModel from "../useCryptoAddressesViewModel";
import { useGlobalSyncState } from "@ledgerhq/live-common/bridge/react/useGlobalSyncState";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/core", () => ({
  ...jest.requireActual("@react-navigation/core"),
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ name: "CryptoAddresses" }),
}));

jest.mock("@ledgerhq/live-common/bridge/react/useGlobalSyncState", () => ({
  useGlobalSyncState: jest.fn(),
}));

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");

const btcAccount = genAccount("btc1", { currency: bitcoin });
const ethAccount = genAccount("eth1", { currency: ethereum });
const tokenAccount = genTokenAccount(0, ethAccount, usdcToken);

const withAccounts =
  (accounts: State["accounts"]["active"]) =>
  (state: State): State => ({
    ...state,
    accounts: { ...state.accounts, active: accounts },
  });

const mockSyncState = (pending = false, error: Error | null = null) => {
  jest.mocked(useGlobalSyncState).mockReturnValue({ pending, error });
};

describe("useCryptoAddressesViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSyncState();
  });

  it("should return accounts, translations, and tracking metadata", () => {
    const { result } = renderHook(() => useCryptoAddressesViewModel(ScreenName.Portfolio), {
      overrideInitialState: withAccounts([btcAccount]),
    });

    expect(result.current.accounts.length).toBeGreaterThanOrEqual(1);
    expect(result.current.hasNoAccount).toBe(false);
    expect(result.current.title).toBe("Accounts");
    expect(result.current.addAccountLabel).toBe("Add account");
    expect(result.current.emptyStateLabel).toBe("No accounts yet");
    expect(result.current.trackingPage).toBe("CryptoAddresses");
    expect(result.current.sourceScreenName).toBe(ScreenName.Portfolio);
  });

  it("should report hasNoAccount when the store is empty", () => {
    const { result } = renderHook(() => useCryptoAddressesViewModel(), {
      overrideInitialState: withAccounts([]),
    });

    expect(result.current.accounts).toHaveLength(0);
    expect(result.current.hasNoAccount).toBe(true);
    expect(result.current.sourceScreenName).toBeUndefined();
  });

  it("should filter out blacklisted token accounts", () => {
    const parentWithToken = { ...ethAccount, subAccounts: [tokenAccount] };

    const { result } = renderHook(() => useCryptoAddressesViewModel(), {
      overrideInitialState: (state: State) => ({
        ...withAccounts([parentWithToken])(state),
        settings: { ...state.settings, blacklistedTokenIds: [tokenAccount.token.id] },
      }),
    });

    const tokenIds = result.current.accounts
      .filter(a => a.type === "TokenAccount")
      .map(a => (a as typeof tokenAccount).token.id);

    expect(tokenIds).not.toContain(tokenAccount.token.id);
  });

  describe("loading and error states", () => {
    it("should derive isLoading when sync is pending and not up to date", () => {
      mockSyncState(true);
      const outdatedAccount = { ...btcAccount, lastSyncDate: new Date(0) };

      const { result } = renderHook(() => useCryptoAddressesViewModel(), {
        overrideInitialState: withAccounts([outdatedAccount]),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it("should expose sync error", () => {
      const syncError = new Error("sync failed");
      mockSyncState(false, syncError);

      const { result } = renderHook(() => useCryptoAddressesViewModel(), {
        overrideInitialState: withAccounts([]),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(syncError);
    });
  });

  describe("add account flow", () => {
    it("should open drawer, track event, then close drawer", () => {
      const { result } = renderHook(() => useCryptoAddressesViewModel(), {
        overrideInitialState: withAccounts([]),
      });

      expect(result.current.isAddAccountOpen).toBe(false);

      act(() => result.current.onAddAccountPress());

      expect(result.current.isAddAccountOpen).toBe(true);
      expect(jest.mocked(track)).toHaveBeenCalledWith("button_clicked", {
        button: "add a new account",
        page: "CryptoAddresses",
      });

      act(() => result.current.onCloseAddAccount());

      expect(result.current.isAddAccountOpen).toBe(false);
    });
  });

  describe("account navigation", () => {
    it("should navigate and track for a regular Account", () => {
      const { result } = renderHook(() => useCryptoAddressesViewModel(), {
        overrideInitialState: withAccounts([btcAccount]),
      });

      act(() => result.current.onAccountPress(btcAccount));

      expect(mockNavigate).toHaveBeenCalledWith(ScreenName.Account, {
        accountId: btcAccount.id,
      });
      expect(jest.mocked(track)).toHaveBeenCalledWith("account_clicked", {
        currency: "Bitcoin",
        account: expect.any(String),
        page: "CryptoAddresses",
      });
    });

    it("should navigate and track for a TokenAccount", () => {
      const parentWithToken = { ...ethAccount, subAccounts: [tokenAccount] };

      const { result } = renderHook(() => useCryptoAddressesViewModel(), {
        overrideInitialState: withAccounts([parentWithToken]),
      });

      act(() => result.current.onAccountPress(tokenAccount));

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Accounts, {
        screen: ScreenName.Account,
        params: {
          currencyId: tokenAccount.token.parentCurrency.id,
          parentId: tokenAccount.parentId,
          accountId: tokenAccount.id,
        },
      });
      expect(jest.mocked(track)).toHaveBeenCalledWith("account_clicked", {
        currency: tokenAccount.token.parentCurrency.name,
        account: expect.any(String),
        page: "CryptoAddresses",
      });
    });
  });
});
