import { renderHook, act } from "@testing-library/react-native";
import { AppState, AppStateStatus } from "react-native";
import { useDeeplinkDrawerCleanup } from "../useDeeplinkDrawerCleanup";

const mockCloseAllDrawers = jest.fn();

jest.mock("LLM/components/QueuedDrawer/QueuedDrawersContext", () => ({
  useQueuedDrawerContext: () => ({
    closeAllDrawers: mockCloseAllDrawers,
  }),
}));

describe("useDeeplinkDrawerCleanup", () => {
  let appStateListener: (nextAppState: AppStateStatus) => void;
  let mockSubscription: { remove: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockSubscription = { remove: jest.fn() };

    jest.spyOn(AppState, "addEventListener").mockImplementation((_event, listener) => {
      appStateListener = listener;
      return mockSubscription;
    });

    Object.defineProperty(AppState, "currentState", {
      value: "active",
      configurable: true,
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("should close all drawers when deeplink received after coming from background", () => {
    const { result } = renderHook(() => useDeeplinkDrawerCleanup());

    act(() => {
      appStateListener("background");
    });

    act(() => {
      result.current();
    });

    expect(mockCloseAllDrawers).toHaveBeenCalledTimes(1);
  });

  it("should not close drawers when deeplink received without coming from background", () => {
    const { result } = renderHook(() => useDeeplinkDrawerCleanup());

    act(() => {
      result.current();
    });

    expect(mockCloseAllDrawers).not.toHaveBeenCalled();
  });

  it("should reset background flag after returning to foreground", () => {
    const { result } = renderHook(() => useDeeplinkDrawerCleanup());

    act(() => {
      appStateListener("background");
    });

    act(() => {
      appStateListener("active");
    });

    act(() => {
      jest.advanceTimersByTime(250);
    });

    act(() => {
      result.current();
    });

    expect(mockCloseAllDrawers).not.toHaveBeenCalled();
  });
});
