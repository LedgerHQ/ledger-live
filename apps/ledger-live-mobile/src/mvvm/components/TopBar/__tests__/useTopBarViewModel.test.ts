import { renderHook, act } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { State } from "~/reducers/types";
import { expectedNavigationParams } from "../const";
import { useTopBarViewModel } from "../useTopBarViewModel";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const mockNavigation = { navigate: mockNavigate };

const withWeb3Hub = (enabled: boolean) => (state: State) => ({
  ...state,
  settings: {
    ...state.settings,
    overriddenFeatureFlags: {
      web3hub: { enabled },
    },
  },
});

describe("useTopBarViewModel", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("should call navigate with expected params when onMyLedgerPress is invoked", () => {
    const { result } = renderHook(() => useTopBarViewModel(mockNavigation as never));

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

  it("should call navigate with expected params when onSettingsPress is invoked", () => {
    const { result } = renderHook(() => useTopBarViewModel(mockNavigation as never));

    act(() => {
      result.current.onSettingsPress();
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(expectedNavigationParams.settings.name);
  });
});
