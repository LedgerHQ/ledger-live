import { act, renderHook } from "@tests/test-renderer";
import { AppState } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useAleoLiveBlockHeight as useSharedAleoLiveBlockHeight } from "@ledgerhq/live-common/families/aleo/react";
import { aleoCurrency } from "../../__mocks__/currency.mock";
import { useAleoLiveBlockHeight } from "../useAleoLiveBlockHeight";

jest.mock("@ledgerhq/live-common/families/aleo/react", () => ({
  useAleoLiveBlockHeight: jest.fn(() => 0),
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: jest.fn(() => true),
}));

const mockShared = jest.mocked(useSharedAleoLiveBlockHeight);

describe("useAleoLiveBlockHeight", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AppState.currentState = "active";
    jest.mocked(useIsFocused).mockReturnValue(true);
  });

  const lastOptions = () => mockShared.mock.calls[mockShared.mock.calls.length - 1][1];

  it("passes the caller's options through unpaused while the app is active", () => {
    renderHook(() => useAleoLiveBlockHeight(aleoCurrency, { fallbackHeight: 100, enabled: true }));

    expect(mockShared).toHaveBeenCalledWith(aleoCurrency, {
      fallbackHeight: 100,
      enabled: true,
      paused: false,
    });
  });

  it.each(["background", "inactive"] as const)("pauses the poll while the app is %s", state => {
    AppState.currentState = state;

    renderHook(() => useAleoLiveBlockHeight(aleoCurrency, { fallbackHeight: 100, enabled: true }));

    expect(lastOptions().paused).toBe(true);
  });

  it("unpauses when the app returns to active", () => {
    AppState.currentState = "background";

    renderHook(() => useAleoLiveBlockHeight(aleoCurrency, { fallbackHeight: 100, enabled: true }));
    expect(lastOptions().paused).toBe(true);

    const onChange = jest.mocked(AppState.addEventListener).mock.calls[0][1];
    act(() => onChange("active"));

    expect(lastOptions().paused).toBe(false);
  });

  // The account screen stays mounted under whatever is pushed on top of it, so an unpaused
  // poll here would keep hitting the node from a screen nobody is looking at.
  it("pauses the poll while the screen is not focused", () => {
    jest.mocked(useIsFocused).mockReturnValue(false);

    renderHook(() => useAleoLiveBlockHeight(aleoCurrency, { fallbackHeight: 100, enabled: true }));

    expect(lastOptions().paused).toBe(true);
  });

  it("removes the AppState subscription on unmount", () => {
    const { unmount } = renderHook(() =>
      useAleoLiveBlockHeight(aleoCurrency, { fallbackHeight: 100, enabled: true }),
    );

    const subscription = jest.mocked(AppState.addEventListener).mock.results[0].value;
    unmount();

    expect(subscription.remove).toHaveBeenCalledTimes(1);
  });
});
