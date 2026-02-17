import { renderHook, act } from "@tests/test-renderer";
import { expectedNavigationParams } from "../const";
import { useTopBarViewModel } from "../useTopBarViewModel";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const mockNavigation = { navigate: mockNavigate };

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

  it("should call navigate with expected params when onDiscoverPress is invoked", () => {
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
