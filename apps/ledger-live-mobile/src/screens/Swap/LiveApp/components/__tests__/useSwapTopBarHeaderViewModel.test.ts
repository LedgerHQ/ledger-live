import { act, renderHook } from "@tests/test-renderer";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import { useTopBarViewModel } from "LLM/components/TopBar/useTopBarViewModel";
import { useSwapTopBarHeaderViewModel } from "../useSwapTopBarHeaderViewModel";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: jest.fn(),
}));

jest.mock("LLM/components/TopBar/useTopBarViewModel", () => ({
  useTopBarViewModel: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockOnMyLedgerPress = jest.fn();
const noop = jest.fn();

const mockedUseNavigation = jest.mocked(useNavigation);
const mockedTrack = jest.mocked(track);
const mockedUseTopBarViewModel = jest.mocked(useTopBarViewModel);

describe("useSwapTopBarHeaderViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigation.mockImplementation(() => ({ navigate: mockNavigate }));
    mockedUseTopBarViewModel.mockImplementation(() => ({
      onMyLedgerPress: mockOnMyLedgerPress,
      onDiscoverPress: noop,
      onNotificationsPress: noop,
      onSettingsPress: noop,
      hasUnreadNotifications: false,
    }));
  });

  it("should expose onMyLedgerPress from top bar view model", () => {
    const { result } = renderHook(() => useSwapTopBarHeaderViewModel());

    expect(result.current.onMyLedgerPress).toBe(mockOnMyLedgerPress);
  });

  it("should track and navigate to swap history when onSwapHistoryPress is called", () => {
    const { result } = renderHook(() => useSwapTopBarHeaderViewModel());

    act(() => {
      result.current.onSwapHistoryPress();
    });

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      button: "SwapHistory",
      page: "Swap",
    });
    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SwapSubScreens, {
      screen: ScreenName.SwapHistory,
    });
  });
});
