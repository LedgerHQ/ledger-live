import { renderHook, withReadOnlyDisabled, act } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { State } from "~/reducers/types";
import { track } from "~/analytics";
import { expectedNavigationParams } from "../const";
import { useTopBarViewModel } from "../useTopBarViewModel";
import { useSyncIndicator } from "../hooks/useSyncIndicator";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("../hooks/useSyncIndicator");

const mockedUseSyncIndicator = jest.mocked(useSyncIndicator);

const defaultSyncState = {
  hasAccounts: false,
  isError: false,
  isPending: false,
  listOfErrorAccountNames: "",
  syncAccessibilityLabel: "Synchronize",
  errorCurrencyIds: [],
};

const mockNavigation = { navigate: mockNavigate };

const withWeb3Hub = (enabled: boolean) => (state: State) => ({
  ...state,
  featureFlags: {
    ...state.featureFlags,
    overrides: {
      web3hub: { enabled },
    },
  },
});

describe("useTopBarViewModel", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    (track as jest.Mock).mockClear();
    mockedUseSyncIndicator.mockReturnValue(defaultSyncState);
  });

  it("should call navigate with expected params when onMyLedgerPress is invoked", () => {
    const { result } = renderHook(() => useTopBarViewModel(mockNavigation as never), {
      overrideInitialState: withReadOnlyDisabled,
    });

    act(() => {
      result.current.onMyLedgerPress();
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(
      expectedNavigationParams.myLedger.name,
      expectedNavigationParams.myLedger.params,
    );
  });

  describe("onDiscoverPress", () => {
    it("should navigate to Discover when web3hub feature flag is absent", () => {
      const { result } = renderHook(() => useTopBarViewModel(mockNavigation as never));

      act(() => {
        result.current.onDiscoverPress();
      });

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(
        expectedNavigationParams.discover.name,
        expectedNavigationParams.discover.params,
      );
    });

    it("should navigate to Web3HubTab when web3hub feature flag is enabled", () => {
      const { result } = renderHook(() => useTopBarViewModel(mockNavigation as never), {
        overrideInitialState: withWeb3Hub(true),
      });

      act(() => {
        result.current.onDiscoverPress();
      });

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Web3HubTab, {
        screen: ScreenName.Web3HubMain,
      });
    });
  });

  it("should call navigate with expected params when onNotificationsPress is invoked", () => {
    const { result } = renderHook(() => useTopBarViewModel(mockNavigation as never));

    act(() => {
      result.current.onNotificationsPress();
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(
      expectedNavigationParams.notifications.name,
      expectedNavigationParams.notifications.params,
    );
  });

  it("should navigate to GlobalSearch and track button_clicked when onSearchPress is invoked", () => {
    const { result } = renderHook(() => useTopBarViewModel(mockNavigation as never));

    act(() => {
      result.current.onSearchPress();
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(
      expectedNavigationParams.search.name,
      expectedNavigationParams.search.params,
    );
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Search",
      page: ScreenName.Portfolio,
    });
  });

  it("should call navigate with expected params when onSettingsPress is invoked", () => {
    const { result } = renderHook(() => useTopBarViewModel(mockNavigation as never));

    act(() => {
      result.current.onSettingsPress();
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(expectedNavigationParams.settings.name);
  });

  it("should call navigate with expected params when onTransactionHistoryPress is invoked", () => {
    const { result } = renderHook(() => useTopBarViewModel(mockNavigation as never));

    act(() => {
      result.current.onTransactionHistoryPress();
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  describe("hasUnreadOperations", () => {
    it("should be false by default (null lastSeenOperationDate)", () => {
      const { result } = renderHook(() => useTopBarViewModel(mockNavigation as never));
      expect(result.current.hasUnreadOperations).toBe(false);
    });

    it("should be false when lastSeenOperationDate is set but no operations are newer", () => {
      const { result } = renderHook(() => useTopBarViewModel(mockNavigation as never), {
        overrideInitialState: (state: State) => ({
          ...state,
          history: { lastSeenOperationDate: "2099-01-01T00:00:00.000Z" },
        }),
      });
      expect(result.current.hasUnreadOperations).toBe(false);
    });
  });

  describe("sync drawer", () => {
    it("should open the drawer and track SyncErrorList with error currency ids on openSyncDrawer", () => {
      mockedUseSyncIndicator.mockReturnValue({
        ...defaultSyncState,
        isError: true,
        errorCurrencyIds: ["bitcoin", "ethereum"],
      });

      const { result } = renderHook(() => useTopBarViewModel(mockNavigation as never));

      expect(result.current.isSyncDrawerOpen).toBe(false);

      act(() => {
        result.current.openSyncDrawer();
      });

      expect(result.current.isSyncDrawerOpen).toBe(true);
      expect(track).toHaveBeenCalledWith("SyncErrorList", {
        currencies: ["bitcoin", "ethereum"],
        page: ScreenName.Portfolio,
      });
    });
  });
});
